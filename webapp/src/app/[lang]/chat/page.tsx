'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import VoiceChat from '@/components/VoiceChat'
import { getLanguageProgress } from '@/lib/progress'
import { resolveText } from '@/lib/resolve'
import { useI18n } from '@/lib/i18n-context'
import { isHostedMode } from '@/lib/supabase'

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

function getUnitTitle(lang: string, unitNum: number, nativeLang: string): string {
  if (typeof window === 'undefined') return `Unit ${unitNum} vocabulary`
  try {
    const raw = localStorage.getItem(`lingwa_curriculum_${lang}`)
    if (raw) {
      const curriculum = JSON.parse(raw)
      const unit = curriculum.units?.find((u: { id: number }) => u.id === unitNum)
      if (unit?.title) return resolveText(unit.title, nativeLang)
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

function buildChatMode(lang: string, unit: string | null, mode: string | null, tutorName: string, nativeLang: string): string {
  if (mode === 'final') {
    return `You are ${tutorName}. This is the student's FINAL CHALLENGE. Use vocabulary from ALL units covered. No hints. No showing phrases. Just have a natural conversation and correct any mistakes. Be encouraging but thorough. Test comprehensively across all topics.`
  }
  if (mode === 'unit' && unit) {
    const unitNum = parseInt(unit, 10)
    const topic = getUnitTitle(lang, unitNum, nativeLang)
    return `You are ${tutorName}. The student just completed Unit ${unitNum}. Have a free conversation using ONLY vocabulary from Unit ${unitNum}. Topic: ${topic}. Keep it fun and conversational. No quizzes — just talk! Gently introduce new uses of the words they learned. If they use correct vocabulary, praise them specifically.`
  }
  return ''
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = params.lang as string
  const hosted = isHostedMode()
  const { nativeLang } = useI18n()

  const unit = searchParams.get('unit')
  const mode = searchParams.get('mode')

  const progress = getLanguageProgress(lang)
  const tutorName = getTutorName(lang)

  const chatMode = buildChatMode(lang, unit, mode, tutorName, nativeLang)
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

  // In hosted mode, show locked screen
  if (hosted) {
    return (
      <main className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: 'var(--border)', background: 'rgba(19,31,36,0.95)' }}>
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              style={{ color: 'var(--text-muted)' }}
              className="hover:text-white transition-colors"
            >
              ←
            </button>
            <div className="flex-1">
              <p className="font-bold text-white">AI Tutor</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Conversation Practice</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-sm"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              🔒
            </div>
            <h2 className="text-2xl font-black mb-3">AI Tutor — Coming Soon</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
              Self-host Lingwa with Ollama to unlock AI conversation practice.
              It&apos;s free, private, and runs entirely on your machine.
            </p>
            <a
              href="https://github.com/openclawai/lingwa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              View on GitHub →
            </a>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ borderColor: 'var(--border)', background: 'rgba(19,31,36,0.95)' }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            style={{ color: 'var(--text-muted)' }}
            className="hover:text-white transition-colors"
          >
            ←
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: 'var(--surface2)' }}
          >
            {isFinal ? '🏆' : '🌍'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">{tutorName}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{headerSubtitle}</p>
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
