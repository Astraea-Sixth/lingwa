'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signInWithGoogle, signInWithEmail } from '@/lib/auth'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to sign in')
      setLoading(false)
    }
    // OAuth redirects — no need to handle success here
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const result = await signInWithEmail(email)
    if (result?.error) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to send link')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] rounded-3xl p-8"
        style={{ background: 'var(--surface)' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Lingwa 🌍
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Learn any language. Free forever.
          </p>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Check your email
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              We sent a magic link to <strong style={{ color: 'var(--text)' }}>{email}</strong>
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-6 text-sm underline"
              style={{ color: 'var(--text-muted)' }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-opacity"
              style={{
                background: 'var(--green)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleEmail} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-4 rounded-2xl text-base outline-none"
                style={{
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  border: '2px solid var(--border)',
                }}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 rounded-2xl font-bold text-base transition-opacity"
                style={{
                  background: 'var(--surface2)',
                  color: 'var(--text)',
                  opacity: loading || !email ? 0.4 : 1,
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  border: '2px solid var(--border)',
                }}
              >
                Send magic link
              </button>
            </form>

            {error && (
              <p className="text-center mt-4 text-sm" style={{ color: 'var(--red)' }}>
                {error}
              </p>
            )}

            <p className="text-center mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              Free forever. No credit card. No catch.
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
