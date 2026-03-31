'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { t } from '@/lib/i18n'
import { getNativeLang } from '@/lib/resolve'
import { isHostedMode } from '@/lib/supabase'
import { getSession, getUser } from '@/lib/auth'
import { loadFromCloud } from '@/lib/cloudProgress'

interface UserProfile {
  targetLang: string
  targetLangCode: string
  nativeLang: string
  level: string
  gender: string
}

interface LangProgress {
  xp: number
  streak: number
  lessonsCompleted: Record<string, { completed: boolean; perfect: boolean; xp: number }>
}

const LANG_FLAGS: Record<string, string> = {
  th: '🇹🇭', ja: '🇯🇵', ko: '🇰🇷', ms: '🇲🇾', id: '🇮🇩',
  vi: '🇻🇳', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', zh: '🇨🇳',
  pt: '🇧🇷', it: '🇮🇹', ar: '🇸🇦', ru: '🇷🇺', xx: '🌍',
}

export default function HomePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<LangProgress | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [nativeLang, setNativeLang] = useState('en')
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    async function init() {
      // In hosted mode, require auth
      if (isHostedMode()) {
        const session = await getSession()
        if (!session) {
          router.replace('/auth')
          return
        }
        // Load cloud progress into localStorage
        const user = await getUser()
        if (user) await loadFromCloud(user.id)
      }
      setAuthChecked(true)
      setMounted(true)
      setNativeLang(getNativeLang())
      const raw = localStorage.getItem('lingwa_profile')
      if (raw) {
        try {
          const p: UserProfile = JSON.parse(raw)
          setProfile(p)
          const progRaw = localStorage.getItem(`lingwa:progress:${p.targetLangCode}`)
          if (progRaw) {
            setProgress(JSON.parse(progRaw))
          }
        } catch {
          // corrupted — ignore
        }
      }
    }
    init()
  }, [router])

  function handleReset() {
    if (profile) {
      localStorage.removeItem('lingwa_profile')
      localStorage.removeItem(`lingwa_curriculum_${profile.targetLangCode}`)
    }
    setProfile(null)
    setProgress(null)
    setShowReset(false)
  }

  if (!mounted) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />
  }

  const flag = profile ? (LANG_FLAGS[profile.targetLangCode] ?? '🌍') : null
  const completedCount = progress
    ? Object.values(progress.lessonsCompleted).filter(l => l.completed).length
    : 0

  return (
    <div className="min-h-screen flex flex-col items-center py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[480px] mx-auto px-4">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl font-black tracking-tight">lingwa</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>v2</span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-black leading-tight mb-3">
            {t('learnAnyLanguage', nativeLang)}<br />
            <span style={{ color: 'var(--green)' }}>{t('builtForYou', nativeLang)}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-base leading-relaxed">
            {t('heroDesc', nativeLang)}
          </p>
        </motion.div>

        {/* Existing profile — Continue Learning */}
        {profile ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="space-y-4"
          >
            {/* Profile card */}
            <div
              className="rounded-2xl p-5 border-2 space-y-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {/* Language + level */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">{flag}</span>
                    <div>
                      <p className="font-black text-xl">{profile.targetLang}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {t('level', nativeLang, { level: profile.level })}
                      </p>
                    </div>
                  </div>
                </div>
                {progress && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span>🔥</span>
                      <span className="font-bold text-sm">{progress.streak}</span>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'var(--surface2)', color: 'var(--yellow)' }}
                    >
                      ⚡ {progress.xp} XP
                    </div>
                  </div>
                )}
              </div>

              {/* Topics removed — onboarding no longer collects topics */}

              {/* Lessons progress */}
              {completedCount > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {completedCount === 1 ? t('lessonsCompleted', nativeLang, { count: completedCount }) : t('lessonsCompletedPlural', nativeLang, { count: completedCount })}
                </p>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/${profile.targetLangCode}?level=${profile.level}`)}
              className="btn-green w-full py-4 text-lg"
            >
              {flag} {t('continueLearning', nativeLang, { lang: profile.targetLang })} →
            </button>

            {/* Reset */}
            <div className="text-center">
              {!showReset ? (
                <button
                  onClick={() => setShowReset(true)}
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('changeLanguage', nativeLang)}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {t('resetConfirm', nativeLang)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowReset(false)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    >
                      {t('cancel', nativeLang)}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{ borderColor: 'rgba(255,80,80,0.5)', color: 'rgb(255,100,100)', background: 'rgba(255,80,80,0.06)' }}
                    >
                      {t('reset', nativeLang)}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* No profile — Start Learning */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="space-y-6"
          >
            {/* Feature list */}
            <div className="space-y-3">
              {[
                { emoji: '🎯', key: 'featureCurated' as const },
                { emoji: '💬', key: 'featureChat' as const },
                { emoji: '🔒', key: 'featureLocal' as const },
                { emoji: '📱', key: 'featureFree' as const },
              ].map(item => (
                <div key={item.emoji} className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t(item.key, nativeLang)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/onboarding')}
              className="btn-green w-full py-4 text-lg"
            >
              {t('startLearning', nativeLang)} →
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('freeOpenSource', nativeLang)}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
