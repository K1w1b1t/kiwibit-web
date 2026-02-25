import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isObjectStorageEnabled, uploadObjectToStorage } from '@/lib/object-storage'
import { enforceCsrf, getCsrfCookieName } from '@/lib/security'
import { getSessionFromCookiesAsync } from '@/lib/session'

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function sanitizeFilePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = await getSessionFromCookiesAsync(cookieStore)
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
    return NextResponse.json({ error: 'Max file size is 6MB' }, { status: 400 })
  }

  const bytes = await rawFile.arrayBuffer()
  const buffer = Buffer.from(bytes)
  let sharpModule: typeof import('sharp')
  try {
    sharpModule = await import('sharp')
  } catch {
    return NextResponse.json({ error: 'Image optimizer unavailable (sharp not installed)' }, { status: 500 })
  }

  const baseName = sanitizeFilePart(path.parse(rawFile.name).name || 'cover')
  const fileName = `${Date.now()}-${baseName}.webp`

  const outputBuffer = await sharpModule(buffer).resize(1400).webp({ quality: 84 }).toBuffer()
  if (isObjectStorageEnabled()) {
    try {
      const uploaded = await uploadObjectToStorage({
        key: `blog/${fileName}`,
        body: outputBuffer,
        contentType: 'image/webp',
      })
      return NextResponse.json({
        ok: true,
        url: uploaded.url,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Object storage upload failed',
        },
        { status: 500 }
      )
    }
  }

  const relativeDir = path.join('uploads', 'blog')
  const absoluteDir = path.join(process.cwd(), 'public', relativeDir)
  await fs.mkdir(absoluteDir, { recursive: true })
  await fs.writeFile(path.join(absoluteDir, fileName), outputBuffer)

  return NextResponse.json({
    ok: true,
    url: `/${relativeDir.replace(/\\/g, '/')}/${fileName}`,
  })
}
