'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { t as i18nT, registerFromConfig } from '@/lib/i18n'
import { loadStaticConfig } from '@/lib/staticCourses'

// ─── Context shape ───

interface I18nContextValue {
  nativeLang: string
  t: (key: string, vars?: Record<string, string | number>) => string
  ready: boolean
  setNativeLang: (lang: string) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

// ─── Provider ───

function getNativeLangFromStorage(): string {
  if (typeof window === 'undefined') return 'en'
  try {
    // Check localStorage directly first (fastest)
    const direct = localStorage.getItem('lingwa_native_lang')
    if (direct) return direct
    // Fall back to profile
    const raw = localStorage.getItem('lingwa_profile')
    if (raw) {
      const profile = JSON.parse(raw)
      if (profile.nativeLang) return profile.nativeLang
    }
  } catch {
    // ignore
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [nativeLang, setNativeLangState] = useState<string>('en')
  const [ready, setReady] = useState(false)

  const loadAndRegister = useCallback(async (lang: string) => {
    setReady(false)
    try {
      const config = await loadStaticConfig(lang)
      if (config) {
        registerFromConfig(config)
      }
      // Always also ensure 'en' is loaded as fallback (idempotent if already loaded)
      if (lang !== 'en') {
        const enConfig = await loadStaticConfig('en')
        if (enConfig) registerFromConfig(enConfig)
      }
    } catch {
      // If load fails, still mark ready — we'll fall back to whatever is registered
    }
    setReady(true)
  }, [])

  // On mount: read nativeLang from storage, load its config
  useEffect(() => {
    const lang = getNativeLangFromStorage()
    setNativeLangState(lang)
    loadAndRegister(lang)
  }, [loadAndRegister])

  // Expose a setter that loads the new config and persists to localStorage
  const setNativeLang = useCallback((lang: string) => {
    setNativeLangState(lang)
    try {
      localStorage.setItem('lingwa_native_lang', lang)
    } catch { /* ignore */ }
    loadAndRegister(lang)
  }, [loadAndRegister])

  // Context-aware t() — lang is baked in from provider state
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => i18nT(key, nativeLang, vars),
    [nativeLang]
  )

  return (
    <I18nContext.Provider value={{ nativeLang, t, ready, setNativeLang }}>
      {ready ? children : <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}
    </I18nContext.Provider>
  )
}

// ─── Hook ───

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n() must be used within <I18nProvider>')
  }
  return ctx
}
