import { NextResponse } from 'next/server'
import { confirmSubscriberByToken } from '@/lib/newsletter-store'

export async function POST(request: Request) {
  const payload = (await request.json()) as { token?: string }
  if (!payload.token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }
  const confirmed = await confirmSubscriberByToken(payload.token)
  if (!confirmed) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, status: confirmed.status })
}
