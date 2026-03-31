'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import LessonTree from '@/components/LessonTree'
import { getLanguageProgress, initProgress } from '@/lib/progress'
import { t } from '@/lib/i18n'
import { getNativeLang } from '@/lib/resolve'
import { isHostedMode } from '@/lib/supabase'
import { loadStaticConfig } from '@/lib/staticCourses'

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const
const LEVEL_RANK: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3 }

const LEVEL_LABELS: Record<string, string> = {
  A1: 'levelA1',
  A2: 'levelA2',
  B1: 'levelB1',
  B2: 'levelB2',
}

interface LangConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  tutor: { name: string; nameNative: string }
}

export default function CoursePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lang = params.lang as string
  const level = searchParams.get('level') || 'A1'

  const [config, setConfig] = useState<LangConfig | null>(null)
  const [nativeLang, setNativeLang] = useState('en')
  const [progress, setProgress] = useState(getLanguageProgress(lang))
  const [xpToast, setXpToast] = useState<number | null>(null)

  // Level selector
  const [profileLevel, setProfileLevel] = useState('A1')
  const [selectedLevel, setSelectedLevel] = useState(level)
  const [skipModal, setSkipModal] = useState<string | null>(null)

  useEffect(() => {
    setNativeLang(getNativeLang())
    // Read profile level
    try {
      const raw = localStorage.getItem('lingwa_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.level) {
          setProfileLevel(p.level)
          setSelectedLevel(p.level)
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    initProgress(lang, level)
    setProgress(getLanguageProgress(lang))

    async function loadConfig() {
      // In hosted mode, load from static files
      if (isHostedMode()) {
        try {
          const data = await loadStaticConfig(lang)
          if (data) {
            setConfig(data)
            localStorage.setItem(`lingwa_lang_config_${lang}`, JSON.stringify(data))
            return
          }
        } catch { /* fall through */ }
      }
      // Non-hosted: try API
      try {
        const r = await fetch(`/api/languages/${lang}/config`)
        if (!r.ok) throw new Error('No config')
        const data = await r.json()
        setConfig(data)
      } catch {
        // Build config from profile
        const profileRaw = typeof window !== 'undefined' ? localStorage.getItem('lingwa_profile') : null
        if (profileRaw) {
          try {
            const p = JSON.parse(profileRaw)
            setConfig({
              code: p.targetLangCode || lang,
              name: p.targetLang || lang,
              nativeName: p.targetLang || lang,
              flag: '🌍',
              tutor: { name: 'Your Tutor', nameNative: '' },
            })
          } catch { /* ignore */ }
        }
      }
    }
    loadConfig()
  }, [lang, level])

  // Re-read progress on window focus (after returning from a lesson)
  useEffect(() => {
    const handleFocus = () => setProgress(getLanguageProgress(lang))
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [lang])

  // Show XP toast when returning from a completed lesson
  useEffect(() => {
    const xp = searchParams.get('xp')
    if (xp) {
      const xpVal = parseInt(xp)
      if (!isNaN(xpVal) && xpVal > 0) {
        setProgress(getLanguageProgress(lang))
        setXpToast(xpVal)
        setTimeout(() => setXpToast(null), 3000)
      }
    }
  }, [searchParams, lang])

  // Level selector logic
  const isLevelUnlocked = (lvl: string) => (LEVEL_RANK[lvl] ?? 0) <= (LEVEL_RANK[profileLevel] ?? 0)

  const handleLevelTap = (lvl: string) => {
    if (isLevelUnlocked(lvl)) {
      setSelectedLevel(lvl)
    } else {
      setSkipModal(lvl)
    }
  }

  const confirmSkip = () => {
    if (!skipModal) return
    // Update profile level
    try {
      const raw = localStorage.getItem('lingwa_profile')
      if (raw) {
        const p = JSON.parse(raw)
        p.level = skipModal
        localStorage.setItem('lingwa_profile', JSON.stringify(p))
      }
    } catch { /* ignore */ }
    setProfileLevel(skipModal)
    setSelectedLevel(skipModal)
    setSkipModal(null)
    // Re-init progress for new level
    initProgress(lang, skipModal)
    setProgress(getLanguageProgress(lang))
  }

  const xp = progress?.xp ?? 0
  const streak = progress?.streak ?? 0
  const xpToNext = 100
  const xpPercent = Math.min((xp % xpToNext) / xpToNext * 100, 100)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* XP toast after completing a lesson */}
      {xpToast && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-0 right-0 flex justify-center z-50"
        >
          <div className="px-6 py-3 rounded-2xl font-black text-lg" style={{ background: 'var(--green)', color: 'white' }}>
            +{xpToast} XP 🎉
          </div>
        </motion.div>
      )}
      {/* Sticky top bar */}
      <header
        style={{
          background: 'rgba(19,31,36,0.95)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-[480px] mx-auto">
          {/* Left: back + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              style={{ color: 'var(--text-muted)' }}
              className="hover:text-white transition-colors text-lg font-bold leading-none"
            >
              ←
            </button>
            <span className="font-black text-lg tracking-tight">lingwa</span>
            {config && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {config.flag} {config.name}
              </span>
            )}
          </div>

          {/* Right: streak + XP */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg">🔥</span>
              <span className="font-bold text-sm">{streak}</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'var(--surface)', color: 'var(--yellow)' }}
            >
              ⚡ {xp} XP
            </div>
          </div>
        </div>

        {/* XP progress bar */}
        <div className="px-4 pb-2 max-w-[480px] mx-auto">
          <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${xpPercent}%`,
                background: 'var(--green)',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </header>

      <div className="px-4 py-6 max-w-[480px] mx-auto">
        {/* Tutor card */}
        {config && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="card mb-6 flex items-center gap-4"
          >
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'var(--surface2)', border: '2px solid var(--border)' }}
            >
              {config.flag}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
                {t('yourAiTutor', nativeLang)}
              </p>
              <p className="font-bold text-base">
                {config.tutor.name}
                {config.tutor.nameNative !== config.tutor.name && (
                  <span className="ml-2 text-sm thai" style={{ color: 'var(--blue)' }}>
                    {config.tutor.nameNative}
                  </span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {t('completeUnitToUnlock', nativeLang)}
              </p>
            </div>
          </motion.div>
        )}

        {/* Level selector tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            {ALL_LEVELS.map(lvl => {
              const unlocked = isLevelUnlocked(lvl)
              const active = lvl === selectedLevel
              return (
                <button
                  key={lvl}
                  onClick={() => handleLevelTap(lvl)}
                  className="flex-1 py-2.5 rounded-xl text-center font-bold text-sm transition-all"
                  style={{
                    background: active ? 'var(--green)' : unlocked ? 'var(--surface)' : 'var(--surface2)',
                    color: active ? '#fff' : unlocked ? 'var(--text)' : 'var(--text-muted)',
                    border: active ? '2px solid var(--green)' : '2px solid var(--border)',
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  <div>{lvl}</div>
                  <div className="text-[10px] font-medium mt-0.5" style={{ opacity: 0.8 }}>
                    {unlocked ? t(LEVEL_LABELS[lvl], nativeLang) : '🔒'}
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Lesson Tree */}
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <LessonTree
            lang={lang}
            level={selectedLevel}
            completedLessons={progress?.lessonsCompleted ?? {}}
            onStartLesson={(unit, lesson) => router.push(`/${lang}/lesson/${unit}/${lesson}`)}
          />
        </motion.div>

        {/* Skip level modal */}
        {skipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-4 p-6 rounded-2xl max-w-sm w-full"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <p className="font-black text-lg mb-2">
                {t('skipToLevel', nativeLang, { level: skipModal })}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                {t('skipToLevelDesc', nativeLang, { level: skipModal })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSkipModal(null)}
                  className="flex-1 py-3 rounded-xl font-bold border-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {t('cancel', nativeLang)}
                </button>
                <button
                  onClick={confirmSkip}
                  className="flex-1 py-3 rounded-xl font-bold text-white"
                  style={{ background: 'var(--green)' }}
                >
                  {t('skipConfirm', nativeLang)}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  )
}
