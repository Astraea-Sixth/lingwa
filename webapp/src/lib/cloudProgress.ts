import { supabase } from './supabase'

/**
 * Get all lingwa:* keys from localStorage as an object
 */
function getAllLocalProgress(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  const data: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('lingwa')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || '{}')
      } catch {
        data[key] = localStorage.getItem(key)
      }
    }
  }
  return data
}

/**
 * Sync all localStorage progress to Supabase
 */
export async function syncToCloud(userId: string): Promise<void> {
  if (!supabase) return
  const data = getAllLocalProgress()
  if (Object.keys(data).length === 0) return

  await supabase.from('progress').upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Load progress from Supabase into localStorage
 * Returns true if data was loaded
 */
export async function loadFromCloud(userId: string): Promise<boolean> {
  if (!supabase) return false

  const { data, error } = await supabase
    .from('progress')
    .select('data')
    .eq('user_id', userId)
    .single()

  if (error || !data?.data) return false

  const progress = data.data as Record<string, unknown>
  for (const [key, value] of Object.entries(progress)) {
    if (key.startsWith('lingwa')) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
  }
  return true
}

// ─── API keys ────────────────────────────────

export interface ApiKeys {
  anthropic?: string
  openai?: string
  google?: string
  groq?: string
}

export async function saveApiKeys(userId: string, keys: ApiKeys): Promise<void> {
  if (!supabase) return
  await supabase.from('api_keys').upsert({
    user_id: userId,
    keys,
    updated_at: new Date().toISOString(),
  })
}

export async function loadApiKeys(userId: string): Promise<ApiKeys> {
  if (!supabase) return {}
  const { data } = await supabase
    .from('api_keys')
    .select('keys')
    .eq('user_id', userId)
    .single()
  return (data?.keys as ApiKeys) ?? {}
}
