'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { speakText } from '@/lib/tts'
import { resolveMeaning } from '@/lib/resolve'
import { useI18n } from '@/lib/i18n-context'

export interface MatchingExercise {
  type: 'matching'
  pairs: Array<{
    target: string
    romanization?: string
    native: string | Record<string, string>
  }>
}

interface Props {
  exercise: MatchingExercise
  lang: string
  onComplete: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
  currentIndex: number
  totalExercises: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Matching({
  exercise, lang, onComplete, onNext, isLast, currentIndex, totalExercises
}: Props) {
  const { t, nativeLang } = useI18n()

  // Shuffled indices for left (target) and right (native) columns
  const shuffledLeft = useMemo(() => shuffle(exercise.pairs.map((_, i) => i)), [exercise])
  const shuffledRight = useMemo(() => shuffle(exercise.pairs.map((_, i) => i)), [exercise])

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null)
  const [selectedRight, setSelectedRight] = useState<number | null>(null)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [shaking, setShaking] = useState<{ left: number | null; right: number | null }>({ left: null, right: null })
  const [hadWrong, setHadWrong] = useState(false)
  const [complete, setComplete] = useState(false)

  // Reset on new exercise
  useEffect(() => {
    setSelectedLeft(null)
    setSelectedRight(null)
    setMatched(new Set())
    setShaking({ left: null, right: null })
    setHadWrong(false)
    setComplete(false)
  }, [exercise])

  const tryMatch = (leftIdx: number, rightIdx: number) => {
    if (leftIdx === rightIdx) {
      // Correct match
      const newMatched = new Set(matched)
      newMatched.add(leftIdx)
      setMatched(newMatched)
      setSelectedLeft(null)
      setSelectedRight(null)

      // Check if all matched
      if (newMatched.size === exercise.pairs.length) {
        setComplete(true)
        onComplete(!hadWrong)
      }
    } else {
      // Wrong match
      setHadWrong(true)
      setShaking({ left: leftIdx, right: rightIdx })
      setTimeout(() => {
        setShaking({ left: null, right: null })
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 500)
    }
  }

  const handleLeftTap = (pairIdx: number) => {
    if (matched.has(pairIdx) || complete) return
    // Play TTS for target word
    speakText(exercise.pairs[pairIdx].target, lang, 0.75)
    setSelectedLeft(pairIdx)
    if (selectedRight !== null) {
      tryMatch(pairIdx, selectedRight)
    }
  }

  const handleRightTap = (pairIdx: number) => {
    if (matched.has(pairIdx) || complete) return
    setSelectedRight(pairIdx)
    if (selectedLeft !== null) {
      tryMatch(selectedLeft, pairIdx)
    }
  }

  const leftItemStyle = (pairIdx: number): React.CSSProperties => {
    if (matched.has(pairIdx)) return { borderColor: 'var(--green)', background: 'rgba(88,204,2,0.12)', opacity: 0.4 }
    if (shaking.left === pairIdx) return { borderColor: 'var(--red)', background: 'rgba(255,75,75,0.12)' }
    if (selectedLeft === pairIdx) return { borderColor: 'var(--blue)', background: 'rgba(28,176,246,0.1)' }
    return { borderColor: 'var(--border)', background: 'var(--surface)' }
  }

  const rightItemStyle = (pairIdx: number): React.CSSProperties => {
    if (matched.has(pairIdx)) return { borderColor: 'var(--green)', background: 'rgba(88,204,2,0.12)', opacity: 0.4 }
    if (shaking.right === pairIdx) return { borderColor: 'var(--red)', background: 'rgba(255,75,75,0.12)' }
    if (selectedRight === pairIdx) return { borderColor: 'var(--blue)', background: 'rgba(28,176,246,0.1)' }
    return { borderColor: 'var(--border)', background: 'var(--surface)' }
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

      {/* Matching area */}
      <div className="flex-1 px-4 py-6 max-w-[480px] mx-auto w-full">
        <p className="text-xl font-bold leading-relaxed mb-6">{t('tapMatchingPairs')}</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Left column: target language */}
          <div className="space-y-3">
            {shuffledLeft.map(pairIdx => (
              <motion.button
                key={`left-${pairIdx}`}
                whileTap={!matched.has(pairIdx) ? { scale: 0.96 } : {}}
                animate={shaking.left === pairIdx ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={shaking.left === pairIdx ? { duration: 0.4 } : {}}
                onClick={() => handleLeftTap(pairIdx)}
                disabled={matched.has(pairIdx) || complete}
                className="w-full text-center rounded-2xl border-2 transition-all duration-150 p-3 min-h-[52px]"
                style={leftItemStyle(pairIdx)}
              >
                <span className="font-semibold text-lg" style={{ lineHeight: 1.8 }}>
                  {exercise.pairs[pairIdx].target}
                </span>
                {matched.has(pairIdx) && exercise.pairs[pairIdx].romanization && (
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {exercise.pairs[pairIdx].romanization}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Right column: native language */}
          <div className="space-y-3">
            {shuffledRight.map(pairIdx => (
              <motion.button
                key={`right-${pairIdx}`}
                whileTap={!matched.has(pairIdx) ? { scale: 0.96 } : {}}
                animate={shaking.right === pairIdx ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={shaking.right === pairIdx ? { duration: 0.4 } : {}}
                onClick={() => handleRightTap(pairIdx)}
                disabled={matched.has(pairIdx) || complete}
                className="w-full text-center rounded-2xl border-2 transition-all duration-150 p-3 min-h-[52px]"
                style={rightItemStyle(pairIdx)}
              >
                <span className="font-semibold">
                  {resolveMeaning(exercise.pairs[pairIdx].native, nativeLang)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 p-4 pb-6"
            style={{
              background: !hadWrong ? 'rgba(88,204,2,0.15)' : 'rgba(255,75,75,0.12)',
              borderTop: `2px solid ${!hadWrong ? 'var(--green)' : 'var(--red)'}`,
            }}
          >
            <div className="max-w-[480px] mx-auto">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">{!hadWrong ? '\u2713' : '\u2717'}</span>
                <div className="flex-1">
                  <p className="font-black text-lg" style={{ color: !hadWrong ? 'var(--green)' : 'var(--red)' }}>
                    {t(!hadWrong ? 'correct' : 'correct')}
                  </p>
                  {hadWrong && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {t('notQuite')}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNext}
                className="w-full py-4 rounded-2xl font-black text-lg text-white"
                style={{
                  background: !hadWrong ? 'var(--green)' : 'var(--red)',
                  boxShadow: !hadWrong ? '0 4px 0 var(--green-dark)' : '0 4px 0 #cc0000',
                }}
              >
                {isLast ? t('completeLesson') : `${t('continue')} →`}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
