'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText as ttsSpeak, stopSpeech } from '@/lib/tts'
import { AudioRecorder } from '@/lib/audioRecorder'
import { useI18n } from '@/lib/i18n-context'
import { isHostedMode } from '@/lib/supabase'
import { recognizeSpeech, isSpeechRecognitionSupported, SpeechRecognitionError } from '@/lib/speechRecognition'
import { scorePronunciation } from '@/lib/pronunciationScore'

interface Message {
  role: 'user' | 'nong'
  content: string
  isCorrect?: boolean
  stars?: number
  audioUrl?: string  // user's recording playback URL
}

interface VoiceChatProps {
  lang: string
  unit: number
  lesson: number
  lessonTitle: string
  keyPhrases: string[]
  tutorName: string
  level: string
  chatMode?: string
  chatModeKey?: string
  onComplete: (xp: number) => void
}

export default function VoiceChat({
  lang, unit, lesson, lessonTitle, keyPhrases, tutorName, level, chatMode, chatModeKey, onComplete
}: VoiceChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [lessonComplete, setLessonComplete] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0)

  const { t, nativeLang } = useI18n()

  const recorderRef = useRef<AudioRecorder | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<Message[]>([])
  const successCountRef = useRef(0)

  // Keep refs in sync
  useEffect(() => { successCountRef.current = successCount }, [successCount])

  // Initialize with tutor opening message
  useEffect(() => {
    const opening = getOpeningMessage(tutorName, lessonTitle, keyPhrases, chatMode)
    const nongMsg: Message = { role: 'nong', content: opening }
    setMessages([nongMsg])
    historyRef.current = [nongMsg]
    setTimeout(() => speakNongReply(opening, lang, nativeLang), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getOpeningMessage(name: string, title: string, phrases: string[], mode?: string) {
    if (mode && mode.startsWith('You are') && mode.includes('Unit')) {
      const unitMatch = mode.match(/Unit (\d+)/)
      const unitNum = unitMatch ? unitMatch[1] : '?'
      return t('openingUnitChat', { name, unit: unitNum })
    }
    if (mode && mode.includes('FINAL CHALLENGE')) {
      return t('openingFinalChallenge', { name })
    }
    const firstPhrase = getNativeMeaning(phrases[0] || title)
    return t('openingPractice', { name, phrase: firstPhrase })
  }

  function speakText(text: string, langCode: string) {
    setIsSpeaking(true)
    ttsSpeak(text, langCode, 0.9, 1.1).finally(() => setIsSpeaking(false))
  }

  /** Speak Nong's reply: explanation in nativeLang, target phrase in targetLang */
  function speakNongReply(fullText: string, targetLang: string, nLang: string) {
    // Detect target phrase to demonstrate (after "try:", "say:", etc.)
    const targetMatch = fullText.match(
      /(?:try(?:\s+saying)?|say|practice|repeat|试试|再试|说)[:\s：]+([^\.\!\?\n]+)/i
    )

    if (targetMatch) {
      const targetPhrase = targetMatch[1].trim()
      const explanation = fullText.replace(targetMatch[0], '').trim()

      if (explanation) {
        // Speak explanation in native lang, then target phrase in target lang
        setIsSpeaking(true)
        ttsSpeak(explanation, nLang, 0.9, 1.1).then(() => {
          setTimeout(() => {
            ttsSpeak(targetPhrase, targetLang, 0.9, 1.1).finally(() => setIsSpeaking(false))
          }, 400)
        }).catch(() => setIsSpeaking(false))
      } else {
        speakText(targetPhrase, targetLang)
      }
    } else {
      // No target phrase detected — speak entire reply in native lang
      speakText(fullText, nLang)
    }
  }

  // ─── Recording ───

  const hosted = isHostedMode()

  async function startListening() {
    if (hosted) {
      await startListeningHosted()
    } else {
      await startListeningLocal()
    }
  }

  async function stopListening() {
    if (hosted) return // hosted mode auto-stops via Web Speech API
    if (!recorderRef.current?.isRecording) return
    setIsListening(false)
    setIsProcessing(true)

    try {
      const audioBlob = await recorderRef.current.stop()
      await processAudioLocal(audioBlob)
    } catch {
      addMessage({ role: 'nong', content: `${t('somethingWrong')} 🙏` })
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── Hosted mode: Web Speech API + local scoring ───

  async function startListeningHosted() {
    if (!isSpeechRecognitionSupported()) {
      addMessage({ role: 'nong', content: t('speechNotSupported') })
      return
    }

    stopSpeech()
    setLastScore(null)
    setIsListening(true)

    try {
      const transcript = await recognizeSpeech(lang, 10000)

      setIsListening(false)
      setIsProcessing(true)

      const currentPhrase = keyPhrases[currentPhraseIdx] || keyPhrases[0]
      const { expectedWord } = getExpectedWordData(currentPhrase)

      addMessage({ role: 'user', content: transcript || '(unclear)' })

      const result = scorePronunciation(transcript, expectedWord, nativeLang)
      const stars = result.stars
      setLastScore(stars)

      const nongMsg: Message = {
        role: 'nong',
        content: result.feedback || t('tryAgain'),
        isCorrect: stars === 3,
        stars,
      }
      addMessage(nongMsg)
      speakNongReply(result.feedback || t('tryAgain'), lang, nativeLang)

      handleSuccessTracking(stars)
    } catch (err) {
      setIsListening(false)
      if (err instanceof SpeechRecognitionError) {
        const msgKey: Record<string, string> = {
          'permission-denied': 'speechPermissionDenied',
          'no-speech': 'speechNoInput',
          'network': 'speechNetworkError',
          'unsupported': 'speechNotSupported',
          'timeout': 'speechNoInput',
        }
        addMessage({ role: 'nong', content: t(msgKey[err.kind] || 'somethingWrong') })
      } else {
        addMessage({ role: 'nong', content: `${t('somethingWrong')} 🙏` })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // ─── Local mode: AudioRecorder → Python API ───

  async function startListeningLocal() {
    try {
      stopSpeech()
      setLastScore(null)
      const recorder = new AudioRecorder(8000)
      recorderRef.current = recorder
      await recorder.start()
      setIsListening(true)
    } catch {
      addMessage({ role: 'nong', content: `${t('micError')} 🎤` })
    }
  }

  async function processAudioLocal(blob: Blob) {
    const currentPhrase = keyPhrases[currentPhraseIdx] || keyPhrases[0]
    const { expectedWord, toneClass } = getExpectedWordData(currentPhrase)

    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('expected', expectedWord)
    formData.append('lang', lang)
    formData.append('gender', getGender())
    formData.append('level', level)
    formData.append('tone_class', toneClass)
    formData.append('native_lang', nativeLang)

    try {
      const res = await fetch('/api/evaluate-speech', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        await sendToTutor("(audio couldn't be processed)")
        return
      }

      const result = await res.json()
      const userTranscript = result.transcript || '(unclear)'

      setTranscript('')
      const audioUrl = URL.createObjectURL(blob)
      addMessage({ role: 'user', content: userTranscript, audioUrl })

      const stars = result.stars || 1
      setLastScore(stars)

      const nongMsg: Message = {
        role: 'nong',
        content: result.feedback || t('tryAgain'),
        isCorrect: stars === 3,
        stars,
      }
      addMessage(nongMsg)
      speakNongReply(result.feedback || t('tryAgain'), lang, nativeLang)

      handleSuccessTracking(stars)
    } catch {
      addMessage({ role: 'nong', content: `${t('connectionIssue')} 🙏` })
    }
  }

  // ─── Shared success tracking ───

  function handleSuccessTracking(stars: number) {
    if (stars === 3) {
      const newCount = successCountRef.current + 1
      setSuccessCount(newCount)
      successCountRef.current = newCount

      if (currentPhraseIdx < keyPhrases.length - 1) {
        setCurrentPhraseIdx(prev => prev + 1)
        setTimeout(() => {
          const nextPhrase = keyPhrases[currentPhraseIdx + 1]
          if (nextPhrase) {
            const prompt: Message = {
              role: 'nong',
              content: t('greatNowTry', { phrase: nextPhrase }) + ' 🎯',
            }
            addMessage(prompt)
            speakNongReply(prompt.content, lang, nativeLang)
          }
        }, 2000)
      }

      if (newCount >= 3) {
        const waitForSpeech = () => {
          if (window.speechSynthesis.speaking) {
            setTimeout(waitForSpeech, 500)
          } else {
            setTimeout(() => {
              setLessonComplete(true)
              onComplete(15)
            }, 1500)
          }
        }
        setTimeout(waitForSpeech, 1000)
      }
    }
  }

  // ─── Conversational mode (free chat with tutor) ───

  async function sendToTutor(userText: string) {
    if (!userText.trim()) return
    stopSpeech()

    const userMsg: Message = { role: 'user', content: userText }
    addMessage(userMsg)
    setIsLoading(true)

    try {
      const history = historyRef.current.slice(-20).map(m => ({
        role: m.role === 'nong' ? 'assistant' : 'user',
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          message: userText,
          history,
          unit,
          lesson,
          mode: 'voice_practice',
          key_phrases: keyPhrases,
          success_count: successCountRef.current,
          level,
          gender: getGender(),
          chat_mode: chatModeKey || 'free',
          native_lang: nativeLang,
        })
      })

      const data = await res.json()
      const reply = data.reply || t('tryAgain')

      const isPositive = /correct|perfect|great|good|well done|nice|excellent|bravo|lesson complete/i.test(reply)
      if (isPositive) {
        const newCount = successCountRef.current + 1
        setSuccessCount(newCount)
        successCountRef.current = newCount
      }

      const nongMsg: Message = { role: 'nong', content: reply, isCorrect: isPositive }
      addMessage(nongMsg)
      speakNongReply(reply, lang, nativeLang)

      if (successCountRef.current >= 3) {
        const waitForSpeech = () => {
          if (window.speechSynthesis.speaking) {
            setTimeout(waitForSpeech, 500)
          } else {
            setTimeout(() => { setLessonComplete(true); onComplete(15) }, 1500)
          }
        }
        setTimeout(waitForSpeech, 1000)
      }
    } catch {
      addMessage({ role: 'nong', content: `${t('connectionIssue')} 🙏` })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Helpers ───

  function addMessage(msg: Message) {
    historyRef.current = [...historyRef.current, msg]
    setMessages([...historyRef.current])
  }

  function getGender(): string {
    if (typeof window === 'undefined') return 'male'
    return localStorage.getItem(`lingwa_gender_${lang}`) || 'male'
  }

  function getExpectedWordData(phrase: string): { expectedWord: string; toneClass: string } {
    // Look up the full gendered form + tone from curriculum data
    try {
      const curRaw = localStorage.getItem(`lingwa_curriculum_${lang}`)
      if (curRaw) {
        const curriculum = JSON.parse(curRaw)
        const gender = getGender()
        for (const u of curriculum.units || []) {
          for (const l of u.lessons || []) {
            for (const v of l.vocabulary || []) {
              if (v.word === phrase || v.romanization === phrase) {
                // Get gendered form
                const genderedWord = gender === 'male'
                  ? v.gendered?.male?.word || v.word
                  : gender === 'female'
                    ? v.gendered?.female?.word || v.word
                    : v.word
                return {
                  expectedWord: genderedWord,
                  toneClass: v.toneClass || '',
                }
              }
            }
          }
        }
      }
    } catch { /* use defaults */ }
    return { expectedWord: phrase, toneClass: '' }
  }

  function getNativeMeaning(phrase: string): string {
    const nl = nativeLang
    try {
      const curRaw = localStorage.getItem(`lingwa_curriculum_${lang}`)
      if (curRaw) {
        const curriculum = JSON.parse(curRaw)
        for (const u of curriculum.units || []) {
          for (const l of u.lessons || []) {
            for (const v of l.vocabulary || []) {
              if (v.word === phrase || v.romanization === phrase) {
                return v.meanings?.[nl] || v.meanings?.en || v.meaning || phrase
              }
            }
          }
        }
      }
    } catch { /* fallback */ }
    return phrase
  }

  // ─── Lesson Complete Screen ───

  if (lessonComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
      >
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-3xl font-black mb-2">{t('lessonComplete')}</h2>
        <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>
          {t('isProudOfYou', { name: tutorName })} 😊
        </p>
        <div className="flex items-center gap-2 text-2xl font-bold mb-8" style={{ color: 'var(--green)' }}>
          <span>+15 XP</span>
        </div>
        <div className="card text-sm text-left w-full max-w-[320px]">
          <p className="font-bold mb-2">{t('whatYouPracticed')}</p>
          {keyPhrases.map(p => (
            <p key={p} className="mb-1" style={{ color: 'var(--text-muted)' }}>✓ {p}</p>
          ))}
        </div>
      </motion.div>
    )
  }

  // ─── Main Chat UI ───

  const currentPhrase = keyPhrases[currentPhraseIdx] || keyPhrases[0]

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-[480px] mx-auto">
      {/* Tutor header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'var(--surface2)' }}
        >
          👩‍🏫
        </div>
        <div>
          <p className="font-bold">{tutorName}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isProcessing ? `🔍 ${t('analysing')}` : isSpeaking ? `🔊 ${t('isSpeaking', { name: tutorName })}` : isListening ? `🎙️ ${t('isListening')}` : t('practice', { title: lessonTitle })}
          </p>
        </div>
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{ background: i < successCount ? 'var(--green)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: msg.role === 'user'
                  ? 'var(--blue)'
                  : msg.isCorrect
                    ? 'rgba(88,204,2,0.15)'
                    : 'var(--surface)',
                border: msg.isCorrect ? '1px solid var(--green)' : 'none',
                color: 'var(--text)',
              }}
            >
              {/* Star rating */}
              {msg.stars && (
                <div className="mb-1 text-lg">
                  {'⭐'.repeat(msg.stars)}{'☆'.repeat(3 - msg.stars)}
                </div>
              )}
              {msg.content}
              {msg.role === 'user' && msg.audioUrl && (
                <button
                  onClick={() => { const a = new Audio(msg.audioUrl!); a.play() }}
                  className="block mt-1 text-xs opacity-60 hover:opacity-100"
                >
                  🔊 hear yourself
                </button>
              )}
              {msg.role === 'nong' && (
                <button
                  onClick={() => speakNongReply(msg.content, lang, nativeLang)}
                  className="block mt-1 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  🔊 {t('replay')}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {(isLoading || isProcessing) && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isProcessing ? `🔍 ${t('analysingYourSpeech')}` : t('isThinking', { name: tutorName })}
              </span>
            </div>
          </div>
        )}
        {transcript && (
          <div className="flex justify-end">
            <div className="rounded-2xl px-4 py-3 text-sm italic" style={{ background: 'rgba(28,176,246,0.3)' }}>
              &ldquo;{transcript}&rdquo;
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Current practice phrase */}
        {currentPhrase && (
          <div className="text-center mb-3 p-2 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('sayThis')}</p>
            <p className="font-bold text-lg" style={{ lineHeight: 1.8 }}>{getNativeMeaning(currentPhrase)}</p>
          </div>
        )}

        {/* Star score display */}
        <AnimatePresence>
          {lastScore !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2 text-2xl"
            >
              {'⭐'.repeat(lastScore)}{'☆'.repeat(3 - lastScore)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key phrases hint */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {keyPhrases.slice(0, 3).map(p => (
            <button
              key={p}
              onClick={() => sendToTutor(p)}
              className="text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
            >
              {p}
            </button>
          ))}
        </div>



        {/* Big mic button */}
        <motion.button
          onClick={isListening ? stopListening : startListening}
          whileTap={{ scale: 0.95 }}
          disabled={isLoading || isSpeaking || isProcessing}
          className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
          style={{
            background: isListening ? 'var(--red)' : isProcessing ? 'var(--surface2)' : 'var(--green)',
            boxShadow: isListening ? '0 4px 0 #cc0000' : isProcessing ? 'none' : '0 4px 0 var(--green-dark)',
            color: 'white',
            opacity: (isLoading || isSpeaking || isProcessing) ? 0.5 : 1,
          }}
        >
          <span className="text-2xl">{isListening ? '⏹' : isProcessing ? '🔍' : '🎙️'}</span>
          {isListening ? t('tapToStop') : isProcessing ? t('analysing') : isSpeaking ? t('isSpeaking', { name: tutorName }) : t('tapToSpeak')}
        </motion.button>
        {hosted && !isListening && !isProcessing && (
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            {t('speechBrowserHint')}
          </p>
        )}
      </div>
    </div>
  )
}
