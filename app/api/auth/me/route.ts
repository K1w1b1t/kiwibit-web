import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionTokenPersisted, getSessionFromCookiesAsync, SESSION_COOKIE, sessionCookieOptions, shouldRotateSession } from '@/lib/session'
import { createCsrfToken, csrfCookieOptions, getCsrfCookieName } from '@/lib/security'

export async function GET() {
  const cookieStore = await cookies()
  const session = await getSessionFromCookiesAsync(cookieStore)
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const currentCsrf = cookieStore.get(getCsrfCookieName())?.value
  const shouldRotate = shouldRotateSession(session) || !currentCsrf
  const csrfToken = shouldRotate ? createCsrfToken(session.memberId) : currentCsrf

  const response = NextResponse.json({
    authenticated: true,
    memberId: session.memberId,
    email: session.email,
    role: session.role,
    csrfToken,
  })

  if (shouldRotate) {
    const rotated = await createSessionTokenPersisted(session.memberId, session.email, session.role)
    response.cookies.set(SESSION_COOKIE, rotated, sessionCookieOptions())
    response.cookies.set(getCsrfCookieName(), csrfToken, csrfCookieOptions())
  }

  return response
}
