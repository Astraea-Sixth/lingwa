'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { isHostedMode } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { getUser } from '@/lib/auth'

export default function FeedbackPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isHostedMode()) {
      router.replace('/')
      return
    }
    getUser().then(user => {
      if (!user) {
        router.replace('/auth')
      } else {
        setUserId(user.id)
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId || !supabase) return
    setSending(true)
    setError('')

    const { error: err } = await supabase.from('feedback').insert({
      user_id: userId,
      message: text.trim(),
      created_at: new Date().toISOString(),
    })

    setSending(false)
    if (err) {
      setError('Failed to submit. Please try again.')
    } else {
      setSent(true)
    }
  }

  if (!userId) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            style={{ color: 'var(--text-muted)' }}
            className="hover:text-white transition-colors font-bold"
          >
            ←
          </button>
          <span className="font-black">Feedback</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px]"
        >
          {sent ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">🙏</div>
              <p className="font-bold text-lg">Thank you!</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your feedback helps us improve lingwa.
              </p>
              <button
                onClick={() => router.back()}
                className="btn-green px-8 py-3 mt-4"
              >
                Go back
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Bug reports, feature requests, or just saying hi — we read everything.
              </p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  color: 'var(--text)',
                  caretColor: 'var(--green)',
                }}
              />
              {error && (
                <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="btn-green w-full py-3"
              >
                {sending ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
