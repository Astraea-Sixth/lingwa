/**
 * Lingwa — Web Speech API Recognition
 *
 * Browser-native speech-to-text for hosted mode.
 * Uses the same BCP-47 locale codes from language config (ttsVoice field).
 *
 * Local mode uses the Python API instead — this module is only for hosted.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get the BCP-47 locale for speech recognition.
 * Reads from language config in localStorage (same source as TTS).
 */
function getSttLocale(lang: string): string {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`lingwa_lang_config_${lang}`)
      if (raw) {
        const config = JSON.parse(raw)
        if (config.sttLocale) return config.sttLocale
        if (config.ttsVoice) return config.ttsVoice
      }
    } catch { /* ignore */ }
  }
  // Last resort: guess from lang code
  return `${lang}-${lang.toUpperCase()}`
}

/**
 * Get the SpeechRecognition constructor (vendor-prefixed or standard).
 */
function getSpeechRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

/**
 * Check if the Web Speech API is available in this browser.
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

/**
 * Recognize speech from the microphone using the Web Speech API.
 *
 * @param lang - Lingwa language code (e.g. "th", "ja", "es")
 * @param timeoutMs - Max listening time in milliseconds
 * @returns The recognized transcript string
 */
export function recognizeSpeech(lang: string, timeoutMs: number = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      reject(new Error('Speech recognition not supported'))
      return
    }

    const recognition = new Ctor()
    recognition.lang = getSttLocale(lang)
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    let settled = false

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        recognition.abort()
        reject(new Error('Speech recognition timed out'))
      }
    }, timeoutMs)

    recognition.onresult = (event: any) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      resolve(transcript)
    }

    recognition.onerror = (event: any) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(new Error(`Speech recognition error: ${event.error}`))
    }

    recognition.onend = () => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        reject(new Error('Speech recognition ended without result'))
      }
    }

    recognition.start()
  })
}
