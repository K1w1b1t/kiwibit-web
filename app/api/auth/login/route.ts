import { NextResponse } from 'next/server'
import { findAccountByEmail } from '@/data/member-accounts'
import { createSessionTokenPersisted, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session'
import { createCsrfToken, csrfCookieOptions, enforceRateLimit, getClientIp, getCsrfCookieName } from '@/lib/security'
import { appendAuditLog } from '@/lib/audit-log'
import { isDatabaseEnabled, isDatabaseStrict, prisma } from '@/lib/prisma'
import { z } from 'zod'

type LoginPayload = {
  email?: string
  password?: string
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(120),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = await enforceRateLimit(`login:${ip}`, 12)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  const payload = (await request.json()) as LoginPayload
  const parsed = loginSchema.safeParse({
    email: payload.email?.trim() ?? '',
    password: payload.password ?? '',
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  const email = parsed.data.email
  const password = parsed.data.password

  if (!isDatabaseEnabled() && isDatabaseStrict()) {
    return NextResponse.json({ error: 'Database required in strict mode' }, { status: 500 })
  }

  const account = isDatabaseEnabled()
    ? await prisma.memberAccount.findUnique({
        where: { email: email.toLowerCase() },
        select: { memberId: true, email: true, password: true, role: true },
      })
    : findAccountByEmail(email)
  if (!account || account.password !== password) {
    await appendAuditLog({
      at: new Date().toISOString(),
      actorMemberId: 'unknown',
      actorRole: 'public',
      targetMemberId: 'unknown',
      action: 'login_failed',
      ip,
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      meta: { email },
    })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const role = account.role === 'admin' ? 'admin' : 'member'
  const token = await createSessionTokenPersisted(account.memberId, account.email, role)
  const csrfToken = createCsrfToken(account.memberId)
  const response = NextResponse.json({ ok: true, memberId: account.memberId, role, csrfToken })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
  response.cookies.set(getCsrfCookieName(), csrfToken, csrfCookieOptions())
  await appendAuditLog({
    at: new Date().toISOString(),
    actorMemberId: account.memberId,
    actorRole: role,
    targetMemberId: account.memberId,
    action: 'login_success',
    ip,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  })
  return response
}
