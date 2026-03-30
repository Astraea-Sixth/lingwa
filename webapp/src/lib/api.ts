/**
 * Lingwa API client — connects to the FastAPI backend on port 5003
 */

const BASE_URL = ''

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  lang: string
  message: string
  history: ChatMessage[]
  unit: number
  lesson: number
}

export interface ChatResponse {
  reply: string
  correction?: string
}

export interface LangConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  tutor: { name: string; nameNative: string; personality: string }
  ttsVoice: string
  hasScript: boolean
  tones?: number
  difficulty: string
}

export interface CurriculumResponse {
  language: string
  level: string
  units: Array<{
    id: number
    title: string
    lessons: Array<{
      id: string
      title: string
      objectives: string[] | Record<string, string[]>
      exercises: Exercise[]
      chat_seed: string
      vocabulary: string[]
    }>
  }>
}

export interface Exercise {
  type: string
  question: string
  options?: string[]
  correct?: number
  correctText?: string
  explanation: string
  audio?: string
}

// ─────────────────────────────────────────────
// Core fetch helper
// ─────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`API error ${response.status}: ${error}`)
  }

  return response.json()
}

// ─────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

// ─────────────────────────────────────────────
// Languages
// ─────────────────────────────────────────────

export async function getLanguageConfig(lang: string): Promise<LangConfig> {
  return apiFetch<LangConfig>(`/api/languages/${lang}/config`)
}

export async function getAvailableLanguages(): Promise<LangConfig[]> {
  return apiFetch<LangConfig[]>('/api/languages')
}

// ─────────────────────────────────────────────
// Curriculum
// ─────────────────────────────────────────────

export async function getCurriculum(lang: string, level: string = 'A1'): Promise<CurriculumResponse> {
  return apiFetch<CurriculumResponse>(`/api/curriculum/${lang}/${level}`)
}

// ─────────────────────────────────────────────
// Evaluation (LLM-based semantic matching)
// ─────────────────────────────────────────────

export async function evaluateAnswer(params: {
  type: 'translate' | 'reverse_translate'
  userAnswer: string
  expected: string
  language: string
}): Promise<{ correct: boolean; feedback: string; alternatives?: string[] }> {
  return apiFetch('/api/evaluate', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// ─────────────────────────────────────────────
// TTS
// ─────────────────────────────────────────────

export function getTTSUrl(text: string, lang: string, speed: number = 1.0): string {
  const params = new URLSearchParams({ text, language: lang, speed: String(speed) })
  return `${BASE_URL}/api/tts?${params}`
}

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}
