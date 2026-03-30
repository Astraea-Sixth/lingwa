'use client'

import { motion } from 'framer-motion'

interface UnitCompleteProps {
  unitNumber: number
  unitTitle: string
  vocabCount: number
  totalXP: number
  lang: string
  tutorName: string
  isLastUnit: boolean
  onContinue: () => void
  onUnitChat: () => void
}

export default function UnitComplete({
  unitNumber,
  unitTitle,
  vocabCount,
  totalXP,
  tutorName,
  onContinue,
  onUnitChat,
}: UnitCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center text-center px-6 py-12 max-w-[480px] mx-auto min-h-[70vh] justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-7xl mb-6"
      >
        🎊
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-black mb-2"
      >
        Unit {unitNumber} Complete!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-lg font-semibold mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {unitTitle}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6"
        style={{ color: 'var(--text-muted)' }}
      >
        You learned {vocabCount} new words
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 text-2xl font-bold mb-10 px-5 py-3 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <span style={{ color: 'var(--green)' }}>+{totalXP} XP</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full space-y-3"
      >
        <button onClick={onUnitChat} className="btn-green w-full py-4 text-lg">
          🎙️ Chat with {tutorName} about Unit {unitNumber}
        </button>
        <button
          onClick={onContinue}
          className="w-full py-3 text-base font-semibold"
          style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
        >
          Continue &rarr;
        </button>
      </motion.div>
    </motion.div>
  )
}
