import { NextResponse } from 'next/server'
import { listPublishedPosts, listUniqueTagsAndCategories, publishScheduledDuePosts } from '@/lib/blog-store'

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value ?? '')
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export async function GET(request: Request) {
  await publishScheduledDuePosts()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const tag = searchParams.get('tag') ?? undefined
  const category = searchParams.get('category') ?? undefined
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), 9)

  const listing = await listPublishedPosts({ q, tag, category, page, pageSize })
  const filters = await listUniqueTagsAndCategories()
  return NextResponse.json({
    ...listing,
    tags: filters.tags,
    categories: filters.categories,
  })
}
