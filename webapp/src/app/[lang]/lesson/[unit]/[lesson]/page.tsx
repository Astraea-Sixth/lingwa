'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CourseComplete from '@/components/CourseComplete'
import DrillMode from '@/components/DrillMode'
import ExerciseRouter from '@/components/ExerciseRouter'
import LessonTeach from '@/components/LessonTeach'
import UnitComplete from '@/components/UnitComplete'
import VoiceChat from '@/components/VoiceChat'
import { completeLesson, getLanguageProgress } from '@/lib/progress'
import { getGender, resolveText } from '@/lib/resolve'
import { useI18n } from '@/lib/i18n-context'

/**
 * Filter out reorder exercises tagged for the wrong gender.
 * e.g. Male user skips exercises with "(female)" in the prompt.
 */
function filterExercisesByGender(exercises: Exercise[], lang: string): Exercise[] {
  const gender = getGender(lang)
  if (gender === 'both') return exercises

  const opposite = gender === 'male' ? 'female' : 'male'

  return exercises.filter(ex => {
    if (ex.type !== 'reorder') return true
    const prompt = resolveText(ex.prompt as string | Record<string, string>, 'en')
    const lower = prompt.toLowerCase()
    // Skip if prompt explicitly mentions the opposite gender
    if (lower.includes(`(${opposite})`) || lower.includes(`${opposite} speaker`)) return false
    return true
  })
}

interface Exercise {
  type: string  // 'target_to_native' | 'native_to_target' | 'listening_choice' | 'grammar_choice' | 'build_sentence'
  [key: string]: unknown  // flexible shape — ExerciseRouter handles per-type validation
}

interface VocabItem {
  word: string
  romanization: string
  meaning: string
  toneClass?: string
  word_male?: string
  word_female?: string
}

interface LessonData {
  id: string
  title: string | Record<string, string>
  objectives: string[] | Record<string, string[]>
  exercises: Exercise[]
  chat_seed: string | Record<string, string>
  vocabulary: VocabItem[] | string[]
}

// Dynamic tutor name — read from language config or profile, no hardcoded map
function getTutorName(lang: string): string {
  if (typeof window === 'undefined') return 'Your Tutor'
  // Try language config first
  try {
    const configRaw = localStorage.getItem(`lingwa_lang_config_${lang}`)
    if (configRaw) {
      const config = JSON.parse(configRaw)
      if (config.tutor?.name) return config.tutor.name
    }
  } catch { /* ignore */ }
  return 'Your Tutor'
}

type Phase = 'teach' | 'quiz' | 'drill' | 'celebrate' | 'voice'

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string
  const unit = params.unit as string
  const lesson = params.lesson as string

  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [answers, setAnswers] = useState<(boolean | null)[]>([])
  const answersRef = useRef<(boolean | null)[]>([])
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('teach')
  const [quizXP, setQuizXP] = useState(0)
  const [celebrateXP, setCelebrateXP] = useState(0)
  const [chatModeOverride, setChatModeOverride] = useState<string | undefined>(undefined)
  const [chatModeKeyOverride, setChatModeKeyOverride] = useState<string | undefined>(undefined)
  const { t, nativeLang } = useI18n()

  useEffect(() => {
    // Check localStorage for generated curriculum first
    const localKey = `lingwa_curriculum_${lang}`
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null

    if (localRaw) {
      try {
        const curriculum = JSON.parse(localRaw)
        const unitData = curriculum.units?.find((u: { id?: number; unit?: number }) => (u.id ?? u.unit) === parseInt(unit))
        const lessonFound = unitData?.lessons?.find((l: { id: string }) => l.id === `${unit}.${lesson}`)
        if (lessonFound) {
          lessonFound.exercises = filterExercisesByGender(lessonFound.exercises, lang)
          setLessonData(lessonFound)
          setAnswers(new Array(lessonFound.exercises.length).fill(null))
          setLoading(false)
          return
        }
      } catch {
        // Fall through to API
      }
    }

    // Fallback: fetch from API (read level from profile, default to A1)
    const profileRaw = localStorage.getItem('lingwa_profile')
    const profileLevel = profileRaw ? (JSON.parse(profileRaw).level || 'A1') : 'A1'
    fetch(`/api/curriculum/${lang}/${profileLevel}`)
      .then(r => r.json())
      .then(curriculum => {
        const unitData = curriculum.units?.find((u: { id?: number; unit?: number }) => (u.id ?? u.unit) === parseInt(unit))
        const lessonData = unitData?.lessons?.find((l: { id: string }) => l.id === `${unit}.${lesson}`)
        if (lessonData) {
          lessonData.exercises = filterExercisesByGender(lessonData.exercises, lang)
        }
        setLessonData(lessonData || null)
        if (lessonData) {
          setAnswers(new Array(lessonData.exercises.length).fill(null))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [lang, unit, lesson])

  const handleAnswer = (correct: boolean) => {
    const newAnswers = [...answers]
    newAnswers[currentExercise] = correct
    setAnswers(newAnswers)
    answersRef.current = newAnswers
    setShowResult(true)
  }

  const handleNext = () => {
    setShowResult(false)
    if (!lessonData) return

    if (currentExercise < lessonData.exercises.length - 1) {
      setCurrentExercise(prev => prev + 1)
    } else {
      // Quiz complete — use ref for synchronous read (state may not have committed yet)
      const correctCount = answersRef.current.filter(a => a === true).length
      const perfect = correctCount === lessonData.exercises.length
      const xp = 10 + (perfect ? 5 : 0)
      setQuizXP(xp)
      completeLesson(lang, `${unit}.${lesson}`, perfect, xp)
      setPhase('drill')
    }
  }

  const handleDrillComplete = (drillXP: number) => {
    // Add bonus drill XP on top of already-saved quiz XP
    const prog = getLanguageProgress(lang)
    if (prog) {
      prog.xp += drillXP
      if (typeof window !== 'undefined') {
        localStorage.setItem(`lingwa:progress:${lang}`, JSON.stringify(prog))
      }
    }
    const totalXP = quizXP + drillXP

    // Check if this is the last lesson in the unit (lesson 4) — show celebration
    if (lesson === '4') {
      setCelebrateXP(totalXP)
      setPhase('celebrate')
      return
    }

    router.refresh()
    router.push(`/${lang}?xp=${totalXP}`)
  }

  const handleVoiceComplete = (voiceXP: number) => {
    // Voice complete from unit/final chat (triggered from celebrate screen)
    const prog = getLanguageProgress(lang)
    if (prog) {
      prog.xp += voiceXP
      if (typeof window !== 'undefined') {
        localStorage.setItem(`lingwa:progress:${lang}`, JSON.stringify(prog))
      }
    }
    const totalXP = quizXP + voiceXP
    router.refresh()
    router.push(`/${lang}?xp=${totalXP}`)
  }

  // Extract key phrases from vocabulary (first 3-5 items)
  // vocabulary may be string[] (legacy) or VocabItem[]
  const rawVocab = lessonData?.vocabulary ?? []
  const vocabItems: VocabItem[] = rawVocab.map(v =>
    typeof v === 'string' ? { word: v, romanization: '', meaning: '' } : v
  )
  const keyPhrases = rawVocab.slice(0, 5).map(v => typeof v === 'string' ? v : v.word)
  const tutorName = getTutorName(lang)

  if (loading) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">{t('loadingLesson')}</div>
      </div>
    )
  }

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-midnight flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">{t('lessonNotFound')}</p>
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
      </div>
    )
  }

  // ── Teach phase ──
  if (phase === 'teach') {
    return (
      <main className="min-h-screen bg-midnight overflow-y-auto">
        <header className="border-b border-slate-800 sticky top-0 z-10 bg-midnight/95 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => router.push(`/${lang}`)} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
            <span className="text-slate-300 font-semibold flex-1">{resolveText(lessonData.title, nativeLang)}</span>
          </div>
        </header>
        <LessonTeach
          lang={lang}
          lessonTitle={resolveText(lessonData.title, nativeLang)}
          vocabulary={vocabItems}
          onReady={() => setPhase('quiz')}
        />
      </main>
    )
  }

  // ── Drill phase ──
  if (phase === 'drill') {
    return (
      <main className="min-h-screen bg-midnight overflow-y-auto">
        <header className="border-b border-slate-800 sticky top-0 z-10 bg-midnight/95 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => { router.refresh(); router.push(`/${lang}?xp=${quizXP}`) }} className="text-slate-400 hover:text-white transition-colors">
              ✕
            </button>
            <span className="text-slate-300 font-semibold flex-1">{resolveText(lessonData.title, nativeLang)}</span>
          </div>
        </header>
        <DrillMode
          vocabulary={vocabItems}
          lang={lang}
          onComplete={handleDrillComplete}
        />
      </main>
    )
  }

  // ── Voice phase (unit/final chat from celebrate screen) ──
  if (phase === 'voice') {
    return (
      <main className="min-h-screen bg-midnight overflow-hidden">
        <header className="border-b border-slate-800 sticky top-0 z-10 bg-midnight/95 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
            <button onClick={() => setPhase('celebrate')} className="text-slate-400 hover:text-white transition-colors">
              ←
            </button>
            <span className="text-slate-300 font-semibold flex-1">{t('speakWith', { name: tutorName })}</span>
          </div>
        </header>
        <VoiceChat
          lang={lang}
          unit={parseInt(unit)}
          lesson={parseInt(lesson)}
          lessonTitle={resolveText(lessonData.title, nativeLang)}
          keyPhrases={keyPhrases}
          tutorName={tutorName}
          level={(() => {
            try {
              const p = localStorage.getItem('lingwa_profile')
              return p ? JSON.parse(p).level || 'A1' : 'A1'
            } catch { return 'A1' }
          })()}
          chatMode={chatModeOverride}
          chatModeKey={chatModeKeyOverride}
          onComplete={handleVoiceComplete}
        />
      </main>
    )
  }

  // ── Celebrate phase ──
  if (phase === 'celebrate') {
    // Count total units from curriculum
    let totalUnits = 5 // sensible default
    let unitTitle = resolveText(lessonData.title, nativeLang)
    let vocabCount = 0
    let langName = lang
    let totalVocabAll = 300
    try {
      const curRaw = localStorage.getItem(`lingwa_curriculum_${lang}`)
      if (curRaw) {
        const curriculum = JSON.parse(curRaw)
        totalUnits = curriculum.units?.length ?? 5
        const unitData = curriculum.units?.find((u: { id?: number; unit?: number }) => (u.id ?? u.unit) === parseInt(unit))
        if (unitData) {
          unitTitle = resolveText(unitData.title, nativeLang) || unitTitle
          // Count vocab across all lessons in this unit
          unitData.lessons?.forEach((l: { vocabulary?: unknown[] }) => {
            vocabCount += l.vocabulary?.length ?? 0
          })
        }
        // Count total vocab across all units
        let total = 0
        curriculum.units?.forEach((u: { lessons?: { vocabulary?: unknown[] }[] }) => {
          u.lessons?.forEach((l: { vocabulary?: unknown[] }) => {
            total += l.vocabulary?.length ?? 0
          })
        })
        if (total > 0) totalVocabAll = total
      }
      const configRaw = localStorage.getItem(`lingwa_lang_config_${lang}`)
      if (configRaw) {
        const config = JSON.parse(configRaw)
        langName = config.language || lang
      }
    } catch { /* use defaults */ }

    const isLastUnit = parseInt(unit) === totalUnits

    const handleContinue = () => {
      router.refresh()
      router.push(`/${lang}?xp=${celebrateXP}`)
    }

    const handleUnitChat = () => {
      setChatModeOverride(`You are reviewing Unit ${unit}. Have a natural conversation covering all topics from this unit. Encourage the student to use vocabulary and grammar from the entire unit.`)
      setChatModeKeyOverride(`unit_${unit}`)
      setPhase('voice')
    }

    const handleFinalChat = () => {
      setChatModeOverride(`FINAL CHALLENGE: This is the student's final review. Cover vocabulary and grammar from ALL units. No hints — let them demonstrate full mastery. Be encouraging but don't give away answers.`)
      setChatModeKeyOverride('final')
      setPhase('voice')
    }

    if (isLastUnit) {
      const profileRaw = typeof window !== 'undefined' ? localStorage.getItem('lingwa_profile') : null
      const level = profileRaw ? (JSON.parse(profileRaw).level || 'A1') : 'A1'
      const prog = getLanguageProgress(lang)
      const lifetimeXP = prog ? prog.xp : celebrateXP

      return (
        <main className="min-h-screen bg-midnight overflow-y-auto">
          <CourseComplete
            level={level}
            lang={lang}
            langName={langName}
            totalVocab={totalVocabAll}
            totalXP={lifetimeXP}
            tutorName={tutorName}
            onFinalChat={handleFinalChat}
            onContinue={handleContinue}
          />
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-midnight overflow-y-auto">
        <UnitComplete
          unitNumber={parseInt(unit)}
          unitTitle={unitTitle}
          vocabCount={vocabCount}
          totalXP={celebrateXP}
          lang={lang}
          tutorName={tutorName}
          isLastUnit={false}
          onContinue={handleContinue}
          onUnitChat={handleUnitChat}
        />
      </main>
    )
  }

  // ── Quiz phase ──
  const progress = ((currentExercise + (showResult ? 1 : 0)) / lessonData.exercises.length) * 100
  const exercise = lessonData.exercises[currentExercise]

  return (
    <main className="min-h-screen bg-midnight">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-lg font-bold text-slate-300 mb-8">{resolveText(lessonData.title, nativeLang)}</h1>

        <ExerciseRouter
          exercise={exercise}
          onAnswer={handleAnswer}
          onNext={handleNext}
          isLast={currentExercise === lessonData.exercises.length - 1}
          lang={lang}
          currentIndex={currentExercise}
          totalExercises={lessonData.exercises.length}
        />
      </div>
    </main>
  )
}
