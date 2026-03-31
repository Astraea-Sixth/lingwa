'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { isHostedMode } from '@/lib/supabase'
import { getUser, signOut } from '@/lib/auth'
import { loadApiKeys, type ApiKeys } from '@/lib/cloudProgress'

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string

  const [email, setEmail] = useState<string | null>(null)
  const [provider, setProvider] = useState<string>('none')
  const hosted = isHostedMode()

  useEffect(() => {
    if (!hosted) return
    getUser().then(user => {
      if (user) {
        setEmail(user.email ?? null)
        // Determine active AI provider
        loadApiKeys(user.id).then(keys => {
          if (keys.anthropic) setProvider('Anthropic')
          else if (keys.openai) setProvider('OpenAI')
          else if (keys.google) setProvider('Google AI')
          else if (keys.groq) setProvider('Groq')
          else setProvider('none')
        })
      }
    })
  }, [hosted])

  async function handleSignOut() {
    await signOut()
    router.replace('/auth')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/${lang}`)}
            style={{ color: 'var(--text-muted)' }}
            className="hover:text-white transition-colors font-bold"
          >
            ←
          </button>
          <span className="font-black">Settings</span>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Account section (hosted only) */}
          {hosted && email && (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Account</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email</span>
                <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Provider</span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: provider === 'none' ? 'var(--red)' : 'var(--green)' }}
                >
                  {provider === 'none' ? 'Not configured' : provider}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
          >
            {hosted && (
              <>
                <button
                  onClick={() => router.push(`/${lang}/chat`)}
                  className="w-full px-5 py-4 text-left text-sm font-semibold flex items-center justify-between hover:brightness-110 transition-all"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <span>AI Provider Keys</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                </button>
                <button
                  onClick={() => router.push('/feedback')}
                  className="w-full px-5 py-4 text-left text-sm font-semibold flex items-center justify-between hover:brightness-110 transition-all"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <span>Send Feedback</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full px-5 py-4 text-left text-sm font-semibold flex items-center justify-between hover:brightness-110 transition-all"
            >
              <span>Change Language</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
          </div>

          {/* Sign out (hosted only) */}
          {hosted && (
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-2xl text-sm font-bold border-2 transition-all"
              style={{ borderColor: 'rgba(255,75,75,0.3)', color: 'var(--red)', background: 'rgba(255,75,75,0.05)' }}
            >
              Sign out
            </button>
          )}

          <p className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
            lingwa v2 · Open source
          </p>
        </motion.div>
      </div>
    </div>
  )
}
