'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import VoiceChat from '@/components/VoiceChat'
import { getLanguageProgress } from '@/lib/progress'
import { resolveText, getNativeLang } from '@/lib/resolve'
import { isHostedMode } from '@/lib/supabase'
import { getUser } from '@/lib/auth'
import { loadApiKeys, saveApiKeys, type ApiKeys } from '@/lib/cloudProgress'

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

const PROVIDERS = [
  { key: 'anthropic' as const, label: 'Anthropic', placeholder: 'sk-ant-...' },
  { key: 'openai' as const, label: 'OpenAI', placeholder: 'sk-...' },
  { key: 'google' as const, label: 'Google AI', placeholder: 'AIza...' },
  { key: 'groq' as const, label: 'Groq', placeholder: 'gsk_...' },
]

function BYOKModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [keys, setKeys] = useState<ApiKeys>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadApiKeys(userId).then(k => {
      setKeys(k)
      setLoaded(true)
    })
  }, [userId])

  async function handleSave() {
    setSaving(true)
    await saveApiKeys(userId, keys)
    // Also cache in localStorage for immediate use
    localStorage.setItem('lingwa_api_keys', JSON.stringify(keys))
    setSaving(false)
    onClose()
  }

  if (!loaded) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-4 p-6 rounded-2xl max-w-md w-full"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <h2 className="font-black text-lg mb-1">AI Provider Keys</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Add at least one key to enable AI chat. Keys are stored securely in your account.
        </p>

        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <div key={p.key}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
                {p.label}
              </label>
              <input
                type="password"
                placeholder={p.placeholder}
                value={keys[p.key] || ''}
                onChange={e => setKeys(prev => ({ ...prev, [p.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '2px solid var(--border)', color: 'var(--text)' }}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm border-2"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40"
            style={{ background: 'var(--green)' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  )
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

  // BYOK modal state (hosted mode only)
  const [showBYOK, setShowBYOK] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasKey, setHasKey] = useState(true) // assume true until checked

  useEffect(() => {
    if (!isHostedMode()) return
    getUser().then(user => {
      if (user) {
        setUserId(user.id)
        // Check if user has any API key saved locally
        try {
          const cached = localStorage.getItem('lingwa_api_keys')
          if (cached) {
            const keys: ApiKeys = JSON.parse(cached)
            const any = Object.values(keys).some(v => v && v.length > 0)
            setHasKey(any)
            if (!any) setShowBYOK(true)
          } else {
            // Load from cloud
            loadApiKeys(user.id).then(keys => {
              const any = Object.values(keys).some(v => v && v.length > 0)
              if (any) {
                localStorage.setItem('lingwa_api_keys', JSON.stringify(keys))
              }
              setHasKey(any)
              if (!any) setShowBYOK(true)
            })
          }
        } catch {
          setHasKey(false)
          setShowBYOK(true)
        }
      }
    })
  }, [])

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
          {isHostedMode() && (
            <button
              onClick={() => setShowBYOK(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
            >
              API Keys
            </button>
          )}
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

      {showBYOK && userId && (
        <BYOKModal
          userId={userId}
          onClose={() => {
            setShowBYOK(false)
            // Re-check keys
            try {
              const cached = localStorage.getItem('lingwa_api_keys')
              if (cached) {
                const keys: ApiKeys = JSON.parse(cached)
                setHasKey(Object.values(keys).some(v => v && v.length > 0))
              }
            } catch { /* ignore */ }
          }}
        />
      )}
    </main>
  )
}
