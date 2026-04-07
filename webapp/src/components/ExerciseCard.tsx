'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveOptions, resolveGenderedOptions, resolveText, getGender, type Gender } from '@/lib/resolve'
import { useI18n } from '@/lib/i18n-context'

interface Exercise {
  type: 'native_to_target' | 'target_to_native'
  // Format A (native_to_target): show native question, pick target answer
  question?: string | Record<string, string>
  options?: string[] | Record<string, string[]>
  options_male?: string[]    // old schema
  options_female?: string[]  // old schema
  // Format B (target_to_native): show target word, pick native answer
  word?: string
  romanization?: string
  gendered_word?: { male?: { word: string; romanization: string }; female?: { word: string; romanization: string } }
  autoplay?: boolean
  // Shared
  correct: number
  explanation?: string | Record<string, string>
}

function isTargetToNative(type: string): boolean {
  return type === 'target_to_native'
}
function isNativeToTarget(type: string): boolean {
  return type === 'native_to_target'
}

interface Props {
  exercise: Exercise
  onAnswer: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
  lang?: string
  currentIndex?: number
  totalExercises?: number
}

function playTTS(text: string, langCode: string) {
  speakText(text, langCode, 0.75)
}

function containsNonLatin(text: string) {
  // Detects any non-Latin script: Thai, CJK, Korean, Arabic, Cyrillic, Devanagari, etc.
  return /[^\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]/.test(text)
}

export default function ExerciseCard({
  exercise, onAnswer, onNext, isLast, lang = 'th', currentIndex = 0, totalExercises = 1
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [gender, setGender] = useState<Gender>('male')
  const { t, nativeLang } = useI18n()

  // Reset on new exercise
  useEffect(() => {
    setSelected(null)
    setAnswered(false)
    setIsCorrect(false)
  }, [exercise])

  // Read gender
  useEffect(() => {
    setGender(getGender(lang))
  }, [lang])

  // TTS fires ONLY on explicit user action (button tap). No autoplay.

  // Resolve options based on exercise type, gender, and native language
  const getOptions = (): string[] => {
    if (isNativeToTarget(exercise.type)) {
      // native_to_target: options are target language words, pick by gender
      if (gender === 'male' && exercise.options_male?.length) return exercise.options_male
      if (gender === 'female' && exercise.options_female?.length) return exercise.options_female
      // New schema: options may be { neutral: [...], male: [...], female: [...] }
      return resolveGenderedOptions(exercise.options, gender)
    }
    // target_to_native: options are native language translations, pick by nativeLang
    return resolveOptions(exercise.options, nativeLang)
  }

  // Shuffle options synchronously — useMemo ensures shuffle is ready on first render
  const { shuffledOptions, correctIdx } = useMemo(() => {
    const opts = getOptions()
    if (!opts.length) return { shuffledOptions: [] as string[], correctIdx: 0 }
    const correctValue = opts[exercise.correct ?? 0]
    const shuffled = [...opts]
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return { shuffledOptions: shuffled, correctIdx: shuffled.indexOf(correctValue) }
  }, [exercise, gender, nativeLang])

  const options = shuffledOptions.length > 0 ? shuffledOptions : getOptions()

  // Resolve gendered word/romanization for target_to_native display
  const displayWord = gender === 'male' ? exercise.gendered_word?.male?.word || exercise.word
    : gender === 'female' ? exercise.gendered_word?.female?.word || exercise.word
    : exercise.word
  const displayRomanization = gender === 'male' ? exercise.gendered_word?.male?.romanization || exercise.romanization
    : gender === 'female' ? exercise.gendered_word?.female?.romanization || exercise.romanization
    : exercise.romanization

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    const correct = idx === correctIdx
    setIsCorrect(correct)
    setAnswered(true)
    onAnswer(correct)
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

      {/* Question area */}
      <div className="flex-1 px-4 py-6 max-w-[480px] mx-auto w-full">

        {isTargetToNative(exercise.type) ? (
          /* Format B: Target language word big + audio → pick native meaning */
          <div>
            <div className="text-center mb-8 p-6 rounded-2xl" style={{ background: 'var(--surface2)' }}>
              <div className="font-black mb-2" style={{ fontSize: '64px', lineHeight: 1.5 }}>
                {displayWord}
              </div>
              {displayRomanization && (
                <div className="text-lg italic mb-4" style={{ color: 'var(--text-muted)' }}>
                  {displayRomanization}
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => displayWord && playTTS(displayWord, lang)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                🔊 {t('tapToHear')}
              </motion.button>
            </div>
            <p className="text-center text-lg font-bold mb-6">{t('whatDoesThisMean')}</p>
          </div>
        ) : (
          /* Format A: Native language question → pick target language answer */
          <div>
            <p className="text-xl font-bold leading-relaxed mb-8">{resolveText(exercise.question, nativeLang)}</p>
          </div>
        )}

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
                {/* Audio button for target language options */}
                {containsNonLatin(option) && (
                  <motion.span
                    role="button"
                    tabIndex={0}
                    whileTap={{ scale: 0.85 }}
                    onClick={e => { e.stopPropagation(); playTTS(option, lang) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); playTTS(option, lang) } }}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
                  >
                    🔊
                  </motion.span>
                )}
                {answered && idx === correctIdx && <span className="text-xl flex-shrink-0">✓</span>}
                {answered && idx === selected && !isCorrect && idx !== correctIdx && <span className="text-xl flex-shrink-0">✗</span>}
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
                <span className="text-2xl">{isCorrect ? '✓' : '✗'}</span>
                <div className="flex-1">
                  <p className="font-black text-lg" style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
                    {isCorrect ? t('correct') : t('notQuite')}
                  </p>
                  {!isCorrect && options[correctIdx] && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('answer')}</span>
                      <span className="font-bold" style={containsNonLatin(options[correctIdx]) ? { fontSize: '1.1em' } : {}}>
                        {options[correctIdx]}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); playTTS(options[correctIdx], lang) }} style={{ color: 'var(--green)' }}>🔊</button>
                    </div>
                  )}
                  {/* Always show listen button for the correct answer */}
                  {isCorrect && options[correctIdx] && (
                    <button
                      onClick={() => playTTS(options[correctIdx], lang)}
                      className="flex items-center gap-1 mt-1 text-sm font-semibold"
                      style={{ color: 'var(--green)' }}
                    >
                      🔊 {t('listenAgain')}
                    </button>
                  )}
                  {exercise.explanation && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{resolveText(exercise.explanation, nativeLang)}</p>
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
                {isLast ? `${t('completeLesson')} 🎉` : `${t('continue')} →`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
