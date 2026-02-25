import { NextResponse } from 'next/server'
import { appendAuditLog } from '@/lib/audit-log'
import { createPendingSubscriber } from '@/lib/newsletter-store'
import { enforceRateLimit, getClientIp } from '@/lib/security'
import { newsletterSchema } from '@/lib/validation'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = await enforceRateLimit(`newsletter:${ip}`, 20)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const parsed = newsletterSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const subscriber = await createPendingSubscriber(parsed.data.email)
  const confirmUrl = `${new URL(request.url).origin}/newsletter/confirm?token=${subscriber.token}`

  if (process.env.NEWSLETTER_WEBHOOK_URL) {
    try {
      await fetch(process.env.NEWSLETTER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: subscriber.email,
          confirmUrl,
        }),
      })
    } catch {
      // Optional integration; local flow still works.
    }
  }

  await appendAuditLog({
    at: new Date().toISOString(),
    actorMemberId: 'visitor',
    actorRole: 'public',
    targetMemberId: 'newsletter',
    action: 'newsletter_subscribe_pending',
    ip,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    meta: { email: subscriber.email },
  })

  return NextResponse.json({
    ok: true,
    status: subscriber.status,
    confirmUrl,
  })
}
