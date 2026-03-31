'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveMeaning, getGender, getNativeLang, type Gender } from '@/lib/resolve'
import { t } from '@/lib/i18n'
import { AudioRecorder } from '@/lib/audioRecorder'

// ─── Types ───

interface GenderedForm {
  word: string
  romanization: string
}

interface VocabItem {
  word: string
  romanization: string
  meaning?: string
  meanings?: Record<string, string>
  toneClass?: string
  word_male?: string
  word_female?: string
  gendered?: {
    male?: GenderedForm
    female?: GenderedForm
  }
}

interface DrillModeProps {
  vocabulary: VocabItem[]
  lang: string
  onComplete: (xp: number) => void
}

interface EvalResult {
  stars: number
  transcript: string
  feedback: string
  correct_form: string
  try_again: boolean
}

// ─── Component ───

export default function DrillMode({ vocabulary, lang, onComplete }: DrillModeProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [stars, setStars] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [gender, setGender] = useState<Gender>('both')
  const [nativeLang, setNativeLang] = useState('en')

  const recorderRef = useRef<AudioRecorder | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  // Track mastered words for XP calculation
  const masteredRef = useRef(0)

  useEffect(() => {
    setGender(getGender(lang))
    setNativeLang(getNativeLang())
  }, [lang])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      recorderRef.current?.cancel()
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  // Auto-play TTS when card changes
  useEffect(() => {
    if (!vocabulary.length) return
    const item = vocabulary[currentIdx]
    if (!item) return
    const word = resolveDisplayWord(item, gender)
    speakText(word, lang, 0.75)
  }, [currentIdx, vocabulary, lang, gender])

  // ─── Handle empty vocabulary ───
  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div
        className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6 items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
          {t('noVocabulary', nativeLang)}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onComplete(0)}
          className="px-8 py-4 rounded-2xl font-bold text-white text-lg"
          style={{ background: 'var(--green)', boxShadow: '0 4px 0 var(--green-dark)' }}
        >
          Continue
        </motion.button>
      </div>
    )
  }

  const item = vocabulary[currentIdx]

  function resolveDisplayWord(v: VocabItem, g: Gender): string {
    if (g === 'male') return v.gendered?.male?.word || v.word
    if (g === 'female') return v.gendered?.female?.word || v.word
    return v.word
  }

  function resolveDisplayRomanization(v: VocabItem, g: Gender): string {
    if (g === 'male') return v.gendered?.male?.romanization || v.romanization
    if (g === 'female') return v.gendered?.female?.romanization || v.romanization
    return v.romanization
  }

  const displayWord = resolveDisplayWord(item, gender)
  const displayRomanization = resolveDisplayRomanization(item, gender)
  const displayMeaning = resolveMeaning(item.meanings || item.meaning, nativeLang)

  // ─── Recording toggle ───

  async function toggleRecording() {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  async function startRecording() {
    try {
      // Clean up previous audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
        setAudioUrl(null)
      }

      const recorder = new AudioRecorder(10000)
      recorderRef.current = recorder
      await recorder.start()
      setIsRecording(true)
      setFeedback('')
      setStars(0)
    } catch {
      setFeedback('Could not access microphone. Please check permissions.')
    }
  }

  async function stopRecording() {
    if (!recorderRef.current?.isRecording) return

    setIsRecording(false)
    setIsProcessing(true)

    try {
      const blob = await recorderRef.current.stop()
      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      setAudioUrl(url)
      await evaluateAudio(blob)
    } catch {
      if (mountedRef.current) {
        setFeedback('Recording failed. Please try again.')
        setIsProcessing(false)
      }
    }
  }

  // ─── Evaluation ───

  async function evaluateAudio(blob: Blob) {
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('expected', displayWord)
    formData.append('lang', lang)
    formData.append('gender', getGender(lang))
    formData.append('native_lang', getNativeLang())

    // Read level from profile
    let level = 'A1'
    try {
      const raw = localStorage.getItem('lingwa_profile')
      if (raw) {
        const profile = JSON.parse(raw)
        if (profile.level) level = profile.level
      }
    } catch { /* use default */ }
    formData.append('level', level)

    try {
      const res = await fetch('/api/evaluate-speech', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        if (mountedRef.current) {
          setFeedback('Evaluation failed. Please try again.')
          setIsProcessing(false)
        }
        return
      }

      const result: EvalResult = await res.json()

      if (!mountedRef.current) return

      setStars(result.stars)
      setFeedback(result.feedback)
      setAttempts(prev => prev + 1)
      setIsProcessing(false)

      // Speak feedback in native language
      if (result.feedback) {
        speakText(result.feedback, nativeLang)
      }

      // Auto-advance on perfect score
      if (result.stars >= 3) {
        masteredRef.current += 1
        setShowSuccess(true)
        setTimeout(() => {
          if (!mountedRef.current) return
          setShowSuccess(false)
          advanceToNext()
        }, 1500)
      }
    } catch {
      if (mountedRef.current) {
        setFeedback('Network error. Please try again.')
        setIsProcessing(false)
      }
    }
  }

  // ─── Navigation ───

  function advanceToNext() {
    // Clean up previous audio URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    if (currentIdx + 1 >= vocabulary.length) {
      // All words drilled
      onComplete(masteredRef.current * 5)
      return
    }

    setCurrentIdx(prev => prev + 1)
    setAttempts(0)
    setStars(0)
    setFeedback('')
    setAudioUrl(null)
  }

  function handleTryAgain() {
    setStars(0)
    setFeedback('')
    // Replay TTS for the word
    speakText(displayWord, lang, 0.75)
  }

  function handlePlaySelf() {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  // ─── Stars display ───

  function renderStars(count: number): string {
    return '⭐'.repeat(count) + '☆'.repeat(3 - count)
  }

  // ─── Render ───

  return (
    <div
      className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
          Pronunciation Drill
        </p>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {currentIdx + 1} / {vocabulary.length}
        </div>
      </div>

      {/* Dot progress */}
      <div className="flex gap-2 mb-8 justify-center flex-wrap">
        {vocabulary.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === currentIdx ? '24px' : '8px',
              background: i < currentIdx
                ? 'var(--green)'
                : i === currentIdx
                  ? 'var(--blue)'
                  : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center text-center"
        >
          {/* Target word */}
          <div
            className="font-black mb-2 leading-normal"
            style={{ fontSize: '64px', lineHeight: 1.4 }}
          >
            {displayWord}
          </div>

          {/* Romanization */}
          <div className="text-xl mb-1" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {displayRomanization}
          </div>

          {/* Meaning */}
          <div className="text-2xl font-bold mb-8">
            {displayMeaning}
          </div>

          {/* Speaker button (replay TTS) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => speakText(displayWord, lang, 0.75)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm mb-6"
            style={{
              background: 'var(--surface2)',
              border: '2px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <span className="text-xl">🔊</span>
            {t('tapToListen', nativeLang)}
          </motion.button>

          {/* Mic button */}
          {!isProcessing && !showSuccess && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleRecording}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl text-white mb-4"
              style={{
                background: isRecording ? 'var(--red)' : 'var(--blue)',
                boxShadow: isRecording
                  ? '0 4px 0 rgba(200,0,0,0.4)'
                  : '0 4px 0 rgba(0,100,200,0.4)',
              }}
              animate={isRecording ? { scale: [1, 1.08, 1] } : {}}
              transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
            >
              🎤
            </motion.button>
          )}

          {/* Mic label */}
          {!isProcessing && !showSuccess && (
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              {isRecording ? t('tapToStop', nativeLang) : t('tapToSpeak', nativeLang)}
            </p>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center mb-4"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 animate-pulse"
                style={{ background: 'var(--surface2)', border: '2px solid var(--border)' }}
              >
                ⏳
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('analysingYourSpeech', nativeLang)}
              </p>
            </motion.div>
          )}

          {/* Success checkmark (brief) */}
          {showSuccess && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center mb-4"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-2"
                style={{ background: 'rgba(88,204,2,0.15)', border: '3px solid var(--green)' }}
              >
                ✓
              </div>
            </motion.div>
          )}

          {/* Results */}
          {stars > 0 && !showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl p-5 mb-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {/* Stars */}
              <div className="text-3xl mb-3 text-center">
                {renderStars(stars)}
              </div>

              {/* Feedback text */}
              {feedback && (
                <p className="text-sm text-center mb-3" style={{ color: 'var(--text-muted)' }}>
                  {feedback}
                </p>
              )}

              {/* Hear yourself button */}
              {audioUrl && (
                <button
                  onClick={handlePlaySelf}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-medium"
                  style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
                >
                  🔊 Hear yourself
                </button>
              )}
            </motion.div>
          )}

          {/* Try again button (only when stars < 3 and we have a result) */}
          {stars > 0 && stars < 3 && !showSuccess && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleTryAgain}
              className="px-8 py-3 rounded-2xl font-bold text-white text-lg"
              style={{
                background: 'var(--blue)',
                boxShadow: '0 4px 0 rgba(0,100,200,0.4)',
              }}
            >
              {t('tryAgain', nativeLang)}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
