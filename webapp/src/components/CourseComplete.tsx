'use client'

import { motion } from 'framer-motion'

interface CourseCompleteProps {
  level: string
  lang: string
  langName: string
  totalVocab: number
  totalXP: number
  tutorName: string
  onFinalChat: () => void
  onContinue: () => void
}

// Simple confetti-style floating particles using framer-motion
function ConfettiParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (i % 4) * 80 - 120 + Math.random() * 40,
    delay: i * 0.1,
    emoji: ['✨', '🌟', '⭐', '💫'][i % 4],
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 60, x: p.x, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [60, -40, -100, -160],
            scale: [0, 1.2, 1, 0.6],
          }}
          transition={{
            duration: 2.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute text-2xl"
          style={{ left: '50%', top: '30%' }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  )
}

export default function CourseComplete({
  level,
  langName,
  totalVocab,
  totalXP,
  tutorName,
  onFinalChat,
  onContinue,
}: CourseCompleteProps) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center">
      <ConfettiParticles />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center text-center px-6 py-12 max-w-[480px] mx-auto relative z-10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 180 }}
          className="text-8xl mb-6"
        >
          🏆
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black mb-3"
        >
          {level} Complete!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-lg mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          You&apos;ve mastered {totalVocab} {langName} words
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 text-2xl font-bold mb-10 px-5 py-3 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--green)' }}>{totalXP} XP total</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="w-full space-y-3"
        >
          <button onClick={onFinalChat} className="btn-green w-full py-4 text-lg">
            🏆 Final Challenge with {tutorName}
          </button>
          <button
            onClick={onContinue}
            className="w-full py-3 text-base font-semibold"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
          >
            See what&apos;s next &rarr;
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
