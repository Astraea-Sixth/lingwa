/**
 * Lingwa — Spaced Repetition System (SM-2 Algorithm)
 *
 * TypeScript port of api/services/spaced_rep.py.
 * Pure functions — no localStorage access. Storage handled by progress.ts.
 */

// ─── Types ───

export interface WordRecord {
  word: string
  language: string
  english: string
  seen: number
  correct: number
  wrong: number
  intervalDays: number
  easeFactor: number   // starts at 2.5, min 1.3
  nextReview: string   // ISO date string (YYYY-MM-DD)
  lastSeen: string     // ISO date string
  romanization?: string
  toneClass?: string
}

export interface SRSData {
  words: Record<string, WordRecord>
}

// ─── SM-2 Algorithm ───

/**
 * Update a word record using the SM-2 spaced repetition algorithm.
 *
 * quality: 0-5
 *   0-2: Failed (reset interval to 1 day)
 *   3:   Correct, hard to recall
 *   4:   Correct, moderate effort
 *   5:   Perfect recall
 */
export function sm2Update(record: WordRecord, quality: number): WordRecord {
  const today = new Date().toISOString().slice(0, 10)
  const updated = { ...record, seen: record.seen + 1, lastSeen: today }

  if (quality < 3) {
    // Wrong: reset interval
    updated.wrong = record.wrong + 1
    updated.intervalDays = 1
    updated.nextReview = addDays(today, 1)
  } else {
    // Correct: advance interval
    updated.correct = record.correct + 1

    const newInterval = record.intervalDays === 1
      ? 6
      : Math.round(record.intervalDays * record.easeFactor)

    // Update ease factor (stays above 1.3)
    const newEF = record.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    updated.easeFactor = Math.max(1.3, newEF)
    updated.intervalDays = newInterval
    updated.nextReview = addDays(today, newInterval)
  }

  return updated
}

// ─── Query helpers ───

/**
 * Return words that are due for review today or earlier.
 */
export function getDueWords(words: Record<string, WordRecord>): WordRecord[] {
  const today = new Date().toISOString().slice(0, 10)
  return Object.values(words).filter(w => w.nextReview <= today)
}

/**
 * Return words that haven't been seen much yet (new words to learn).
 */
export function getNewWords(words: Record<string, WordRecord>, seenLimit: number = 3): WordRecord[] {
  return Object.values(words).filter(w => w.seen < seenLimit)
}

/**
 * Calculate overall retention rate (correct / total seen).
 */
export function calculateRetention(words: Record<string, WordRecord>): number {
  const all = Object.values(words)
  const totalSeen = all.reduce((sum, w) => sum + w.seen, 0)
  const totalCorrect = all.reduce((sum, w) => sum + w.correct, 0)
  if (totalSeen === 0) return 0
  return totalCorrect / totalSeen
}

// ─── Factory ───

/**
 * Create a new WordRecord for a word encountered for the first time.
 */
export function createWordRecord(
  word: string,
  language: string,
  english: string,
  romanization?: string,
  toneClass?: string,
): WordRecord {
  const today = new Date().toISOString().slice(0, 10)
  return {
    word,
    language,
    english,
    seen: 0,
    correct: 0,
    wrong: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReview: addDays(today, 1),
    lastSeen: today,
    romanization,
    toneClass,
  }
}

// ─── Utility ───

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
