/**
 * Static course loader for hosted mode.
 * Loads course JSON from /courses/ static files instead of Python API.
 */

/**
 * Load the list of available language codes from the manifest.
 * No hardcoded language arrays needed — adding a language only requires
 * updating manifest.json and adding the course files.
 */
export async function loadLanguageCodes(): Promise<string[]> {
  try {
    const res = await fetch('/courses/manifest.json')
    if (!res.ok) return []
    const data = await res.json()
    return data.languages || []
  } catch {
    return []
  }
}

export async function loadStaticConfig(lang: string) {
  const res = await fetch(`/courses/${lang}/config.json`)
  if (!res.ok) return null
  return res.json()
}

export async function loadStaticCurriculum(lang: string, level: string) {
  // Try direct level file first (e.g. a1.json)
  const lvl = level.toLowerCase()
  const res = await fetch(`/courses/${lang}/courses/${lvl}.json`)
  if (res.ok) return res.json()

  // Try general.json inside level directory (e.g. a2/general.json)
  const res2 = await fetch(`/courses/${lang}/courses/${lvl}/general.json`)
  if (res2.ok) return res2.json()

  return null
}
