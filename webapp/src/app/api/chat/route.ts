import { NextRequest, NextResponse } from 'next/server'
import { API_BASE } from '@/lib/apiConfig'

export async function POST(request: NextRequest) {
  const body = await request.text()
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }
}
