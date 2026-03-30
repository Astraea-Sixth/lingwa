'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveText, getNativeLang } from '@/lib/resolve'
import { t } from '@/lib/i18n'

export interface ReorderExercise {
  type: 'reorder'
  prompt: string | Record<string, string>
  words: string[]
  tiles?: Record<string, string[]> | null
  correct_order: string[] | Record<string, string[]>
  romanization?: string
}

interface Props {
  exercise: ReorderExercise
  lang: string
  onComplete: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
  currentIndex: number
  totalExercises: number
}

export default function Reorder({
  exercise, lang, onComplete, onNext, isLast, currentIndex, totalExercises
}: Props) {
  const [pool, setPool] = useState<string[]>([])
  const [placed, setPlaced] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Normalize correct_order — may be array or {neutral: [...]} object
  const correctOrder: string[] = Array.isArray(exercise.correct_order)
    ? exercise.correct_order
    : (exercise.correct_order as Record<string, string[]>).neutral
      || Object.values(exercise.correct_order as Record<string, string[]>)[0]
      || []

  // Normalize tiles — may be null, array, or {neutral: [...]} object
  const tilesArray: string[] = exercise.tiles
    ? (Array.isArray(exercise.tiles)
      ? exercise.tiles
      : (exercise.tiles as Record<string, string[]>).neutral
        || Object.values(exercise.tiles as Record<string, string[]>)[0]
        || [])
    : correctOrder

  // Reset on new exercise + auto-play each word's TTS
  useEffect(() => {
    setPool([...tilesArray])
    setPlaced([])
    setChecked(false)
    setIsCorrect(false)

    // Play each word with staggered delay so user hears all words
    tilesArray.forEach((word, i) => {
      setTimeout(() => speakText(word, lang, 0.75), i * 700)
    })
  }, [exercise, lang])

  const handleTapPool = (word: string, idx: number) => {
    if (checked) return
    speakText(word, lang, 0.75)
    const newPool = [...pool]
    newPool.splice(idx, 1)
    setPool(newPool)
    setPlaced([...placed, word])
  }

  const handleTapPlaced = (word: string, idx: number) => {
    if (checked) return
    speakText(word, lang, 0.75)
    const newPlaced = [...placed]
    newPlaced.splice(idx, 1)
    setPlaced(newPlaced)
    setPool([...pool, word])
  }

  const handleCheck = () => {
    if (checked) return
    const correct = placed.length === correctOrder.length &&
      placed.every((w, i) => w === correctOrder[i])
    setIsCorrect(correct)
    setChecked(true)
    onComplete(correct)

    // Play TTS of the correct sentence
    const sentence = correctOrder.join(' ')
    speakText(sentence, lang, 0.75)
  }

  const allPlaced = pool.length === 0 && placed.length > 0

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

      {/* Reorder area */}
      <div className="flex-1 px-4 py-6 max-w-[480px] mx-auto w-full">
        <p className="text-xl font-bold leading-relaxed mb-6">{resolveText(exercise.prompt, getNativeLang())}</p>

        {/* Answer area */}
        <div
          className="min-h-[72px] rounded-2xl border-2 border-dashed p-3 mb-6 flex flex-wrap gap-2 items-start"
          style={{
            borderColor: checked
              ? (isCorrect ? 'var(--green)' : 'var(--red)')
              : 'var(--border)',
            background: checked
              ? (isCorrect ? 'rgba(88,204,2,0.08)' : 'rgba(255,75,75,0.08)')
              : 'var(--surface2)',
          }}
        >
          {placed.length === 0 && (
            <span className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
              {t('tapWordsBuild', getNativeLang())}
            </span>
          )}
          <AnimatePresence mode="popLayout">
            {placed.map((word, idx) => (
              <motion.button
                key={`placed-${idx}-${word}`}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: checked && !isCorrect ? [0, -4, 4, -4, 4, 0] : 0,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleTapPlaced(word, idx)}
                disabled={checked}
                className="px-4 py-2 rounded-xl border-2 font-semibold text-lg select-none"
                style={{
                  borderColor: checked
                    ? (isCorrect ? 'var(--green)' : 'var(--red)')
                    : 'var(--blue)',
                  background: checked
                    ? (isCorrect ? 'rgba(88,204,2,0.15)' : 'rgba(255,75,75,0.15)')
                    : 'rgba(28,176,246,0.12)',
                  lineHeight: 1.8,
                  minHeight: '44px',
                }}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Show correct order when wrong */}
        {checked && !isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl"
            style={{ background: 'var(--surface2)' }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{t('correctOrder', getNativeLang())}</p>
            <p className="text-lg font-bold" style={{ lineHeight: 1.8 }}>
              {correctOrder.join(' ')}
            </p>
          </motion.div>
        )}

        {/* Romanization after check */}
        {checked && exercise.romanization && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-lg italic mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {exercise.romanization}
          </motion.p>
        )}

        {/* Word pool */}
        <div className="flex flex-wrap gap-2 justify-center">
          <AnimatePresence mode="popLayout">
            {pool.map((word, idx) => (
              <motion.button
                key={`pool-${idx}-${word}`}
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleTapPool(word, idx)}
                disabled={checked}
                className="px-4 py-2 rounded-xl border-2 font-semibold text-lg select-none"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  lineHeight: 1.8,
                  minHeight: '44px',
                }}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Check button */}
        {allPlaced && !checked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheck}
              className="w-full py-4 rounded-2xl font-black text-lg text-white"
              style={{ background: 'var(--green)', boxShadow: '0 4px 0 var(--green-dark)' }}
            >
              {t('check', getNativeLang())}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {checked && (
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
                    {t(isCorrect ? 'correct' : 'notQuite', getNativeLang())}
                  </p>
                  {isCorrect && (
                    <button
                      onClick={() => speakText(correctOrder.join(' '), lang, 0.75)}
                      className="flex items-center gap-1 mt-1 text-sm font-semibold"
                      style={{ color: 'var(--green)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      {t('listenAgain', getNativeLang())}
                    </button>
                  )}
                  {!isCorrect && (
                    <button
                      onClick={() => speakText(correctOrder.join(' '), lang, 0.75)}
                      className="flex items-center gap-2 mt-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                      <span className="text-sm font-semibold">{t('hearCorrectSentence', getNativeLang())}</span>
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
                {t(isLast ? 'completeLesson' : 'continue', getNativeLang()) + (isLast ? '' : ' →')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
