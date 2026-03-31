import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5003'

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
