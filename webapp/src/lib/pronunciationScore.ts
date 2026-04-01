/**
 * Lingwa — Local Pronunciation Scoring
 *
 * Client-side scoring for hosted mode using Levenshtein similarity.
 * No server needed — compares Web Speech API transcript against expected text.
 *
 * Thresholds are slightly lenient to compensate for Web Speech API accuracy.
 * Feedback strings use the i18n system (t() from lib/i18n.ts).
 */

import { t } from '@/lib/i18n'

export interface PronunciationResult {
  stars: 0 | 1 | 2 | 3
  feedback: string
  similarity: number
}

/**
 * Normalise a string for comparison: lowercase, trim, strip punctuation.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"(){}[\]~`@#$%^&*\-_+=<>/\\|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

/**
 * Compute similarity score (0–1) between two strings.
 */
function similarity(a: string, b: string): number {
  const normA = normalise(a)
  const normB = normalise(b)
  if (normA === normB) return 1
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(normA, normB) / maxLen
}

/**
 * Score a pronunciation attempt locally.
 *
 * @param transcript - What the Web Speech API heard
 * @param expected - The target word/phrase
 * @param nativeLang - User's native language code (for i18n feedback)
 * @returns Stars (0–3), feedback string, and raw similarity score
 */
export function scorePronunciation(
  transcript: string,
  expected: string,
  nativeLang: string,
): PronunciationResult {
  const sim = similarity(transcript, expected)

  if (sim >= 0.80) {
    return { stars: 3, feedback: t('pronunciationPerfect', nativeLang), similarity: sim }
  }
  if (sim >= 0.60) {
    return { stars: 2, feedback: t('pronunciationGood', nativeLang), similarity: sim }
  }
  if (sim >= 0.35) {
    return { stars: 1, feedback: t('pronunciationClose', nativeLang), similarity: sim }
  }
  return { stars: 0, feedback: t('pronunciationTryAgain', nativeLang), similarity: sim }
}
