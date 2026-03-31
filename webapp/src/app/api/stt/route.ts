import { NextResponse } from 'next/server'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5003'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Forward multipart to FastAPI — don't set Content-Type, let fetch generate boundary
    const res = await fetch(`${API_BASE}/api/stt`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'STT service error', status: res.status },
        { status: res.status },
      )
    }

    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json(
      { error: 'STT service unavailable' },
      { status: 503 },
    )
  }
}
