import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionFromCookiesAsync } from '@/lib/session'
import { appendAuditLog } from '@/lib/audit-log'
import { isObjectStorageEnabled, uploadObjectToStorage } from '@/lib/object-storage'
import { enforceCsrf, enforceRateLimit, getClientIp, getCsrfCookieName } from '@/lib/security'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SIZES = [
  { key: 'sm', width: 320 },
  { key: 'md', width: 640 },
  { key: 'lg', width: 1024 },
] as const

function sanitizeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = await getSessionFromCookiesAsync(cookieStore)
  const ip = getClientIp(request)
  const rate = await enforceRateLimit(`upload:${ip}:${session?.memberId ?? 'anon'}`, 40)

  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!enforceCsrf(request, cookieStore.get(getCsrfCookieName())?.value)) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  const formData = await request.formData()
  const rawFile = formData.get('file')
  if (!(rawFile instanceof File)) {
    return NextResponse.json({ error: 'Invalid file payload' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(rawFile.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG and WEBP are allowed' }, { status: 400 })
  }
  if (rawFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Max file size is 5MB' }, { status: 400 })
  }

  const bytes = await rawFile.arrayBuffer()
  const buffer = Buffer.from(bytes)
  let sharpModule: typeof import('sharp')
  try {
    sharpModule = await import('sharp')
  } catch {
    return NextResponse.json({ error: 'Image optimizer unavailable (sharp not installed)' }, { status: 500 })
  }
  const baseName = sanitizeFilePart(path.parse(rawFile.name).name || 'avatar')
  const fileNameBase = `${Date.now()}-${baseName}`

  const urls: Record<string, string> = {}
  if (isObjectStorageEnabled()) {
    try {
      for (const size of SIZES) {
        const fileName = `${fileNameBase}-${size.key}.webp`
        const outputBuffer = await sharpModule(buffer).resize(size.width).webp({ quality: 82 }).toBuffer()
        const uploaded = await uploadObjectToStorage({
          key: `members/${sanitizeFilePart(session.memberId)}/${fileName}`,
          body: outputBuffer,
          contentType: 'image/webp',
        })
        urls[size.key] = uploaded.url
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Object storage upload failed',
        },
        { status: 500 }
      )
    }
  } else {
    const relativeDir = path.join('uploads', 'members', sanitizeFilePart(session.memberId))
    const absoluteDir = path.join(process.cwd(), 'public', relativeDir)
    await fs.mkdir(absoluteDir, { recursive: true })
    for (const size of SIZES) {
      const fileName = `${fileNameBase}-${size.key}.webp`
      const outputBuffer = await sharpModule(buffer).resize(size.width).webp({ quality: 82 }).toBuffer()
      await fs.writeFile(path.join(absoluteDir, fileName), outputBuffer)
      urls[size.key] = `/${relativeDir.replace(/\\/g, '/')}/${fileName}`
    }
  }

  await appendAuditLog({
    at: new Date().toISOString(),
    actorMemberId: session.memberId,
    actorRole: session.role,
    targetMemberId: session.memberId,
    action: 'avatar_upload',
    ip,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  })

  return NextResponse.json({
    ok: true,
    url: urls.md,
    variants: urls,
  })
}
