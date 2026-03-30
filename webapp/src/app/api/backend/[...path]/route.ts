import { NextRequest, NextResponse } from 'next/server'
import { API_BASE } from '@/lib/apiConfig'

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  const body = await request.text()
  try {
    const res = await fetch(`${API_BASE}/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  const url = new URL(request.url)
  try {
    const res = await fetch(`${API_BASE}/api/${path}${url.search}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }
}
