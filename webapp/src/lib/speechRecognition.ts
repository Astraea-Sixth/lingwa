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
 * Speech recognition error types — lets callers show distinct messages.
 */
export type SpeechErrorKind = 'unsupported' | 'permission-denied' | 'no-speech' | 'network' | 'timeout' | 'unknown'

export class SpeechRecognitionError extends Error {
  kind: SpeechErrorKind
  constructor(kind: SpeechErrorKind, message: string) {
    super(message)
    this.kind = kind
    this.name = 'SpeechRecognitionError'
  }
}

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
 * Map Web Speech API error codes to our error kinds.
 */
function classifyError(errorCode: string): SpeechErrorKind {
  switch (errorCode) {
    case 'not-allowed':
      return 'permission-denied'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'service-not-allowed':
      return 'unsupported'
    default:
      return 'unknown'
  }
}

/**
 * Recognize speech from the microphone using the Web Speech API.
 *
 * @param lang - Lingwa language code (e.g. "th", "ja", "es")
 * @param timeoutMs - Max listening time in milliseconds
 * @returns The recognized transcript string
 * @throws SpeechRecognitionError with a typed `kind` for the caller to handle
 */
export function recognizeSpeech(lang: string, timeoutMs: number = 8000): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      reject(new SpeechRecognitionError('unsupported', 'Speech recognition not supported'))
      return
    }

    const recognition = new Ctor()
    recognition.lang = getSttLocale(lang)
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    let settled = false
    let latestTranscript = ''

    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      callback()
    }

    const timeout = setTimeout(() => {
      if (settled) return
      if (latestTranscript) {
        settle(() => resolve(latestTranscript))
      } else {
        settle(() => {
          recognition.abort()
          reject(new SpeechRecognitionError('timeout', 'Speech recognition timed out'))
        })
      }
    }, timeoutMs)

    recognition.onresult = (event: any) => {
      if (settled) return

      for (let i = event.resultIndex ?? 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result?.[0]?.transcript?.trim()
        if (transcript) latestTranscript = transcript
        if (result?.isFinal && latestTranscript) {
          settle(() => resolve(latestTranscript))
          return
        }
      }
    }

    recognition.onerror = (event: any) => {
      const kind = classifyError(event.error)
      if (kind === 'no-speech' && latestTranscript) {
        settle(() => resolve(latestTranscript))
        return
      }
      settle(() => reject(new SpeechRecognitionError(kind, `Speech recognition error: ${event.error}`)))
    }

    recognition.onend = () => {
      if (settled) return
      if (latestTranscript) {
        settle(() => resolve(latestTranscript))
      } else {
        settle(() => reject(new SpeechRecognitionError('no-speech', 'No speech detected — try again')))
      }
    }

    try {
      recognition.start()
    } catch (err) {
      settle(() => reject(err))
    }
  })
}
