/**
 * Lingwa Progress — localStorage-based progress management
 * Tracks: streak, XP, completed lessons, vocabulary with spaced repetition data
 */

import { isHostedMode } from './supabase'
import { getUser } from './auth'
import { syncToCloud } from './cloudProgress'
import { type WordRecord, type SRSData, createWordRecord, getDueWords as srsGetDueWords } from './srs'

/** Fire-and-forget cloud sync when in hosted mode */
function syncIfHosted(lang: string) {
  if (!isHostedMode()) return
  getUser().then(user => {
    if (user) syncToCloud(user.id).catch(() => {})
  })
}

export interface LessonRecord {
  completed: boolean
  perfect: boolean
  completedAt: string
  xp: number
}

export interface VocabWord {
  word: string
  language: string
  english: string
  seen: number
  correct: number
  wrong: number
  intervalDays: number
  nextReview: string
  lastSeen: string
  easeFactor: number  // SM-2 ease factor (starts at 2.5)
}

export interface LangProgress {
  language: string
  level: string
  xp: number
  streak: number
  streakLastDate: string | null
  lessonsCompleted: Record<string, LessonRecord>
  unitsCompleted: number[]
  currentUnit: number
  currentLesson: number
  createdAt: string
  updatedAt: string
}

export interface GlobalProgress {
  activeLang: string | null
  xp: number
  streak: number
  languages: string[]
}

const GLOBAL_KEY = 'lingwa:global'
const LANG_KEY = (lang: string) => `lingwa:progress:${lang}`
const VOCAB_KEY = (lang: string) => `lingwa:vocab:${lang}`

// ─────────────────────────────────────────────
// Global progress
// ─────────────────────────────────────────────

export function getProgress(): GlobalProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GLOBAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setGlobalProgress(prog: GlobalProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(prog))
}

// ─────────────────────────────────────────────
// Language-specific progress
// ─────────────────────────────────────────────

export function getLanguageProgress(lang: string): LangProgress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LANG_KEY(lang))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setLanguageProgress(prog: LangProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LANG_KEY(prog.language), JSON.stringify(prog))
}

export function initProgress(lang: string, level: string = 'A1') {
  if (typeof window === 'undefined') return
  const existing = getLanguageProgress(lang)
  if (existing) return existing

  const now = new Date().toISOString()
  const langProg: LangProgress = {
    language: lang,
    level,
    xp: 0,
    streak: 0,
    streakLastDate: null,
    lessonsCompleted: {},
    unitsCompleted: [],
    currentUnit: 1,
    currentLesson: 1,
    createdAt: now,
    updatedAt: now,
  }
  setLanguageProgress(langProg)

  // Update global
  const global = getProgress() || { activeLang: null, xp: 0, streak: 0, languages: [] }
  global.activeLang = lang
  if (!global.languages.includes(lang)) global.languages.push(lang)
  setGlobalProgress(global)

  syncIfHosted(lang)
  return langProg
}

// ─────────────────────────────────────────────
// Streak logic
// ─────────────────────────────────────────────

function updateStreak(prog: LangProgress): LangProgress {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (prog.streakLastDate === today) {
    // Already did something today, streak unchanged
    return prog
  } else if (prog.streakLastDate === yesterday) {
    // Continuing streak
    return { ...prog, streak: prog.streak + 1, streakLastDate: today }
  } else {
    // Streak broken (or first day)
    return { ...prog, streak: 1, streakLastDate: today }
  }
}

// ─────────────────────────────────────────────
// Complete a lesson
// ─────────────────────────────────────────────

export function completeLesson(
  lang: string,
  lessonId: string,
  perfect: boolean,
  xpEarned: number,
) {
  if (typeof window === 'undefined') return
  let prog = getLanguageProgress(lang)
  if (!prog) prog = initProgress(lang) as LangProgress

  const now = new Date().toISOString()
  prog.lessonsCompleted[lessonId] = {
    completed: true,
    perfect,
    completedAt: now,
    xp: xpEarned,
  }
  prog.xp += xpEarned
  prog.updatedAt = now

  // Update current position
  const [unit, lesson] = lessonId.split('.').map(Number)
  if (unit >= prog.currentUnit && lesson >= prog.currentLesson) {
    prog.currentUnit = unit
    prog.currentLesson = lesson + 1
  }

  prog = updateStreak(prog)
  setLanguageProgress(prog)

  // Sync global xp/streak
  const global = getProgress()
  if (global) {
    global.xp = (global.xp || 0) + xpEarned
    global.streak = prog.streak
    setGlobalProgress(global)
  }

  syncIfHosted(lang)
}

// ─────────────────────────────────────────────
// Vocabulary / Spaced Repetition (SM-2)
// ─────────────────────────────────────────────

export function getVocabulary(lang: string): Record<string, VocabWord> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VOCAB_KEY(lang))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveVocabulary(lang: string, vocab: Record<string, VocabWord>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(VOCAB_KEY(lang), JSON.stringify(vocab))
}

/**
 * SM-2 algorithm: update interval and ease factor after review
 * quality: 0-2 = wrong, 3-5 = correct (standard SM-2 scale)
 */
function sm2Update(word: VocabWord, quality: number): VocabWord {
  const now = new Date()

  if (quality < 3) {
    // Wrong: reset interval
    return {
      ...word,
      wrong: word.wrong + 1,
      seen: word.seen + 1,
      intervalDays: 1,
      lastSeen: now.toISOString().slice(0, 10),
      nextReview: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    }
  } else {
    // Correct: increase interval
    const newInterval = word.intervalDays === 1
      ? 6
      : Math.round(word.intervalDays * word.easeFactor)
    const newEF = Math.max(1.3, word.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    return {
      ...word,
      correct: word.correct + 1,
      seen: word.seen + 1,
      intervalDays: newInterval,
      easeFactor: newEF,
      lastSeen: now.toISOString().slice(0, 10),
      nextReview: new Date(Date.now() + newInterval * 86400000).toISOString().slice(0, 10),
    }
  }
}

export function reviewWord(lang: string, word: string, correct: boolean) {
  const vocab = getVocabulary(lang)
  if (!vocab[word]) return
  vocab[word] = sm2Update(vocab[word], correct ? 4 : 1)
  saveVocabulary(lang, vocab)
}

export function addWord(lang: string, word: string, english: string) {
  const vocab = getVocabulary(lang)
  if (vocab[word]) {
    vocab[word].seen += 1
  } else {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    vocab[word] = {
      word,
      language: lang,
      english,
      seen: 1,
      correct: 0,
      wrong: 0,
      intervalDays: 1,
      nextReview: tomorrow,
      lastSeen: today,
      easeFactor: 2.5,
    }
  }
  saveVocabulary(lang, vocab)
}

export function getDueWords(lang: string): VocabWord[] {
  const vocab = getVocabulary(lang)
  const today = new Date().toISOString().slice(0, 10)
  return Object.values(vocab).filter(w => w.nextReview <= today)
}

export function getTotalWordCount(lang: string): number {
  return Object.keys(getVocabulary(lang)).length
}

// ─────────────────────────────────────────────
// SRS Data (Spaced Repetition — Review System)
// ─────────────────────────────────────────────

const SRS_KEY = (lang: string) => `lingwa:srs:${lang}`

export function loadSRSData(langCode: string): SRSData {
  if (typeof window === 'undefined') return { words: {} }
  try {
    const raw = localStorage.getItem(SRS_KEY(langCode))
    return raw ? JSON.parse(raw) : { words: {} }
  } catch {
    return { words: {} }
  }
}

export function saveSRSData(langCode: string, data: SRSData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SRS_KEY(langCode), JSON.stringify(data))
}

export function getDueWordCount(langCode: string): number {
  const data = loadSRSData(langCode)
  return srsGetDueWords(data.words).length
}

/**
 * Initialize SRS records for vocabulary from a completed lesson.
 * Only adds words that don't already exist in SRS data.
 */
export function initializeLessonVocab(
  langCode: string,
  lessonId: string,
  words: Array<{ word: string; english: string; romanization?: string; toneClass?: string }>,
) {
  const data = loadSRSData(langCode)
  for (const w of words) {
    if (!data.words[w.word]) {
      data.words[w.word] = createWordRecord(w.word, langCode, w.english, w.romanization, w.toneClass)
    }
  }
  saveSRSData(langCode, data)
}

// ─────────────────────────────────────────────
// Gender preference
// ─────────────────────────────────────────────

export function getGender(lang: string): 'male' | 'female' | 'both' | null {
  if (typeof window === 'undefined') return null
  return (localStorage.getItem(`lingwa_gender_${lang}`) as 'male' | 'female' | 'both') || null
}

export function setGender(lang: string, gender: 'male' | 'female' | 'both') {
  localStorage.setItem(`lingwa_gender_${lang}`, gender)
}

// ─────────────────────────────────────────────
// Unit completion & chat unlocking
// ─────────────────────────────────────────────

// Check if all lessons in a unit are completed
export function isUnitComplete(lang: string, unitId: number, totalLessons: number): boolean {
  const progress = getLanguageProgress(lang)
  if (!progress) return false
  for (let i = 1; i <= totalLessons; i++) {
    const key = `${unitId}.${i}`
    if (!progress.lessonsCompleted?.[key]?.completed) return false
  }
  return true
}

// Get highest unlocked unit chat (returns 0 if none unlocked)
export function getUnlockedChatUnit(lang: string, totalUnits: number, lessonsPerUnit: number): number {
  let highest = 0
  for (let u = 1; u <= totalUnits; u++) {
    if (isUnitComplete(lang, u, lessonsPerUnit)) highest = u
  }
  return highest
}

// Check if final challenge is unlocked (all units complete)
export function isFinalChallengeUnlocked(lang: string, totalUnits: number, lessonsPerUnit: number): boolean {
  return getUnlockedChatUnit(lang, totalUnits, lessonsPerUnit) >= totalUnits
}

// ─────────────────────────────────────────────
// Reset (for testing)
// ─────────────────────────────────────────────

export function resetLanguageProgress(lang: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LANG_KEY(lang))
  localStorage.removeItem(VOCAB_KEY(lang))
}

export function resetAllProgress() {
  if (typeof window === 'undefined') return
  const keys = Object.keys(localStorage).filter(k => k.startsWith('lingwa:'))
  keys.forEach(k => localStorage.removeItem(k))
}
