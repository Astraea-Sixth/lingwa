'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resolveObjectives, resolveText, getNativeLang } from '@/lib/resolve'
import { t } from '@/lib/i18n'

interface Lesson {
  id: string
  title: string | Record<string, string>
  objectives?: string[] | Record<string, string[]>
}

interface Unit {
  id?: number
  unit?: number
  title: string | Record<string, string>
  lessons: Lesson[]
}

/** Normalize unit identifier — JSON may use "unit" or "id" */
function unitId(u: Unit): number {
  return u.id ?? u.unit ?? 0
}

interface LessonTreeProps {
  lang: string
  level: string
  completedLessons: Record<string, { completed: boolean; perfect: boolean; xp: number }>
  onStartLesson: (unit: string, lesson: string) => void
}

type LessonState = 'locked' | 'available' | 'completed' | 'perfect'

function getLessonState(
  lessonId: string,
  completedLessons: LessonTreeProps['completedLessons'],
  allLessons: string[],
): LessonState {
  const comp = completedLessons[lessonId]
  if (comp?.completed) return comp.perfect ? 'perfect' : 'completed'

  const idx = allLessons.indexOf(lessonId)
  if (idx === 0) return 'available'
  const prevId = allLessons[idx - 1]
  if (completedLessons[prevId]?.completed) return 'available'
  return 'locked'
}

function LessonIcon({ state }: { state: LessonState }) {
  if (state === 'perfect') return <span className="text-xl">⭐</span>
  if (state === 'completed') return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="text-xl"
      style={{ color: 'var(--green)' }}
    >
      ✓
    </motion.span>
  )
  if (state === 'available') return <span className="text-xl">▶</span>
  return <span className="text-base" style={{ color: 'var(--text-muted)' }}>🔒</span>
}

export default function LessonTree({ lang, level, completedLessons, onStartLesson }: LessonTreeProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [nativeLang, setNativeLang] = useState('en')

  useEffect(() => {
    setNativeLang(getNativeLang())
  }, [])

  useEffect(() => {
    // Check localStorage for generated curriculum
    const localKey = `lingwa_curriculum_${lang}`
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null

    if (localRaw) {
      try {
        const curriculum = JSON.parse(localRaw)
        if (curriculum.units && curriculum.units.length > 0) {
          setUnits(curriculum.units)
          // Auto-expand first unit
          const firstId = curriculum.units[0].id ?? curriculum.units[0].unit ?? 1
          setExpandedUnits(new Set([firstId]))
          setLoading(false)
          return
        }
      } catch {
        // Fall through to API
      }
    }

    fetch(`/api/curriculum/${lang}/${level}`)
      .then(r => {
        if (!r.ok) throw new Error('No curriculum')
        return r.json()
      })
      .then(data => {
        if (data.units?.length > 0) {
          setUnits(data.units)
          const firstId = data.units[0].id ?? data.units[0].unit ?? 1
          setExpandedUnits(new Set([firstId]))
        }
        setLoading(false)
      })
      .catch(() => {
        // No hardcoded fallback — curriculum must be generated via onboarding
        setUnits([])
        setLoading(false)
      })
  }, [lang, level])

  const allLessonIds = units.flatMap(u => u.lessons.map(l => l.id))

  const toggleUnit = (unitId: number) => {
    setExpandedUnits(prev => {
      const next = new Set(prev)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }

  const isUnitUnlocked = (unit: Unit) => {
    if (unitId(unit) === 1) return true
    const prevUnit = units.find(u => unitId(u) === unitId(unit) - 1)
    if (!prevUnit) return false
    return prevUnit.lessons.every(l => completedLessons[l.id]?.completed)
  }

  const getUnitProgress = (unit: Unit) => {
    const completed = unit.lessons.filter(l => completedLessons[l.id]?.completed).length
    return { completed, total: unit.lessons.length }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ opacity: 0.5 }}>
            <div className="h-5 rounded-lg w-1/3 mb-2" style={{ background: 'var(--surface2)' }} />
            <div className="h-3 rounded-lg w-1/4" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="text-center p-8 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-4xl mb-3">📚</div>
        <p className="font-bold mb-2">{t('noCurriculum', nativeLang)}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          {t('completeOnboarding', nativeLang)}
        </p>
        <a href="/onboarding" className="btn-green inline-block px-6 py-3 rounded-2xl font-bold text-white" style={{ background: 'var(--green)' }}>
          {t('startOnboarding', nativeLang)} →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {units.map((unit, unitIndex) => {
        const unlocked = isUnitUnlocked(unit)
        const expanded = expandedUnits.has(unitId(unit))
        const unitProgress = getUnitProgress(unit)
        const unitComplete = unitProgress.completed === unitProgress.total && unitProgress.total > 0

        return (
          <motion.div
            key={unitId(unit)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: unitIndex * 0.05, duration: 0.3 }}
            style={{
              borderRadius: '16px',
              border: `2px solid ${!unlocked ? 'var(--border)' : unitComplete ? 'rgba(88,204,2,0.4)' : 'var(--border)'}`,
              background: 'var(--surface)',
              opacity: !unlocked ? 0.55 : 1,
              overflow: 'hidden',
            }}
          >
            {/* Unit header */}
            <button
              onClick={() => unlocked && toggleUnit(unitId(unit))}
              disabled={!unlocked}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                textAlign: 'left',
                background: 'transparent',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                border: 'none',
                color: 'var(--text)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Unit icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '15px',
                    flexShrink: 0,
                    background: unitComplete
                      ? 'rgba(88,204,2,0.15)'
                      : unlocked
                      ? 'rgba(28,176,246,0.12)'
                      : 'var(--surface2)',
                    color: unitComplete
                      ? 'var(--green)'
                      : unlocked
                      ? 'var(--blue)'
                      : 'var(--text-muted)',
                    border: `2px solid ${unitComplete ? 'rgba(88,204,2,0.3)' : unlocked ? 'rgba(28,176,246,0.25)' : 'var(--border)'}`,
                  }}
                >
                  {unitComplete ? '✓' : !unlocked ? '🔒' : unitId(unit)}
                </div>

                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: unlocked ? 'var(--text)' : 'var(--text-muted)',
                    }}
                  >
                    {t('unitLabel', nativeLang, { num: unitId(unit), title: resolveText(unit.title, nativeLang) })}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t('lessonsProgress', nativeLang, { completed: unitProgress.completed, total: unitProgress.total })}
                  </p>
                </div>
              </div>

              {unlocked && (
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ▼
                </span>
              )}
            </button>

            {/* Unit progress bar */}
            {unlocked && (
              <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingBottom: '8px' }}>
                <div
                  style={{
                    height: '4px',
                    background: 'var(--surface2)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(unitProgress.completed / unitProgress.total) * 100}%`,
                      background: unitComplete ? 'var(--green)' : 'var(--blue)',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Lessons */}
            <AnimatePresence>
              {unlocked && expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '4px 16px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {unit.lessons.map((lesson, lessonIdx) => {
                        const state = getLessonState(lesson.id, completedLessons, allLessonIds)
                        const [unitPart, lessonPart] = lesson.id.split('.')

                        const borderColor = {
                          locked: 'var(--border)',
                          available: 'var(--blue)',
                          completed: 'var(--green)',
                          perfect: 'var(--yellow)',
                        }[state]

                        const bgColor = {
                          locked: 'transparent',
                          available: 'rgba(28,176,246,0.06)',
                          completed: 'rgba(88,204,2,0.06)',
                          perfect: 'rgba(255,200,0,0.06)',
                        }[state]

                        return (
                          <motion.button
                            key={lesson.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: lessonIdx * 0.04, duration: 0.25 }}
                            onClick={() => state !== 'locked' && onStartLesson(unitPart, lessonPart)}
                            disabled={state === 'locked'}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 14px',
                              borderRadius: '14px',
                              border: `2px solid ${borderColor}`,
                              background: bgColor,
                              textAlign: 'left',
                              cursor: state === 'locked' ? 'not-allowed' : 'pointer',
                              opacity: state === 'locked' ? 0.45 : 1,
                              transition: 'all 0.15s',
                              width: '100%',
                            }}
                          >
                            {/* Lesson icon circle */}
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: {
                                  locked: 'var(--surface2)',
                                  available: 'rgba(28,176,246,0.15)',
                                  completed: 'rgba(88,204,2,0.15)',
                                  perfect: 'rgba(255,200,0,0.15)',
                                }[state],
                                boxShadow: state === 'available'
                                  ? '0 0 12px rgba(28,176,246,0.35)'
                                  : 'none',
                              }}
                            >
                              <LessonIcon state={state} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontWeight: 600,
                                  fontSize: '14px',
                                  color: state === 'locked' ? 'var(--text-muted)' : 'var(--text)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {resolveText(lesson.title, nativeLang)}
                              </p>
                              <p
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--text-muted)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  marginTop: '2px',
                                }}
                              >
                                {resolveObjectives(lesson.objectives, getNativeLang()).join(' · ')}
                              </p>
                            </div>

                            {state === 'available' && (
                              <span style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                                {t('start', nativeLang)} →
                              </span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
