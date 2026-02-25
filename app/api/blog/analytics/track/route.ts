import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendAuditLog } from '@/lib/audit-log'
import { enforceRateLimit, getClientIp } from '@/lib/security'

const schema = z.object({
  type: z.enum(['scroll_depth', 'post_dwell', 'post_cta_click', 'tag_click']),
  slug: z.string().optional(),
  tag: z.string().optional(),
  depth: z.number().int().nonnegative().optional(),
  ms: z.number().int().nonnegative().optional(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = await enforceRateLimit(`blog-analytics:${ip}`, 180)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  await appendAuditLog({
    at: new Date().toISOString(),
    actorMemberId: 'visitor',
    actorRole: 'public',
    targetMemberId: 'blog',
    action: parsed.data.type,
    ip,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    meta: parsed.data,
  })
  return NextResponse.json({ ok: true })
}
