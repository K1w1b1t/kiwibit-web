import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { listPublishedPosts, listUniqueTagsAndCategories } from '@/lib/blog-store'
import NewsletterCapture from '@/components/blog/NewsletterCapture'
import TrackedLink from '@/components/blog/TrackedLink'

export const revalidate = 120

const SITE_URL = 'http://localhost:3000'

type BlogPageProps = {
  searchParams: Promise<{
    q?: string
    tag?: string
    category?: string
    page?: string
  }>
}

export const metadata: Metadata = {
  title: 'Blog | KIWI BIT',
  description: 'Security engineering articles, incident response notes and architecture research.',
  alternates: { canonical: `${SITE_URL}/blog` },
}

function pageHref(params: { q?: string; tag?: string; category?: string; page: number }) {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.tag) query.set('tag', params.tag)
  if (params.category) query.set('category', params.category)
  query.set('page', String(params.page))
  return `/blog?${query.toString()}`
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams
  const page = Number(params.page ?? '1')
  const listing = await listPublishedPosts({
    q: params.q,
    tag: params.tag,
    category: params.category,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 9,
  })
  const { tags, categories } = await listUniqueTagsAndCategories()

  return (
    <main className="min-h-screen bg-[var(--surface-bg)] px-4 pb-16 pt-28 text-[var(--text-main)]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">Research Logs</p>
          <h1 className="mt-3 text-5xl font-semibold">KIWI BIT Blog</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-soft)]">Draft to publish workflow, technical analysis, and practical security playbooks.</p>
        </header>

        <form action="/blog" className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search posts, tags or categories..."
            className="rounded border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">
            Search
          </button>
        </form>

        {listing.featured ? (
          <article className="mb-10 overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
            <div className="grid gap-0 md:grid-cols-2">
              <Image src={listing.featured.coverImage} alt={listing.featured.title} width={900} height={500} className="h-full w-full object-cover" />
              <div className="p-8">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Featured</p>
                <h2 className="mt-3 text-3xl font-semibold">{listing.featured.title}</h2>
                <p className="mt-3 text-sm text-[var(--text-soft)]">{listing.featured.excerpt}</p>
                <Link href={`/blog/${listing.featured.slug}`} className="mt-6 inline-block rounded border border-[var(--text-main)] px-4 py-2 text-xs uppercase tracking-[0.14em]">
                  Read article
                </Link>
              </div>
            </div>
          </article>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TrackedLink key={tag} href={pageHref({ q: params.q, tag, category: params.category, page: 1 })} tag={tag} className="rounded border border-[var(--surface-border)] px-3 py-1 text-xs">
              #{tag}
            </TrackedLink>
          ))}
          {categories.map((category) => (
            <Link key={category} href={pageHref({ q: params.q, tag: params.tag, category, page: 1 })} className="rounded border border-[var(--surface-border)] px-3 py-1 text-xs">
              {category}
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listing.items.map((post) => (
            <article key={post.slug} className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <Image src={post.coverImage} alt={post.title} width={600} height={350} className="h-44 w-full rounded object-cover" />
              <h3 className="mt-4 text-xl font-semibold">{post.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-soft)]">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-xs uppercase tracking-[0.14em] text-[var(--text-muted)] hover:text-[var(--text-main)]">
                View post
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href={pageHref({ q: params.q, tag: params.tag, category: params.category, page: Math.max(1, listing.page - 1) })} className="text-xs uppercase tracking-[0.14em]">
            Previous
          </Link>
          <span className="text-xs text-[var(--text-muted)]">
            Page {listing.page} / {listing.totalPages}
          </span>
          <Link href={pageHref({ q: params.q, tag: params.tag, category: params.category, page: Math.min(listing.totalPages, listing.page + 1) })} className="text-xs uppercase tracking-[0.14em]">
            Next
          </Link>
        </div>

        <div className="mt-10">
          <NewsletterCapture />
        </div>
      </div>
    </main>
  )
}
