/**
 * Lingwa TTS — Web Speech API wrapper
 * Provides text-to-speech in target language with fallback handling.
 * Primary: Web Speech API (browser-native, zero setup)
 * Future: Kokoro ONNX via backend API
 */

// Fallback language code → BCP-47 voice tag
// Primary source is config.json ttsVoice field (read from localStorage)
const LANG_VOICES_FALLBACK: Record<string, string> = {
  th: 'th-TH',
  es: 'es-ES',
  fr: 'fr-FR',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  de: 'de-DE',
  pt: 'pt-BR',
  it: 'it-IT',
  ar: 'ar-SA',
  ru: 'ru-RU',
  hi: 'hi-IN',
  nl: 'nl-NL',
  sv: 'sv-SE',
  pl: 'pl-PL',
  tr: 'tr-TR',
  vi: 'vi-VN',
  id: 'id-ID',
  ms: 'ms-MY',
  en: 'en-US',
}

/**
 * Get the BCP-47 voice code for a language.
 * Priority: language config ttsVoice (localStorage) → fallback map → generated guess
 */
function getTtsVoice(lang: string): string {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`lingwa_lang_config_${lang}`)
      if (raw) {
        const config = JSON.parse(raw)
        if (config.ttsVoice) return config.ttsVoice
      }
    } catch { /* ignore */ }
  }
  return LANG_VOICES_FALLBACK[lang] || `${lang}-${lang.toUpperCase()}`
}

let voices: SpeechSynthesisVoice[] = []
let voicesLoaded = false

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([])
      return
    }

    const loaded = window.speechSynthesis.getVoices()
    if (loaded.length > 0) {
      voices = loaded
      voicesLoaded = true
      resolve(loaded)
      return
    }

    // Chrome loads voices async
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices()
      voicesLoaded = true
      resolve(voices)
    }

    // Timeout fallback
    setTimeout(() => {
      if (!voicesLoaded) resolve([])
    }, 2000)
  })
}

function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  const bcp47 = getTtsVoice(langCode)
  const langPrefix = bcp47.split('-')[0]

  // Try exact match first (e.g. zh-CN, th-TH)
  const exact = voices.find(v => v.lang === bcp47)
  if (exact) return exact

  // Try prefix match (e.g. any zh-* voice)
  const prefix = voices.find(v => v.lang.startsWith(langPrefix))
  if (prefix) return prefix

  return null
}

/**
 * Speak text in the given language using Web Speech API.
 * Silently fails if TTS is unavailable.
 */
export async function speakText(
  text: string,
  lang: string = 'th',
  rate: number = 0.9,
  pitch: number = 1.0,
): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Cancel any current speech
  window.speechSynthesis.cancel()

  if (!voicesLoaded) {
    await loadVoices()
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = getTtsVoice(lang)
  utterance.rate = rate
  utterance.pitch = pitch

  const voice = findBestVoice(lang)
  if (voice) {
    utterance.voice = voice
  }

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = (e) => {
      // Don't throw on TTS errors — just silently fail
      console.debug('[Lingwa TTS] Speech error:', e.error)
      resolve()
    }
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Speak text at a slower rate (for learners).
 */
export function speakSlow(text: string, lang: string = 'th'): Promise<void> {
  return speakText(text, lang, 0.6)
}

/**
 * Stop any currently playing TTS.
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Check if TTS is available for a given language.
 */
export async function isTTSAvailable(lang: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  if (!voicesLoaded) await loadVoices()
  return findBestVoice(lang) !== null
}

/**
 * Get all available voices for display/selection.
 */
export async function getAvailableVoices(lang?: string): Promise<SpeechSynthesisVoice[]> {
  if (!voicesLoaded) await loadVoices()
  if (lang) {
    const bcp47 = getTtsVoice(lang)
    const prefix = bcp47.split('-')[0]
    return voices.filter(v => v.lang.startsWith(prefix))
  }
  return voices
}
