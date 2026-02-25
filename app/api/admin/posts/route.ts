import { NextResponse } from 'next/server'
import { requireCsrfHeader, requireSession } from '@/lib/api-guards'
import { appendAuditLog } from '@/lib/audit-log'
import { listAllPostsForAdmin, transitionPostStatus, upsertDraftPost } from '@/lib/blog-store'
import { createBlogPreviewToken } from '@/lib/blog-preview-token'
import { blogPostActionSchema } from '@/lib/validation'

export async function GET(request: Request) {
  const checked = await requireSession(request, 'admin-posts', 120)
  if ('response' in checked) return checked.response
  const { session } = checked
  const posts = await listAllPostsForAdmin()
  if (session.role === 'admin') {
    return NextResponse.json({ posts })
  }
  return NextResponse.json({ posts: posts.filter((post) => post.authorId === session.memberId) })
}

export async function POST(request: Request) {
  const checked = await requireSession(request, 'admin-posts-action', 120)
  if ('response' in checked) return checked.response
  const csrf = await requireCsrfHeader(request)
  if (csrf !== true) return csrf.response
  const { session, ip } = checked

  const parsed = blogPostActionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }
  const payload = parsed.data

  if (payload.action === 'save') {
    if (!payload.post) {
      return NextResponse.json({ error: 'post is required' }, { status: 400 })
    }
    if (session.role !== 'admin') {
      payload.post.authorId = session.memberId
    }
    const post = await upsertDraftPost(payload.post)
    await appendAuditLog({
      at: new Date().toISOString(),
      actorMemberId: session.memberId,
      actorRole: session.role,
      targetMemberId: post.authorId,
      action: 'blog_post_saved',
      ip,
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      meta: { slug: post.slug },
    })
    return NextResponse.json({ ok: true, post })
  }

  if (!payload.slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  if (session.role !== 'admin') {
    const all = await listAllPostsForAdmin()
    const target = all.find((post) => post.slug === payload.slug)
    if (!target) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (target.authorId !== session.memberId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (payload.action === 'preview') {
    const token = createBlogPreviewToken(payload.slug, 60 * 20)
    return NextResponse.json({ ok: true, previewUrl: `/blog/preview/${payload.slug}?token=${token}` })
  }

  if (payload.action === 'submit_review') {
    const post = await transitionPostStatus(payload.slug, 'in_review', session.role)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, post })
  }

  if (payload.action === 'publish') {
    const post = await transitionPostStatus(payload.slug, 'published', session.role)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, post })
  }

  if (payload.action === 'schedule') {
    if (!payload.scheduledFor) {
      return NextResponse.json({ error: 'scheduledFor is required' }, { status: 400 })
    }
    const post = await transitionPostStatus(payload.slug, 'scheduled', session.role, payload.scheduledFor)
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, post })
  }

  if (payload.action === 'approve') {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const post = await transitionPostStatus(payload.slug, 'published', 'admin')
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, post })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
