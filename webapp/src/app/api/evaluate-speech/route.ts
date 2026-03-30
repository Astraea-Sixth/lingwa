import { NextResponse } from 'next/server'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5003'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle both JSON and multipart (audio) requests
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const res = await fetch(`${API_BASE}/api/evaluate-speech-audio`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Evaluation error' }, { status: res.status })
      }
      return NextResponse.json(await res.json())
    }

    // JSON request (text-only evaluation)
    const body = await request.text()
    const res = await fetch(`${API_BASE}/api/evaluate-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Evaluation error' }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(
      { error: 'Speech evaluation unavailable' },
      { status: 503 },
    )
  }
}
