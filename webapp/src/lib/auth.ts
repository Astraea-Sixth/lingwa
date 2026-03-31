import { supabase } from './supabase'

export async function signInWithGoogle() {
  if (!supabase) return { error: 'Supabase not configured' }
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
  })
}

export async function signInWithEmail(email: string) {
  if (!supabase) return { error: 'Supabase not configured' }
  return supabase.auth.signInWithOtp({ email })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}
