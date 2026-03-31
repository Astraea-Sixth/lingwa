import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5003'

export async function GET(_req: NextRequest, { params }: { params: { lang: string, level: string } }) {
  try {
    const res = await fetch(`${API_BASE}/api/curriculum/${params.lang}/${params.level}`)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }
}
