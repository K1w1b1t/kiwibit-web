import { NextResponse } from 'next/server'
import { getPublishedPostBySlug, listRelatedPosts } from '@/lib/blog-store'
import { listApprovedCommentsBySlug } from '@/lib/blog-comments-store'

type Params = {
  params: Promise<{ slug: string }>
}

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const related = await listRelatedPosts(slug, 3)
  const comments = await listApprovedCommentsBySlug(slug)
  return NextResponse.json({ post, related, comments })
}
