'use client'

interface StreakBadgeProps {
  streak: number
  xp: number
  compact?: boolean
}

export default function StreakBadge({ streak, xp, compact = false }: StreakBadgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-accent-400 font-bold">🔥 {streak}</span>
        <span className="text-primary-300 font-bold">⚡ {xp}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center">
        <span className="text-2xl">🔥</span>
        <span className="text-accent-400 font-bold text-sm">{streak}</span>
        <span className="text-slate-600 text-xs">streak</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl">⚡</span>
        <span className="text-primary-300 font-bold text-sm">{xp}</span>
        <span className="text-slate-600 text-xs">XP</span>
      </div>
    </div>
  )
}
