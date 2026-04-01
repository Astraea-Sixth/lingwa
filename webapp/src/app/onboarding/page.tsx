'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { t, registerFromConfig } from '@/lib/i18n'
import { getNativeLang } from '@/lib/resolve'
import { isHostedMode } from '@/lib/supabase'
import { loadStaticConfig, loadStaticCurriculum, loadLanguageCodes } from '@/lib/staticCourses'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface UserProfile {
  targetLang: string
  targetLangCode: string
  nativeLang: string
  nativeLangCode: string
  level: string
  gender: string
}

interface AvailableCourse {
  language: string
  languageName: string
  flag: string
  level: string
  path: string
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const LEVELS = [
  { value: 'A1', label: 'Complete beginner', desc: 'I know zero words' },
  { value: 'A2', label: 'Know a few basics', desc: 'Can say hello and numbers' },
]

const GENDERS = [
  { value: 'male', emoji: '🙋‍♂️', label: 'Male' },
  { value: 'female', emoji: '🙋‍♀️', label: 'Female' },
  { value: 'both', emoji: '👐', label: 'Show me both' },
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [courses, setCourses] = useState<AvailableCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 0: Native language
  const [nativeLangCode, setNativeLangCode] = useState('')
  const [nativeLangName, setNativeLangName] = useState('')
  // Config cache for nativeName lookup
  const [configMap, setConfigMap] = useState<Record<string, any>>({})

  // Step 1: Target language (from available courses)
  const [selectedLang, setSelectedLang] = useState('')
  const [selectedLangName, setSelectedLangName] = useState('')
  const [selectedFlag, setSelectedFlag] = useState('')

  // Step 2: Level
  const [level, setLevel] = useState('')

  // Step 3: Gender
  const [gender, setGender] = useState('')

  // Fetch available courses on mount
  useEffect(() => {
    async function loadCourses() {
      try {
        if (isHostedMode()) {
          // Hosted mode: load from manifest + static config files
          const langCodes = await loadLanguageCodes()
          const configs = await Promise.all(
            langCodes.map(code => loadStaticConfig(code))
          )
          const courseList: AvailableCourse[] = []
          const cfgMap: Record<string, any> = {}
          for (const config of configs) {
            if (!config) continue
            // Register UI translations from each config
            registerFromConfig(config)
            cfgMap[config.code] = config
            const levels = config.cefr_available || ['A1']
            for (const lvl of levels) {
              courseList.push({
                language: config.code,
                languageName: config.name,
                flag: config.flag,
                level: lvl,
                path: `courses/${config.code}/courses/${lvl.toLowerCase()}.json`,
              })
            }
          }
          setCourses(courseList)
          setConfigMap(cfgMap)
        } else {
          // Local mode: use Python API
          const res = await fetch('/api/courses')
          const data: AvailableCourse[] = await res.json()
          setCourses(data)
          // Also load configs for translation registration and native name display
          const langCodes = Array.from(new Set(data.map((c: AvailableCourse) => c.language)))
          const configs = await Promise.all(langCodes.map(code => loadStaticConfig(code)))
          const cfgMap: Record<string, any> = {}
          for (const config of configs) {
            if (config) {
              registerFromConfig(config)
              cfgMap[config.code] = config
            }
          }
          setConfigMap(cfgMap)
        }
        setLoading(false)
      } catch {
        setError('Could not load courses. Make sure the API is running.')
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  // Get unique languages from available courses
  const availableLanguages = courses.reduce<Array<{ code: string; name: string; flag: string; levels: string[] }>>(
    (acc, course) => {
      const existing = acc.find(l => l.code === course.language)
      if (existing) {
        if (!existing.levels.includes(course.level)) existing.levels.push(course.level)
      } else {
        acc.push({ code: course.language, name: course.languageName, flag: course.flag, levels: [course.level] })
      }
      return acc
    },
    []
  )

  // Check if selected language has gendered speech (needs gender step)
  // Derived from config's genderRelevant field, or fallback to known gendered languages
  const selectedConfig = configMap[selectedLang]
  const needsGender = selectedConfig?.genderRelevant === true
    || selectedConfig?.gender?.required === true
    || (!selectedConfig && false) // no config = skip gender step
  const effectiveSteps = needsGender ? 4 : 3
  // Total visual steps always includes all possible steps for progress bar
  const totalSteps = 4

  function goNext() {
    setDirection(1)
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  function canProceed(): boolean {
    if (step === 0) return nativeLangCode.length > 0
    if (step === 1) return selectedLang.length > 0
    if (step === 2) return level.length > 0
    if (step === 3) return gender.length > 0
    return false
  }

  async function handleFinish() {
    const finalGender = needsGender ? gender : 'both'
    if (needsGender && !gender) return

    setStarting(true)

    const profile: UserProfile = {
      targetLang: selectedLangName,
      targetLangCode: selectedLang,
      nativeLang: nativeLangName,
      nativeLangCode: nativeLangCode,
      level,
      gender: finalGender,
    }

    try {
      let course, config

      if (isHostedMode()) {
        // Hosted mode: load from static files
        course = await loadStaticCurriculum(selectedLang, level)
        if (!course) throw new Error('Course not available')
        config = await loadStaticConfig(selectedLang)
      } else {
        // Local mode: load from Python API
        const res = await fetch(`/api/courses/${selectedLang}/${level.toLowerCase()}`)
        if (!res.ok) throw new Error(`Course not available (${res.status})`)
        course = await res.json()
        const configRes = await fetch(`/api/languages/${selectedLang}/config`)
        if (configRes.ok) config = await configRes.json()
      }

      // Save to localStorage (same key the lesson page reads)
      localStorage.setItem('lingwa_profile', JSON.stringify(profile))
      localStorage.setItem(`lingwa_curriculum_${selectedLang}`, JSON.stringify(course))
      localStorage.setItem(`lingwa_gender_${selectedLang}`, finalGender)
      if (config) {
        localStorage.setItem(`lingwa_lang_config_${selectedLang}`, JSON.stringify(config))
      }

      // Go! Instant start.
      router.push(`/${selectedLang}?level=${level}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
      setStarting(false)
    }
  }

  const stepVariantsDirected = {
    enter: { opacity: 0, x: direction * 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -40 },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center space-y-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--green)',
              margin: '0 auto',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">{t('loadingCourses', nativeLangCode || 'en')}</p>
        </div>
      </div>
    )
  }

  if (starting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="text-5xl">{selectedFlag}</div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--green)' }}>
            {t('letsGo', nativeLangCode || 'en')}
          </h1>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {t('loadingCourse', nativeLangCode || 'en', { lang: selectedLangName })}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Logo */}
      <div className="w-full max-w-[480px] mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight">lingwa</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>v2</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[480px] mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t('stepOf', nativeLangCode || 'en', { current: step + 1, total: totalSteps })}
          </span>
          {step > 0 && (
            <button onClick={goBack} className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              ← {t('back', nativeLangCode || 'en')}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: '4px', borderRadius: '999px',
                background: i <= step ? 'var(--green)' : 'var(--surface2)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-[480px] mb-4 p-4 rounded-2xl" style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.3)' }}>
          <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="w-full max-w-[480px] flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariantsDirected}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >

            {/* ── Step 0: Your language (native) ── */}
            {step === 0 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">{t('yourLanguage', nativeLangCode || 'en')}</h1>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                  {t('pickNativeLang', nativeLangCode || 'en')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setNativeLangCode(lang.code)
                        setNativeLangName(lang.name)
                      }}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left"
                      style={{
                        background: nativeLangCode === lang.code ? 'rgba(88,204,2,0.1)' : 'var(--surface)',
                        borderColor: nativeLangCode === lang.code ? 'var(--green)' : 'var(--border)',
                      }}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="font-bold text-sm">{configMap[lang.code]?.nativeName || lang.name}</span>
                      {nativeLangCode === lang.code && (
                        <div
                          className="ml-auto w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--green)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 1: Pick target language ── */}
            {step === 1 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">{t('whatToLearn', nativeLangCode || 'en')}</h1>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                  {t('pickTargetLang', nativeLangCode || 'en')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.filter(lang => lang.code !== nativeLangCode).map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLang(lang.code)
                        setSelectedLangName(lang.name)
                        setSelectedFlag(lang.flag)
                      }}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left"
                      style={{
                        background: selectedLang === lang.code ? 'rgba(88,204,2,0.1)' : 'var(--surface)',
                        borderColor: selectedLang === lang.code ? 'var(--green)' : 'var(--border)',
                      }}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <div>
                        <p className="font-bold text-sm">{lang.name}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {availableLanguages.length === 0 && (
                  <div className="text-center py-8">
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                      {t('noCourses', nativeLangCode || 'en')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Level ── */}
            {step === 2 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">{t('whatsYourLevel', nativeLangCode || 'en', { lang: selectedLangName })}</h1>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                  {t('beHonest', nativeLangCode || 'en')}
                </p>

                <div className="flex flex-col gap-3">
                  {LEVELS.filter(l => {
                    // Only show levels that have courses
                    const langCourses = courses.filter(c => c.language === selectedLang)
                    return langCourses.some(c => c.level === l.value)
                  }).map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className="w-full text-left px-4 py-4 rounded-2xl border-2 transition-all"
                      style={{
                        background: level === l.value ? 'rgba(28,176,246,0.1)' : 'var(--surface)',
                        borderColor: level === l.value ? 'var(--blue)' : 'var(--border)',
                      }}
                    >
                      <p className="font-bold text-base">{l.value} — {t(l.value === 'A1' ? 'completeBeginner' : 'knowBasics', nativeLangCode || 'en')}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t(l.value === 'A1' ? 'knowZeroWords' : 'canSayHello', nativeLangCode || 'en')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Gender (only for gendered languages) ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">{t('yourGender', nativeLangCode || 'en')}</h1>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                  {t('genderExplain', nativeLangCode || 'en', { lang: selectedLangName })}
                </p>

                <div className="flex flex-col gap-3">
                  {GENDERS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setGender(g.value)}
                      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left"
                      style={{
                        background: gender === g.value ? 'rgba(88,204,2,0.1)' : 'var(--surface)',
                        borderColor: gender === g.value ? 'var(--green)' : 'var(--border)',
                      }}
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="font-bold text-base">{t(g.value === 'male' ? 'male' : g.value === 'female' ? 'female' : 'showBoth', nativeLangCode || 'en')}</span>
                      {gender === g.value && (
                        <div
                          className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--green)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA button */}
      <div className="w-full max-w-[480px] mt-8">
        <button
          onClick={step >= effectiveSteps - 1 ? handleFinish : goNext}
          disabled={!canProceed()}
          className="btn-green w-full py-4 text-lg"
          style={{
            opacity: canProceed() ? 1 : 0.35,
            cursor: canProceed() ? 'pointer' : 'not-allowed',
          }}
        >
          {step >= effectiveSteps - 1 ? `${t('startLearning', nativeLangCode || 'en')} →` : `${t('continue', nativeLangCode || 'en')} →`}
        </button>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}>
      <OnboardingContent />
    </Suspense>
  )
}
