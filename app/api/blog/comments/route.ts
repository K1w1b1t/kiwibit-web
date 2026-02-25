import { NextResponse } from 'next/server'
import { appendAuditLog } from '@/lib/audit-log'
import { createPendingComment, listApprovedCommentsBySlug } from '@/lib/blog-comments-store'
import { getPublishedPostBySlug } from '@/lib/blog-store'
import { enforceRateLimit, getClientIp } from '@/lib/security'
import { blogCommentSchema } from '@/lib/validation'

function detectSpam(message: string) {
  const links = (message.match(/https?:\/\/|www\./gi) ?? []).length
  if (links > 2) return true
  const blacklist = ['viagra', 'casino', 'bitcoin giveaway', 'free money']
  const lower = message.toLowerCase()
  return blacklist.some((word) => lower.includes(word))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }
  const comments = await listApprovedCommentsBySlug(slug)
  return NextResponse.json({ comments })
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rate = await enforceRateLimit(`blog-comment:${ip}`, 20)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const parsed = blogCommentSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data
  const post = await getPublishedPostBySlug(data.slug)
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (detectSpam(data.message)) {
    return NextResponse.json({ error: 'Comment flagged as spam' }, { status: 400 })
  }

  const comment = await createPendingComment({
    slug: data.slug,
    name: data.name,
    email: data.email,
    message: data.message,
    ip,
  })

  await appendAuditLog({
    at: new Date().toISOString(),
    actorMemberId: 'visitor',
    actorRole: 'public',
    targetMemberId: post.authorId,
    action: 'blog_comment_created',
    ip,
    userAgent: request.headers.get('user-agent') ?? 'unknown',
    meta: { commentId: comment.id, slug: data.slug },
  })

  return NextResponse.json({ ok: true, commentStatus: comment.status })
}
