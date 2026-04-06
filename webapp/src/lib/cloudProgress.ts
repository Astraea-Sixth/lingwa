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
 * Clear all progress from Supabase for this user
 */
export async function clearCloudProgress(userId: string): Promise<void> {
  if (!supabase) return
  await supabase.from('progress').delete().eq('user_id', userId)
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
