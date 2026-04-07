/**
 * Lingwa — Internationalization (i18n)
 *
 * Translation system that loads UI strings from each language's config.json.
 * All translations come from config.json files — no hardcoded strings.
 *
 * Usage:
 *   import { t, registerFromConfig } from '@/lib/i18n'
 *   t('sayThis', 'en')  // looks up from dynamicTranslations
 */

// Dynamic translations loaded from config.json ui fields at runtime
const dynamicTranslations: Record<string, Record<string, string>> = {}

/**
 * Register UI translations from a language config's "ui" field.
 * Call this after loading a config.json that has a "ui" object.
 */
export function registerTranslations(lang: string, ui: Record<string, string>) {
  dynamicTranslations[lang] = ui
}

/**
 * Load and register UI translations from a config object.
 * Safe to call with any config — ignores if no "ui" field.
 */
export function registerFromConfig(config: { code: string; ui?: Record<string, string> } | null) {
  if (config?.ui) {
    dynamicTranslations[config.code] = config.ui
  }
}

/**
 * Translate a key to the user's native language.
 *
 * Supports interpolation: t('hello', 'en', { name: 'Nong' })
 * Template: "Hello {name}!" → "Hello Nong!"
 */
export function t(
  key: string,
  nativeLang: string = 'en',
  vars?: Record<string, string | number>,
): string {
  const dict = dynamicTranslations[nativeLang]
  const enDict = dynamicTranslations.en
  let text = dict?.[key] || enDict?.[key] || key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return text
}

/**
 * Get all available UI languages (for native language picker).
 * Returns dynamically registered languages.
 */
export function getAvailableUILanguages(): Array<{ code: string; label: string }> {
  return Object.keys(dynamicTranslations).map(code => ({
    code,
    label: code,
  }))
}
