'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveOptions, getNativeLang, getGender, type Gender } from '@/lib/resolve'
import { t } from '@/lib/i18n'

export interface ListeningExercise {
  type: 'listening'
  audio_text: string
  romanization?: string
  options: string[] | Record<string, string[]>
  correct: number
  gendered_audio?: {
    male?: { audio_text: string; romanization?: string }
    female?: { audio_text: string; romanization?: string }
  }
}

interface Props {
  exercise: ListeningExercise
  lang: string
  onComplete: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
  currentIndex: number
  totalExercises: number
}

function containsNonLatin(text: string) {
  return /[^\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]/.test(text)
}

export default function Listening({
  exercise, lang, onComplete, onNext, isLast, currentIndex, totalExercises
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [nativeLang, setNativeLang] = useState('en')
  const [gender, setGender] = useState<Gender>('both')
  const hasAutoPlayed = useRef(false)

  useEffect(() => {
    setNativeLang(getNativeLang())
    setGender(getGender(lang))
  }, [lang])

  // Resolve + shuffle options synchronously
  const { shuffledOptions, correctIdx } = useMemo(() => {
    const opts = resolveOptions(exercise.options, nativeLang)
    if (!opts.length) return { shuffledOptions: [] as string[], correctIdx: 0 }
    const correctValue = opts[exercise.correct ?? 0]
    const shuffled = [...opts]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return { shuffledOptions: shuffled, correctIdx: shuffled.indexOf(correctValue) }
  }, [exercise, nativeLang])

  const options = shuffledOptions.length > 0 ? shuffledOptions : resolveOptions(exercise.options, nativeLang)

  // Resolve gendered audio — play the right form for male/female users
  const audioText = gender === 'male' ? exercise.gendered_audio?.male?.audio_text || exercise.audio_text
    : gender === 'female' ? exercise.gendered_audio?.female?.audio_text || exercise.audio_text
    : exercise.audio_text
  const audioRomanization = gender === 'male' ? exercise.gendered_audio?.male?.romanization || exercise.romanization
    : gender === 'female' ? exercise.gendered_audio?.female?.romanization || exercise.romanization
    : exercise.romanization

  // Reset on new exercise
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setIsCorrect(false)
    hasAutoPlayed.current = false
  }, [exercise])

  // Auto-play TTS on mount (once per exercise)
  useEffect(() => {
    if (!hasAutoPlayed.current && exercise.audio_text) {
      hasAutoPlayed.current = true
      // Small delay to let component mount
      const timer = setTimeout(() => {
        speakText(audioText, lang, 0.75)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [exercise, lang])

  const handleReplay = () => {
    speakText(audioText, lang, 0.75)
  }

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    const correct = idx === correctIdx
    setIsCorrect(correct)
    setAnswered(true)
    onComplete(correct)
  }

  const optionStyle = (idx: number): React.CSSProperties => {
    if (!answered) return {
      borderColor: selected === idx ? 'var(--blue)' : 'var(--border)',
      background: selected === idx ? 'rgba(28,176,246,0.1)' : 'var(--surface)'
    }
    if (idx === correctIdx) return { borderColor: 'var(--green)', background: 'rgba(88,204,2,0.12)' }
    if (idx === selected) return { borderColor: 'var(--red)', background: 'rgba(255,75,75,0.12)' }
    return { borderColor: 'var(--border)', background: 'var(--surface)', opacity: 0.4 }
  }

  return (
    <div className="flex flex-col min-h-screen pb-40" style={{ background: 'var(--bg)' }}>

      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2 max-w-[480px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / totalExercises) * 100}%`, background: 'var(--green)' }} />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            {currentIndex + 1}/{totalExercises}
          </span>
        </div>
      </div>

      {/* Listening area */}
      <div className="flex-1 px-4 py-6 max-w-[480px] mx-auto w-full">
        <p className="text-xl font-bold leading-relaxed mb-6">{t('whatDoYouHear', nativeLang)}</p>

        <div className="text-center mb-8 p-8 rounded-2xl" style={{ background: 'var(--surface2)' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReplay}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </motion.button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t('replay', nativeLang)}
          </p>
          {answered && audioRomanization && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg italic mt-4"
              style={{ color: 'var(--text-muted)' }}
            >
              {audioRomanization}
            </motion.p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, idx) => (
            <motion.button
              key={idx}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(idx)}
              disabled={answered}
              className="w-full text-left rounded-2xl border-2 transition-all duration-150 p-4"
              style={optionStyle(idx)}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className={`flex-1 font-semibold ${containsNonLatin(option) ? 'text-lg' : ''}`}
                  style={containsNonLatin(option) ? { lineHeight: 1.8 } : {}}>
                  {option}
                </span>
                {answered && idx === correctIdx && <span className="text-xl flex-shrink-0">&#10003;</span>}
                {answered && idx === selected && !isCorrect && idx !== correctIdx && <span className="text-xl flex-shrink-0">&#10007;</span>}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 p-4 pb-6"
            style={{
              background: isCorrect ? 'rgba(88,204,2,0.15)' : 'rgba(255,75,75,0.12)',
              borderTop: `2px solid ${isCorrect ? 'var(--green)' : 'var(--red)'}`,
            }}
          >
            <div className="max-w-[480px] mx-auto">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{isCorrect ? '\u2713' : '\u2717'}</span>
                <div className="flex-1">
                  <p className="font-black text-lg" style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
                    {t(isCorrect ? 'correct' : 'notQuite', nativeLang)}
                  </p>
                  {!isCorrect && options[correctIdx] && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('answer', nativeLang)}</span>
                      <span className="font-bold" style={containsNonLatin(options[correctIdx]) ? { fontSize: '1.1em' } : {}}>
                        {options[correctIdx]}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); speakText(audioText, lang, 0.75) }} style={{ color: 'var(--green)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      </button>
                    </div>
                  )}
                  {isCorrect && (
                    <button
                      onClick={() => speakText(audioText, lang, 0.75)}
                      className="flex items-center gap-1 mt-1 text-sm font-semibold"
                      style={{ color: 'var(--green)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      {t('listenAgain', nativeLang)}
                    </button>
                  )}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNext}
                className="w-full py-4 rounded-2xl font-black text-lg text-white"
                style={{
                  background: isCorrect ? 'var(--green)' : 'var(--red)',
                  boxShadow: isCorrect ? '0 4px 0 var(--green-dark)' : '0 4px 0 #cc0000',
                }}
              >
                {t(isLast ? 'completeLesson' : 'continue', nativeLang) + (isLast ? '' : ' →')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
