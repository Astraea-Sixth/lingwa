'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveOptions, getGender, getNativeLang, type Gender } from '@/lib/resolve'
import { t } from '@/lib/i18n'
import { type WordRecord, sm2Update, calculateRetention } from '@/lib/srs'
import { loadSRSData, saveSRSData } from '@/lib/progress'

// Quality mapping: UI buttons → SM-2 quality scale
const QUALITY_FORGOT = 1
const QUALITY_HARD = 3
const QUALITY_GOOD = 4
const QUALITY_EASY = 5

interface ReviewExercise {
  type: 'target_to_native' | 'native_to_target'
  wordRecord: WordRecord
  options: string[]
  correct: number
  // For target_to_native display
  displayWord: string
  displayRomanization?: string
}

interface ReviewModeProps {
  lang: string
  dueWords: WordRecord[]
  allWords: WordRecord[]   // full pool for distractors
  onComplete: () => void
}

function containsNonLatin(text: string) {
  return /[^\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]/.test(text)
}

function playTTS(text: string, langCode: string) {
  speakText(text, langCode, 0.75)
}

/**
 * Generate review exercises from due words.
 * Uses other words from the pool as distractors.
 */
function generateExercises(dueWords: WordRecord[], allWords: WordRecord[], nativeLang: string): ReviewExercise[] {
  return dueWords.map(word => {
    const isTargetToNative = Math.random() < 0.5

    // Build distractor pool (other words)
    const distractorPool = allWords
      .filter(w => w.word !== word.word)
      .sort(() => Math.random() - 0.5)

    if (isTargetToNative) {
      // Show target word → pick native meaning
      const correctAnswer = word.english
      const distractors = distractorPool
        .slice(0, 3)
        .map(w => w.english)
      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5)

      return {
        type: 'target_to_native',
        wordRecord: word,
        options,
        correct: options.indexOf(correctAnswer),
        displayWord: word.word,
        displayRomanization: word.romanization,
      }
    } else {
      // Show native meaning → pick target word
      const correctAnswer = word.word
      const distractors = distractorPool
        .slice(0, 3)
        .map(w => w.word)
      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5)

      return {
        type: 'native_to_target',
        wordRecord: word,
        options,
        correct: options.indexOf(correctAnswer),
        displayWord: word.english,
      }
    }
  })
}

export default function ReviewMode({ lang, dueWords, allWords, onComplete }: ReviewModeProps) {
  const [nativeLang, setNativeLang] = useState('en')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)

  // Track session stats
  const [reviewedCount, setReviewedCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [needsPracticeCount, setNeedsPracticeCount] = useState(0)

  useEffect(() => {
    setNativeLang(getNativeLang())
  }, [])

  const exercises = useMemo(
    () => generateExercises(dueWords, allWords.length >= 4 ? allWords : dueWords, nativeLang),
    [dueWords, allWords, nativeLang]
  )

  if (!exercises.length) {
    return (
      <div className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6 items-center justify-center text-center"
        style={{ background: 'var(--bg)' }}>
        <div className="text-5xl mb-6">🎉</div>
        <h1 className="text-2xl font-black mb-3">{t('noWordsToReview', nativeLang)}</h1>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          className="px-8 py-4 rounded-2xl font-bold text-white text-lg"
          style={{ background: 'var(--green)', boxShadow: '0 4px 0 var(--green-dark)' }}
        >
          {t('done', nativeLang)}
        </motion.button>
      </div>
    )
  }

  const exercise = exercises[currentIdx]

  // Completion screen
  if (showCompletion) {
    const srsData = loadSRSData(lang)
    const retention = calculateRetention(srsData.words)
    const retentionPercent = Math.round(retention * 100)

    return (
      <div className="flex flex-col min-h-screen max-w-[480px] mx-auto px-4 py-6 items-center justify-center text-center"
        style={{ background: 'var(--bg)' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-7xl mb-6"
        >
          ✅
        </motion.div>
        <h1 className="text-3xl font-black mb-6">{t('reviewSessionComplete', nativeLang)}</h1>

        <div className="w-full rounded-2xl p-6 mb-6 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }}>{t('wordsReviewed', nativeLang)}</span>
            <span className="font-bold text-lg">{reviewedCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }}>{t('wordsMasteredReview', nativeLang)}</span>
            <span className="font-bold text-lg" style={{ color: 'var(--green)' }}>{masteredCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-muted)' }}>{t('wordsNeedPractice', nativeLang)}</span>
            <span className="font-bold text-lg" style={{ color: 'var(--yellow)' }}>{needsPracticeCount}</span>
          </div>
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-muted)' }}>{t('retentionRate', nativeLang)}</span>
              <span className="font-black text-xl" style={{ color: retentionPercent >= 70 ? 'var(--green)' : 'var(--yellow)' }}>
                {retentionPercent}%
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg"
          style={{ background: 'var(--green)', boxShadow: '0 4px 0 var(--green-dark)' }}
        >
          {t('done', nativeLang)}
        </motion.button>
      </div>
    )
  }

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    const correct = idx === exercise.correct
    setIsCorrect(correct)
    setAnswered(true)
  }

  const handleShowQuality = () => {
    setShowQuality(true)
  }

  const handleQualityRating = (quality: number) => {
    // Update SRS data
    const srsData = loadSRSData(lang)
    const wordKey = exercise.wordRecord.word
    if (srsData.words[wordKey]) {
      srsData.words[wordKey] = sm2Update(srsData.words[wordKey], quality)
      saveSRSData(lang, srsData)
    }

    // Update stats
    setReviewedCount(prev => prev + 1)
    if (quality >= 4) {
      setMasteredCount(prev => prev + 1)
    } else {
      setNeedsPracticeCount(prev => prev + 1)
    }

    // Advance to next or show completion
    if (currentIdx + 1 >= exercises.length) {
      setShowCompletion(true)
    } else {
      setCurrentIdx(prev => prev + 1)
      setSelected(null)
      setAnswered(false)
      setIsCorrect(false)
      setShowQuality(false)
    }
  }

  const optionStyle = (idx: number): React.CSSProperties => {
    if (!answered) return {
      borderColor: selected === idx ? 'var(--blue)' : 'var(--border)',
      background: selected === idx ? 'rgba(28,176,246,0.1)' : 'var(--surface)',
    }
    if (idx === exercise.correct) return { borderColor: 'var(--green)', background: 'rgba(88,204,2,0.12)' }
    if (idx === selected) return { borderColor: 'var(--red)', background: 'rgba(255,75,75,0.12)' }
    return { borderColor: 'var(--border)', background: 'var(--surface)', opacity: 0.4 }
  }

  const qualityButtons = [
    { quality: QUALITY_FORGOT, label: t('forgotLabel', nativeLang), emoji: '\u2639\uFE0F', color: 'var(--red)' },
    { quality: QUALITY_HARD, label: t('hardLabel', nativeLang), emoji: '\uD83D\uDE10', color: 'var(--yellow)' },
    { quality: QUALITY_GOOD, label: t('goodLabel', nativeLang), emoji: '\uD83D\uDE42', color: 'var(--blue)' },
    { quality: QUALITY_EASY, label: t('easyLabel', nativeLang), emoji: '\uD83D\uDE0A', color: 'var(--green)' },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-40" style={{ background: 'var(--bg)' }}>
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2 max-w-[480px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full" style={{ background: 'var(--surface2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((currentIdx + 1) / exercises.length) * 100}%`, background: 'var(--green)' }} />
          </div>
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            {currentIdx + 1}/{exercises.length}
          </span>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 px-4 py-6 max-w-[480px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {exercise.type === 'target_to_native' ? (
              <div>
                <div className="text-center mb-8 p-6 rounded-2xl" style={{ background: 'var(--surface2)' }}>
                  <div className="font-black mb-2" style={{ fontSize: '64px', lineHeight: 1.5 }}>
                    {exercise.displayWord}
                  </div>
                  {exercise.displayRomanization && (
                    <div className="text-lg italic mb-4" style={{ color: 'var(--text-muted)' }}>
                      {exercise.displayRomanization}
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => playTTS(exercise.displayWord, lang)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    🔊 {t('tapToHear', nativeLang)}
                  </motion.button>
                </div>
                <p className="text-center text-lg font-bold mb-6">{t('whatDoesThisMean', nativeLang)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold leading-relaxed mb-8">{exercise.displayWord}</p>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {exercise.options.map((option, idx) => (
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
                    {answered && idx === exercise.correct && <span className="text-xl flex-shrink-0">✓</span>}
                    {answered && idx === selected && !isCorrect && idx !== exercise.correct && <span className="text-xl flex-shrink-0">✗</span>}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback + quality rating banner */}
      <AnimatePresence>
        {answered && !showQuality && (
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
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{isCorrect ? '✓' : '✗'}</span>
                <p className="font-black text-lg" style={{ color: isCorrect ? 'var(--green)' : 'var(--red)' }}>
                  {isCorrect ? t('correct', nativeLang) : t('notQuite', nativeLang)}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShowQuality}
                className="w-full py-4 rounded-2xl font-black text-lg text-white"
                style={{
                  background: isCorrect ? 'var(--green)' : 'var(--red)',
                  boxShadow: isCorrect ? '0 4px 0 var(--green-dark)' : '0 4px 0 #cc0000',
                }}
              >
                {t('continue', nativeLang)} →
              </motion.button>
            </div>
          </motion.div>
        )}

        {showQuality && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 p-4 pb-6"
            style={{ background: 'var(--surface)', borderTop: '2px solid var(--border)' }}
          >
            <div className="max-w-[480px] mx-auto">
              <p className="text-center text-sm font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
                {t('reviewSubtitle', nativeLang)}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {qualityButtons.map(btn => (
                  <motion.button
                    key={btn.quality}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQualityRating(btn.quality)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
                  >
                    <span className="text-2xl">{btn.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: btn.color }}>{btn.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
