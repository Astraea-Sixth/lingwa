/**
 * validate-i18n.ts
 * Validates that all 20 language config.json files have 100% UI key coverage.
 * Run via: npm run validate-i18n
 * Fails with a clear error listing missing keys per language.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const COURSES_DIR = path.join(__dirname, '..', 'public', 'courses')

// Derive canonical key list from en/config.json (source of truth)
function getCanonicalKeys(): Set<string> {
  const enConfigPath = path.join(COURSES_DIR, 'en', 'config.json')
  if (!fs.existsSync(enConfigPath)) {
    console.error('ERROR: en/config.json not found. Cannot derive canonical key list.')
    process.exit(1)
  }
  const enConfig = JSON.parse(fs.readFileSync(enConfigPath, 'utf-8'))
  if (!enConfig.ui || typeof enConfig.ui !== 'object') {
    console.error('ERROR: en/config.json has no "ui" block.')
    process.exit(1)
  }
  return new Set(Object.keys(enConfig.ui))
}

function getLanguageDirs(): string[] {
  return fs
    .readdirSync(COURSES_DIR)
    .filter(name => {
      const fullPath = path.join(COURSES_DIR, name)
      return (
        fs.statSync(fullPath).isDirectory() &&
        fs.existsSync(path.join(fullPath, 'config.json')) &&
        name !== 'en' // en is the canonical source, skip it
      )
    })
}

function main() {
  const canonicalKeys = getCanonicalKeys()
  const langs = getLanguageDirs()

  console.log(`Validating i18n coverage for ${langs.length} languages against ${canonicalKeys.size} canonical keys...`)
  console.log(`Languages: ${langs.join(', ')}`)
  console.log()

  let hasErrors = false
  const errors: string[] = []

  for (const lang of langs) {
    const configPath = path.join(COURSES_DIR, lang, 'config.json')
    let config: Record<string, unknown>
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } catch (e) {
      errors.push(`[${lang}] Failed to parse config.json: ${e}`)
      hasErrors = true
      continue
    }

    const ui = config.ui as Record<string, string> | undefined
    if (!ui || typeof ui !== 'object') {
      errors.push(`[${lang}] Missing "ui" block in config.json`)
      hasErrors = true
      continue
    }

    const langKeys = new Set(Object.keys(ui))
    const missing = Array.from(canonicalKeys).filter(k => !langKeys.has(k))

    if (missing.length > 0) {
      errors.push(`[${lang}] Missing ${missing.length} key(s): ${missing.join(', ')}`)
      hasErrors = true
    }
  }

  if (hasErrors) {
    console.error('i18n validation FAILED:')
    for (const err of errors) {
      console.error(`  ✗ ${err}`)
    }
    console.error()
    console.error(`Fix the above issues before building.`)
    process.exit(1)
  }

  console.log(`✓ All ${langs.length} language configs have complete UI key coverage (${canonicalKeys.size} keys each).`)
  process.exit(0)
}

main()
