/**
 * Lingwa — Gender & Native Language Resolution
 *
 * Two utilities that every component calls to pick the right content
 * from Schema v1.0 data structures.
 *
 * Usage:
 *   resolveMeaning(item.meanings, nativeLang)  → "Hello"
 *   resolveGender(item.gendered, gender)        → { word: "สวัสดีครับ", romanization: "sawadee khrap" }
 */

// ─── Types ───

export type Gender = 'male' | 'female' | 'both'
export type MeaningsMap = Record<string, string> | string
export type GenderedMap<T> = { male?: T; female?: T; neutral?: T }

// ─── Profile helpers ───

export interface LingwaProfile {
  targetLang: string
  targetLangCode: string
  nativeLang: string
  nativeLangCode?: string
  level: string
  gender: string
}

/**
 * Read the user profile from localStorage.
 */
export function getProfile(): LingwaProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('lingwa_profile')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/**
 * Get the user's gender for a specific language.
 * Reads from lingwa_gender_{lang} or falls back to profile.gender.
 */
export function getGender(lang: string): Gender {
  if (typeof window === 'undefined') return 'both'
  const stored = localStorage.getItem(`lingwa_gender_${lang}`)
  if (stored === 'male' || stored === 'female' || stored === 'both') return stored
  const profile = getProfile()
  if (profile?.gender === 'male' || profile?.gender === 'female') return profile.gender as Gender
  return 'both'
}

/**
 * Get the user's native language code.
 * Defaults to 'en' if not set.
 */
export function getNativeLang(): string {
  const profile = getProfile()
  return profile?.nativeLangCode || 'en'
}

// ─── Resolution functions ───

/**
 * Resolve a meaning from a meanings map or flat string.
 *
 * Fallback chain:
 *   1. meanings[nativeLang]  (e.g. meanings.zh)
 *   2. meanings.en
 *   3. First available value
 *   4. Empty string
 *
 * Backward compat: if meanings is a plain string, return it directly.
 */
export function resolveMeaning(meanings: MeaningsMap | undefined, nativeLang?: string): string {
  if (!meanings) return ''
  if (typeof meanings === 'string') return meanings

  const lang = nativeLang || getNativeLang()
  if (meanings[lang]) return meanings[lang]
  if (meanings.en) return meanings.en

  const values = Object.values(meanings)
  return values.length > 0 ? values[0] : ''
}

/**
 * Resolve a meanings map to an array of strings (for options).
 * Each element is resolved through the same fallback chain.
 *
 * Handles:
 *   - string[] (old schema) → return as-is
 *   - { en: string[], zh: string[] } → pick the right language array
 *   - { neutral: string[], male: string[], female: string[] } → pick by gender first, then language
 */
export function resolveOptions(
  options: string[] | Record<string, string[]> | undefined,
  nativeLang?: string,
): string[] {
  if (!options) return []
  if (Array.isArray(options)) return options

  const lang = nativeLang || getNativeLang()
  if (options[lang]) return options[lang]
  if (options.en) return options.en

  const values = Object.values(options)
  return values.length > 0 ? values[0] : []
}

/**
 * Resolve gendered options (for native_to_target exercises).
 * Picks from options.male / options.female / options.neutral based on profile gender.
 *
 * Handles:
 *   - string[] (old schema) → return as-is
 *   - { neutral: string[], male: string[], female: string[] } → pick by gender
 */
export function resolveGenderedOptions(
  options: string[] | Record<string, string[]> | undefined,
  gender?: Gender,
): string[] {
  if (!options) return []
  if (Array.isArray(options)) return options

  const g = gender || getGender('')
  if (g === 'male' && options.male) return options.male
  if (g === 'female' && options.female) return options.female
  if (options.neutral) return options.neutral

  // Fall back to first available
  const values = Object.values(options)
  return values.length > 0 ? values[0] : []
}

/**
 * Resolve a gendered form from a gendered map.
 *
 * Rules:
 *   gender = "male"   → return data.male   (fallback to data.neutral)
 *   gender = "female" → return data.female  (fallback to data.neutral)
 *   gender = "both"   → return { male: data.male, female: data.female } (for side-by-side display)
 *
 * Backward compat: if data is not a gendered map, return null.
 */
export function resolveGender<T>(
  data: GenderedMap<T> | undefined,
  gender?: Gender,
): T | null {
  if (!data) return null

  const g = gender || getGender('')

  if (g === 'male') return data.male ?? data.neutral ?? null
  if (g === 'female') return data.female ?? data.neutral ?? null
  // "both" — caller decides how to display; return male form as primary
  return data.male ?? data.neutral ?? null
}

/**
 * For "both" gender display — returns both forms for side-by-side rendering.
 */
export function resolveGenderBoth<T>(
  data: GenderedMap<T> | undefined,
): { male: T | null; female: T | null } {
  if (!data) return { male: null, female: null }
  return {
    male: data.male ?? data.neutral ?? null,
    female: data.female ?? data.neutral ?? null,
  }
}

/**
 * Resolve a meanings map for an array of objectives.
 * Handles: string[] (old) or { en: string[], zh: string[] } (new)
 */
export function resolveObjectives(
  objectives: string[] | Record<string, string[]> | undefined,
  nativeLang?: string,
): string[] {
  if (!objectives) return []
  if (Array.isArray(objectives)) return objectives

  const lang = nativeLang || getNativeLang()
  if (objectives[lang]) return objectives[lang]
  if (objectives.en) return objectives.en

  const values = Object.values(objectives)
  return values.length > 0 ? values[0] : []
}

/**
 * Resolve a single translatable string field.
 * Handles: string (old) or { en: "...", zh: "..." } (new)
 */
export function resolveText(
  text: string | Record<string, string> | undefined,
  nativeLang?: string,
): string {
  if (!text) return ''
  if (typeof text === 'string') return text
  return resolveMeaning(text, nativeLang)
}
