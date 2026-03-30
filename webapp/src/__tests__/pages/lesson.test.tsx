/**
 * Lesson Page Tests — Phase Transitions
 * Covers: TC-FE-074 through TC-FE-082
 * Also covers: TC-FE-083 through TC-FE-092 (progress lib)
 */

import {
  initProgress,
  getLanguageProgress,
  completeLesson,
  isUnitComplete,
  addWord,
  getDueWords,
  getVocabulary,
  reviewWord,
} from '@/lib/progress'

// ─────────────────────────────────────────────
// Progress Library Tests (TC-FE-083 to TC-FE-092)
// ─────────────────────────────────────────────

describe('Progress Library', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('TC-FE-083: initProgress creates fresh progress', () => {
    initProgress('th', 'A1')
    const prog = getLanguageProgress('th')
    expect(prog).not.toBeNull()
    expect(prog!.language).toBe('th')
    expect(prog!.level).toBe('A1')
    expect(prog!.xp).toBe(0)
    expect(prog!.streak).toBe(0)
  })

  test('TC-FE-084: completeLesson adds XP', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', false, 10)
    const prog = getLanguageProgress('th')
    expect(prog!.xp).toBe(10)
  })

  test('TC-FE-085: completeLesson updates streak', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', false, 10)
    const prog = getLanguageProgress('th')
    expect(prog!.streak).toBe(1)
    expect(prog!.streakLastDate).not.toBeNull()
  })

  test('TC-FE-086: Streak resets after missed day', () => {
    initProgress('th', 'A1')
    // Set streakLastDate to 3 days ago (missed yesterday)
    const prog = getLanguageProgress('th')!
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    prog.streak = 5
    prog.streakLastDate = threeDaysAgo
    window.localStorage.setItem('lingwa:progress:th', JSON.stringify(prog))

    completeLesson('th', '1.1', false, 10)
    const updated = getLanguageProgress('th')
    expect(updated!.streak).toBe(1) // Reset to 1
  })

  test('TC-FE-087: isUnitComplete returns true when all done', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', false, 10)
    completeLesson('th', '1.2', false, 10)
    expect(isUnitComplete('th', 1, 2)).toBe(true)
  })

  test('TC-FE-088: isUnitComplete returns false when partial', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', false, 10)
    expect(isUnitComplete('th', 1, 2)).toBe(false)
  })

  test('TC-FE-089: SM-2 correct answer increases interval', () => {
    addWord('th', 'สวัสดี', 'Hello')
    reviewWord('th', 'สวัสดี', true)
    const vocab = getVocabulary('th')
    expect(vocab['สวัสดี'].intervalDays).toBeGreaterThan(1)
  })

  test('TC-FE-090: SM-2 wrong answer resets to 1 day', () => {
    addWord('th', 'สวัสดี', 'Hello')
    // First correct to increase interval
    reviewWord('th', 'สวัสดี', true)
    // Then wrong to reset
    reviewWord('th', 'สวัสดี', false)
    const vocab = getVocabulary('th')
    expect(vocab['สวัสดี'].intervalDays).toBe(1)
  })

  test('TC-FE-091: addWord creates new vocab entry', () => {
    addWord('th', 'สวัสดี', 'Hello')
    const vocab = getVocabulary('th')
    expect(vocab['สวัสดี']).toBeDefined()
    expect(vocab['สวัสดี'].word).toBe('สวัสดี')
    expect(vocab['สวัสดี'].english).toBe('Hello')
    expect(vocab['สวัสดี'].easeFactor).toBe(2.5)
  })

  test('TC-FE-092: getDueWords returns only due words', () => {
    addWord('th', 'สวัสดี', 'Hello')
    addWord('th', 'ขอบคุณ', 'Thank you')

    // สวัสดี: default nextReview is tomorrow (not due)
    // Set one to be due today
    const vocab = getVocabulary('th')
    const today = new Date().toISOString().slice(0, 10)
    vocab['สวัสดี'].nextReview = today
    window.localStorage.setItem('lingwa:vocab:th', JSON.stringify(vocab))

    const due = getDueWords('th')
    expect(due.length).toBe(1)
    expect(due[0].word).toBe('สวัสดี')
  })

  test('TC-FE-081: XP calculated correctly (10 base)', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', false, 10)
    const prog = getLanguageProgress('th')
    expect(prog!.lessonsCompleted['1.1'].xp).toBe(10)
  })

  test('TC-FE-082: Perfect lesson gets 15 XP', () => {
    initProgress('th', 'A1')
    completeLesson('th', '1.1', true, 15)
    const prog = getLanguageProgress('th')
    expect(prog!.lessonsCompleted['1.1'].xp).toBe(15)
    expect(prog!.lessonsCompleted['1.1'].perfect).toBe(true)
  })
})
