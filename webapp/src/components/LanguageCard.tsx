'use client'

interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  difficulty: 'easy' | 'medium' | 'hard'
  tagline: string
  learners: string
  color: string
}

interface LanguageCardProps {
  language: Language
  selected: boolean
  onSelect: () => void
}

const DIFFICULTY_LABELS = {
  easy: { label: 'Easy', color: 'text-green-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  hard: { label: 'Challenging', color: 'text-orange-400' },
}

export default function LanguageCard({ language, selected, onSelect }: LanguageCardProps) {
  const diff = DIFFICULTY_LABELS[language.difficulty]

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl border-2 p-6 transition-all duration-200 
        ${selected
          ? 'border-primary-400 bg-primary-500/10 shadow-lg shadow-primary-500/20'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
        }`}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}

      {/* Flag */}
      <div className="text-4xl mb-3">{language.flag}</div>

      {/* Names */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-white">{language.name}</h3>
        <p className={`text-sm ${language.code === 'th' ? 'thai-text' : ''} text-slate-400`}>
          {language.nativeName}
        </p>
      </div>

      {/* Tagline */}
      <p className="text-slate-500 text-xs mb-3 leading-relaxed">{language.tagline}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium ${diff.color}`}>{diff.label}</span>
        <span className="text-slate-600">{language.learners} learners</span>
      </div>
    </button>
  )
}
