'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import { loadSRSData } from '@/lib/progress'
import { getDueWords, type WordRecord } from '@/lib/srs'
import ReviewMode from '@/components/ReviewMode'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string

  const [dueWords, setDueWords] = useState<WordRecord[]>([])
  const [allWords, setAllWords] = useState<WordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()

  useEffect(() => {
    const srsData = loadSRSData(lang)
    const due = getDueWords(srsData.words)
    const all = Object.values(srsData.words)
    setDueWords(due)
    setAllWords(all)
    setLoading(false)
  }, [lang])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>{t('loadingLesson')}</p>
      </div>
    )
  }

  return (
    <ReviewMode
      lang={lang}
      dueWords={dueWords}
      allWords={allWords}
      onComplete={() => router.push(`/${lang}?level=A1`)}
    />
  )
}
