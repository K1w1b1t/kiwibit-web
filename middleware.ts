import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'kb_session'
const IS_PROD = process.env.NODE_ENV === 'production'

const SENSITIVE_API_PREFIXES = [
  '/api/auth',
  '/api/admin',
  '/api/member/upload',
  '/api/admin/members/avatar',
  '/api/admin/posts/media',
]

function isSensitivePath(pathname: string) {
  if (pathname.startsWith('/admin')) return true
  return SENSITIVE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function getContentSecurityPolicy(pathname: string) {
  if (!isSensitivePath(pathname)) return ''
  const scriptSrc = IS_PROD ? "'self'" : "'self' 'unsafe-eval'"
  return [
    "default-src 'self'",
    `script-src ${scriptSrc} 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

function applySecurityHeaders(response: NextResponse, pathname: string, requestId: string) {
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-content-type-options', 'nosniff')
  response.headers.set('x-frame-options', 'DENY')
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  response.headers.set('x-dns-prefetch-control', 'off')
  response.headers.set('cross-origin-opener-policy', 'same-origin')
  response.headers.set('cross-origin-resource-policy', 'same-site')
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()')
  if (IS_PROD) {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload')
  }
  const csp = getContentSecurityPolicy(pathname)
  if (csp) {
    response.headers.set('content-security-policy', csp)
  }
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID()
  const headers = new Headers(request.headers)
  headers.set('x-request-id', requestId)

  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get(SESSION_COOKIE)?.value
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      const redirected = NextResponse.redirect(loginUrl)
      applySecurityHeaders(redirected, request.nextUrl.pathname, requestId)
      return redirected
    }
  }
  const response = NextResponse.next({
    request: {
      headers,
    },
  })
  applySecurityHeaders(response, request.nextUrl.pathname, requestId)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
