'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import VoiceChat from '@/components/VoiceChat'
import { getLanguageProgress } from '@/lib/progress'
import { resolveText, getNativeLang } from '@/lib/resolve'

function getTutorName(lang: string): string {
  if (typeof window === 'undefined') return 'Your Tutor'
  try {
    const configRaw = localStorage.getItem(`lingwa_lang_config_${lang}`)
    if (configRaw) {
      const config = JSON.parse(configRaw)
      if (config.tutor?.name) return config.tutor.name
    }
  } catch { /* ignore */ }
  return 'Your Tutor'
}

function getUnitTitle(lang: string, unitNum: number): string {
  if (typeof window === 'undefined') return `Unit ${unitNum} vocabulary`
  try {
    const raw = localStorage.getItem(`lingwa_curriculum_${lang}`)
    if (raw) {
      const curriculum = JSON.parse(raw)
      const unit = curriculum.units?.find((u: { id: number }) => u.id === unitNum)
      if (unit?.title) return resolveText(unit.title, getNativeLang())
    }
  } catch { /* ignore */ }
  return `Unit ${unitNum} vocabulary`
}

function getLevel(): string {
  if (typeof window === 'undefined') return 'A1'
  try {
    const p = localStorage.getItem('lingwa_profile')
    return p ? JSON.parse(p).level || 'A1' : 'A1'
  } catch { return 'A1' }
}

function buildChatMode(lang: string, unit: string | null, mode: string | null, tutorName: string): string {
  if (mode === 'final') {
    return `You are ${tutorName}. This is the student's FINAL CHALLENGE. Use vocabulary from ALL units covered. No hints. No showing phrases. Just have a natural conversation and correct any mistakes. Be encouraging but thorough. Test comprehensively across all topics.`
  }
  if (mode === 'unit' && unit) {
    const unitNum = parseInt(unit, 10)
    const topic = getUnitTitle(lang, unitNum)
    return `You are ${tutorName}. The student just completed Unit ${unitNum}. Have a free conversation using ONLY vocabulary from Unit ${unitNum}. Topic: ${topic}. Keep it fun and conversational. No quizzes — just talk! Gently introduce new uses of the words they learned. If they use correct vocabulary, praise them specifically.`
  }
  return ''
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = params.lang as string

  const unit = searchParams.get('unit')
  const mode = searchParams.get('mode')

  const progress = getLanguageProgress(lang)
  const tutorName = getTutorName(lang)

  const chatMode = buildChatMode(lang, unit, mode, tutorName)
  const chatModeKey = mode === 'final' ? 'final' : (mode === 'unit' && unit) ? `unit_${unit}` : 'free'

  const isFinal = mode === 'final'
  const isUnit = mode === 'unit' && !!unit

  const headerSubtitle = isFinal
    ? 'Final Challenge — All units'
    : isUnit
    ? `Unit ${unit} Conversation Practice`
    : 'Free conversation · AI Language Tutor'

  const lessonTitle = isFinal
    ? 'Final Challenge'
    : isUnit
    ? `Unit ${unit} Practice`
    : 'Free Conversation'

  const handleComplete = () => {
    router.push(`/${lang}`)
  }

  return (
    <main className="min-h-screen bg-midnight overflow-hidden">
      <header className="border-b border-slate-800 sticky top-0 z-10 bg-midnight/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'var(--surface2)' }}
          >
            {isFinal ? '🏆' : '🌍'}
          </div>
          <div>
            <p className="font-bold text-white">{tutorName}</p>
            <p className="text-slate-500 text-xs">{headerSubtitle}</p>
          </div>
        </div>
      </header>

      <VoiceChat
        lang={lang}
        unit={unit ? parseInt(unit, 10) : (progress?.currentUnit ?? 1)}
        lesson={progress?.currentLesson ?? 1}
        lessonTitle={lessonTitle}
        keyPhrases={[]}
        tutorName={tutorName}
        level={getLevel()}
        chatMode={chatMode}
        chatModeKey={chatModeKey}
        onComplete={handleComplete}
      />
    </main>
  )
}
