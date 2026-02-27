'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseMarkdown } from '@/lib/markdown'
import { BLOG_ARTICLE_TEMPLATE, BLOG_EDITORIAL_CALENDAR, BLOG_FIXED_CATEGORIES } from '@/data/blog-editorial'
import AdminSemanticPanel from '@/components/blog/AdminSemanticPanel'

type AdminPost = {
  slug: string
  title: string
  excerpt: string
  coverImage: string
  authorId: string
  tags: string[]
  categories: string[]
  featured: boolean
  status: 'draft' | 'in_review' | 'published' | 'scheduled'
  scheduledFor?: string
  draftContent: string
}

type PendingComment = {
  id: string
  slug: string
  name: string
  message: string
  createdAt: string
}

type BlogAnalyticsRow = {
  slug: string
  title: string
  authorId: string
  status: string
  publishedAt?: string
  scrollAvgDepth: number
  dwellAvgSec: number
  shareClicks: number
  ctaClicks: number
  ctrPercent: number
  interactions: number
}

function emptyPost(authorId: string): AdminPost {
  return {
    slug: '',
    title: '',
    excerpt: '',
    coverImage: '',
    authorId,
    tags: [],
    categories: ['Engineering'],
    featured: false,
    status: 'draft',
    draftContent: BLOG_ARTICLE_TEMPLATE,
  }
}

type OpsMetricRow = {
  endpoint: string
  count: number
  errors: number
  validationRejected: number
  errorRatePercent: number
  p95Ms: number
  p99Ms: number
}

type GrowthPayload = {
  cohorts: Array<{ day: string; newVisitors: number; returningVisitors: number }>
  ctrByCta: Array<{ cta: string; clicks: number }>
  performanceBands: Array<{ band: string; count: number }>
  retentionRatePercent: number
}

type SeoGapPayload = {
  generatedAt: string
  thinContentCount: number
  missingTemplateCount: number
  noInternalLinkCount: number
  rows: Array<{
    slug: string
    title: string
    status: string
    wordCount: number
    seoScore: number
    gaps: string[]
  }>
  coverage: Array<{ topic: string; totalPosts: number }>
}

type EditorAssist = {
  suggestedTitle: string
  suggestedExcerpt: string
  seoScore: number
  keywords: string[]
  internalLinks: Array<{ slug: string; title: string; overlap: number }>
  checklist: {
    hasIntro: boolean
    hasProblem: boolean
    hasSolution: boolean
    hasConclusion: boolean
    hasCTA: boolean
  }
}

export default function BlogAdminPanel() {
  const router = useRouter()
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [mediaUploadToken, setMediaUploadToken] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [role, setRole] = useState<'member' | 'member_manager' | 'editor' | 'admin'>('member')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [form, setForm] = useState<AdminPost | null>(null)
  const [feedback, setFeedback] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([])
  const [analyticsRows, setAnalyticsRows] = useState<BlogAnalyticsRow[]>([])
  const [opsRows, setOpsRows] = useState<OpsMetricRow[]>([])
  const [growth, setGrowth] = useState<GrowthPayload | null>(null)
  const [seoGaps, setSeoGaps] = useState<SeoGapPayload | null>(null)
  const [assist, setAssist] = useState<EditorAssist | null>(null)
  const [isAssistLoading, setIsAssistLoading] = useState(false)
  const [opsFeedback, setOpsFeedback] = useState('')

  const parsedPreview = useMemo(() => {
    if (!form) return []
    return parseMarkdown(form.draftContent).blocks
  }, [form])
  const hasEditorialTemplate = useMemo(() => {
    if (!form) return false
    return ['## Intro', '## Problem', '## Solution', '## Conclusion', '## CTA'].every((section) => form.draftContent.includes(section))
  }, [form])

  const loadSessionAndData = useCallback(async () => {
    const auth = await fetch('/api/auth/me')
    if (!auth.ok) {
      router.push('/login')
      return
    }
    const authData = (await auth.json()) as {
      csrfToken: string
      memberId: string
      role: 'member' | 'member_manager' | 'editor' | 'admin'
      uploadTokens?: { adminMedia?: string | null }
    }
    setCsrfToken(authData.csrfToken)
    setMediaUploadToken(authData.uploadTokens?.adminMedia ?? null)
    setMemberId(authData.memberId)
    setRole(authData.role)

    const postResponse = await fetch('/api/admin/posts')
    const analyticsResponse = await fetch('/api/admin/blog/analytics')
    const opsResponse = await fetch('/api/admin/ops/metrics')
    const [growthResponse, seoGapsResponse] = await Promise.all([fetch('/api/admin/blog/growth'), fetch('/api/admin/blog/seo-gaps')])
    if (!postResponse.ok) {
      setFeedback('Could not load posts.')
      return
    }

    const postData = (await postResponse.json()) as { posts: AdminPost[] }
    setPosts(postData.posts)
    const first = postData.posts[0] ?? null
    if (first) {
      setSelectedSlug(first.slug)
      setForm(first)
    } else {
      setForm(emptyPost(authData.memberId))
    }

    if (analyticsResponse.ok) {
      const analyticsData = (await analyticsResponse.json()) as { posts: BlogAnalyticsRow[] }
      setAnalyticsRows(analyticsData.posts)
    }
    if (opsResponse.ok) {
      const opsData = (await opsResponse.json()) as { endpoints: OpsMetricRow[] }
      setOpsRows(opsData.endpoints)
    }
    if (growthResponse.ok) {
      const growthData = (await growthResponse.json()) as GrowthPayload
      setGrowth(growthData)
    }
    if (seoGapsResponse.ok) {
      const seoData = (await seoGapsResponse.json()) as SeoGapPayload
      setSeoGaps(seoData)
    }

    if (authData.role === 'admin') {
      const commentsResponse = await fetch('/api/admin/blog/comments')
      if (commentsResponse.ok) {
        const commentsData = (await commentsResponse.json()) as { comments: PendingComment[] }
        setPendingComments(commentsData.comments)
      }
    }
  }, [router])

  useEffect(() => {
    void loadSessionAndData()
  }, [loadSessionAndData])

  function secureFetch(url: string, init?: RequestInit) {
    const headers = new Headers(init?.headers ?? {})
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
    if (csrfToken) headers.set('x-csrf-token', csrfToken)
    return fetch(url, { ...init, headers })
  }

  async function uploadCover(file: File | null) {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const headers = new Headers()
    if (csrfToken) headers.set('x-csrf-token', csrfToken)
    if (mediaUploadToken) headers.set('x-upload-token', mediaUploadToken)
    const response = await fetch('/api/admin/posts/media', {
      method: 'POST',
      headers,
      body: formData,
    })
    if (!response.ok) {
      setFeedback('Cover upload failed.')
      return
    }
    const data = (await response.json()) as { url: string }
    setForm((prev) => (prev ? { ...prev, coverImage: data.url } : prev))
    setFeedback('Cover uploaded.')
  }

  async function refreshPosts() {
    const [postsResponse, analyticsResponse, opsResponse] = await Promise.all([
      fetch('/api/admin/posts'),
      fetch('/api/admin/blog/analytics'),
      fetch('/api/admin/ops/metrics'),
    ])
    const [growthResponse, seoGapsResponse] = await Promise.all([fetch('/api/admin/blog/growth'), fetch('/api/admin/blog/seo-gaps')])
    if (postsResponse.ok) {
      const data = (await postsResponse.json()) as { posts: AdminPost[] }
      setPosts(data.posts)
      if (selectedSlug) {
        const found = data.posts.find((post) => post.slug === selectedSlug)
        if (found) setForm(found)
      }
    }
    if (analyticsResponse.ok) {
      const analyticsData = (await analyticsResponse.json()) as { posts: BlogAnalyticsRow[] }
      setAnalyticsRows(analyticsData.posts)
    }
    if (opsResponse.ok) {
      const opsData = (await opsResponse.json()) as { endpoints: OpsMetricRow[] }
      setOpsRows(opsData.endpoints)
    }
    if (growthResponse.ok) {
      const growthData = (await growthResponse.json()) as GrowthPayload
      setGrowth(growthData)
    }
    if (seoGapsResponse.ok) {
      const seoData = (await seoGapsResponse.json()) as SeoGapPayload
      setSeoGaps(seoData)
    }
  }

  async function savePost(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form) return
    setFeedback('')
    const response = await secureFetch('/api/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        action: 'save',
        post: {
          ...form,
          slug: form.slug || undefined,
          tags: form.tags,
          categories: form.categories,
        },
      }),
    })
    if (!response.ok) {
      setFeedback('Save failed.')
      return
    }
    const data = (await response.json()) as { post: AdminPost }
    setFeedback('Post saved.')
    setSelectedSlug(data.post.slug)
    setForm(data.post)
    await refreshPosts()
  }

  async function runAction(action: 'submit_review' | 'publish' | 'schedule' | 'approve' | 'preview') {
    if (!form?.slug) {
      setFeedback('Save post first to generate slug.')
      return
    }
    const payload: Record<string, unknown> = { action, slug: form.slug }
    if (action === 'schedule') payload.scheduledFor = scheduledFor
    const response = await secureFetch('/api/admin/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = (await response.json()) as { ok?: boolean; post?: AdminPost; previewUrl?: string; error?: string; approvals?: number; requiredApprovals?: number }
    if (!response.ok) {
      setFeedback(data.error ?? 'Action failed.')
      return
    }
    if (data.previewUrl) setPreviewUrl(data.previewUrl)
    if (data.post) {
      setForm(data.post)
      await refreshPosts()
    }
    if (typeof data.approvals === 'number' && typeof data.requiredApprovals === 'number') {
      setFeedback(`Action ${action} completed. Approvals: ${data.approvals}/${data.requiredApprovals}.`)
    } else {
      setFeedback(`Action ${action} completed.`)
    }
  }

  async function runEditorAssist() {
    if (!form) return
    setIsAssistLoading(true)
    const response = await secureFetch('/api/admin/posts/assist', {
      method: 'POST',
      body: JSON.stringify({
        draftContent: form.draftContent,
        currentTitle: form.title,
        currentExcerpt: form.excerpt,
      }),
    })
    const data = (await response.json()) as { assist?: EditorAssist; error?: string }
    if (!response.ok || !data.assist) {
      setFeedback(data.error ?? 'Could not generate AI assist.')
      setIsAssistLoading(false)
      return
    }
    setAssist(data.assist)
    setIsAssistLoading(false)
  }

  async function moderateComment(commentId: string, status: 'approved' | 'rejected') {
    const response = await secureFetch('/api/admin/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ commentId, status }),
    })
    if (!response.ok) return
    setPendingComments((items) => items.filter((item) => item.id !== commentId))
  }

  async function enqueueJob(type: 'embeddings_reindex' | 'growth_rollup' | 'github_sync') {
    const response = await secureFetch('/api/admin/jobs/enqueue', {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
    const data = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !data.ok) {
      setOpsFeedback(data.error ?? 'Could not enqueue job.')
      return
    }
    setOpsFeedback(`Job queued: ${type}`)
  }

  if (!form) {
    return <div className="min-h-screen bg-[var(--surface-bg)]" />
  }

  return (
    <main className="min-h-screen bg-[var(--surface-bg)] px-4 py-24 text-[var(--text-main)]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Content Admin</h1>
            <p className="text-sm text-[var(--text-soft)]">Role: {role}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const draft = emptyPost(memberId)
              setSelectedSlug(null)
              setForm(draft)
            }}
            className="rounded border border-[var(--surface-border)] px-3 py-2 text-xs uppercase tracking-[0.14em]"
          >
            New Post
          </button>
        </header>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr_1fr]">
          <aside className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Posts</p>
            <ul className="mt-3 space-y-2">
              {posts.map((post) => (
                <li key={post.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlug(post.slug)
                      setForm(post)
                    }}
                    className={`w-full rounded border px-3 py-2 text-left text-xs ${selectedSlug === post.slug ? 'border-[var(--text-main)]' : 'border-[var(--surface-border)]'}`}
                  >
                    <p className="font-semibold">{post.title}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{post.status}</p>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
            <form onSubmit={savePost} className="space-y-3">
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (optional)" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Excerpt" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="Cover image URL" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void uploadCover(e.target.files?.[0] ?? null)} className="w-full text-xs" />
              <input value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })} placeholder="Author member ID" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <input value={form.tags.join(', ')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Tags (comma separated)" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <div className="rounded border border-[var(--surface-border)] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BLOG_FIXED_CATEGORIES.map((category) => {
                    const selected = form.categories.includes(category)
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            categories: selected ? form.categories.filter((item) => item !== category) : [...form.categories, category].slice(0, 3),
                          })
                        }
                        className={`rounded border px-2 py-1 text-xs ${selected ? 'border-[var(--text-main)] text-[var(--text-main)]' : 'border-[var(--surface-border)] text-[var(--text-soft)]'}`}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
              </div>
              <textarea value={form.draftContent} onChange={(e) => setForm({ ...form, draftContent: e.target.value })} rows={16} className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              {!hasEditorialTemplate ? (
                <p className="text-xs text-amber-300">Recommendation: include Intro, Problem, Solution, Conclusion and CTA sections.</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded border border-[var(--text-main)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Save</button>
                <button type="button" onClick={() => setForm({ ...form, draftContent: BLOG_ARTICLE_TEMPLATE })} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Apply Template</button>
                <button type="button" onClick={() => void runEditorAssist()} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">
                  {isAssistLoading ? 'Analyzing...' : 'AI Assist'}
                </button>
                <button type="button" onClick={() => void runAction('submit_review')} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Submit Review</button>
                <button type="button" onClick={() => void runAction('publish')} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Publish</button>
                <button type="button" onClick={() => void runAction('approve')} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Approve</button>
                <button type="button" onClick={() => void runAction('preview')} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Preview Link</button>
              </div>
              <div className="flex items-center gap-2">
                <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-xs" />
                <button type="button" onClick={() => void runAction('schedule')} className="rounded border border-[var(--surface-border)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Schedule</button>
              </div>
              {previewUrl ? <p className="text-xs text-[var(--text-soft)]">Preview: {previewUrl}</p> : null}
              {feedback ? <p className="text-xs text-[var(--text-soft)]">{feedback}</p> : null}
              {assist ? (
                <div className="rounded border border-[var(--surface-border)] p-3 text-xs text-[var(--text-soft)]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">AI Editor</p>
                  <p className="mt-2">SEO score: <strong>{assist.seoScore}</strong>/100</p>
                  <p className="mt-1">Suggested title: {assist.suggestedTitle}</p>
                  <p className="mt-1">Suggested excerpt: {assist.suggestedExcerpt}</p>
                  <p className="mt-1">Keywords: {assist.keywords.join(', ')}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Checklist</p>
                  <p className="mt-1">
                    Intro {assist.checklist.hasIntro ? 'OK' : 'Missing'} | Problem {assist.checklist.hasProblem ? 'OK' : 'Missing'} | Solution {assist.checklist.hasSolution ? 'OK' : 'Missing'} | Conclusion {assist.checklist.hasConclusion ? 'OK' : 'Missing'} | CTA {assist.checklist.hasCTA ? 'OK' : 'Missing'}
                  </p>
                  {assist.internalLinks.length > 0 ? (
                    <>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Internal links</p>
                      <ul className="mt-1 space-y-1">
                        {assist.internalLinks.map((item) => (
                          <li key={item.slug}>/blog/{item.slug} - {item.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
            </form>
          </section>

          <section className="space-y-6">
            <AdminSemanticPanel secureFetch={secureFetch} />
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Async Jobs</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void enqueueJob('embeddings_reindex')} className="rounded border border-[var(--surface-border)] px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                  Queue Embeddings Reindex
                </button>
                <button type="button" onClick={() => void enqueueJob('growth_rollup')} className="rounded border border-[var(--surface-border)] px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                  Queue Growth Rollup
                </button>
                <button type="button" onClick={() => void enqueueJob('github_sync')} className="rounded border border-[var(--surface-border)] px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                  Queue GitHub Sync
                </button>
              </div>
              {opsFeedback ? <p className="mt-2 text-xs text-[var(--text-soft)]">{opsFeedback}</p> : null}
            </div>
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Live preview</p>
              <h2 className="mt-2 text-2xl font-semibold">{form.title || 'Untitled'}</h2>
              <p className="mt-2 text-sm text-[var(--text-soft)]">{form.excerpt}</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-soft)]">
                {parsedPreview.slice(0, 16).map((block, index) => {
                  if (block.type === 'h2') return <h3 key={`${block.id}-${index}`} className="text-lg font-semibold text-[var(--text-main)]">{block.text}</h3>
                  if (block.type === 'h3') return <h4 key={`${block.id}-${index}`} className="font-semibold text-[var(--text-main)]">{block.text}</h4>
                  if (block.type === 'ul') return <ul key={`ul-${index}`} className="list-inside list-disc">{block.items.map((item) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                  return <p key={`p-${index}`}>{block.text}</p>
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Pending comments</p>
              <ul className="mt-3 space-y-3">
                {pendingComments.map((comment) => (
                  <li key={comment.id} className="rounded border border-[var(--surface-border)] p-3">
                    <p className="text-xs text-[var(--text-muted)]">{comment.slug}</p>
                    <p className="mt-1 text-sm font-semibold">{comment.name}</p>
                    <p className="mt-1 text-sm text-[var(--text-soft)]">{comment.message}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => void moderateComment(comment.id, 'approved')} className="rounded border border-[var(--surface-border)] px-2 py-1 text-[10px] uppercase">Approve</button>
                      <button type="button" onClick={() => void moderateComment(comment.id, 'rejected')} className="rounded border border-[var(--surface-border)] px-2 py-1 text-[10px] uppercase">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Post Analytics</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-2 py-2">Post</th>
                      <th className="px-2 py-2">CTR</th>
                      <th className="px-2 py-2">Dwell</th>
                      <th className="px-2 py-2">Scroll</th>
                      <th className="px-2 py-2">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsRows.slice(0, 10).map((row) => (
                      <tr key={row.slug} className="border-t border-[var(--surface-border)]">
                        <td className="px-2 py-2">
                          <p className="max-w-[180px] truncate font-semibold">{row.title}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.status}</p>
                        </td>
                        <td className="px-2 py-2">{row.ctrPercent}%</td>
                        <td className="px-2 py-2">{row.dwellAvgSec}s</td>
                        <td className="px-2 py-2">{row.scrollAvgDepth}%</td>
                        <td className="px-2 py-2">{row.shareClicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {analyticsRows.length === 0 ? <p className="px-2 py-3 text-xs text-[var(--text-muted)]">No analytics data yet.</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">API Ops Metrics</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-2 py-2">Endpoint</th>
                      <th className="px-2 py-2">Req</th>
                      <th className="px-2 py-2">Err</th>
                      <th className="px-2 py-2">Reject</th>
                      <th className="px-2 py-2">p95</th>
                      <th className="px-2 py-2">p99</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opsRows.slice(0, 12).map((row) => (
                      <tr key={row.endpoint} className="border-t border-[var(--surface-border)]">
                        <td className="px-2 py-2 text-[10px]">{row.endpoint}</td>
                        <td className="px-2 py-2">{row.count}</td>
                        <td className="px-2 py-2">{row.errors}</td>
                        <td className="px-2 py-2">{row.validationRejected}</td>
                        <td className="px-2 py-2">{row.p95Ms}ms</td>
                        <td className="px-2 py-2">{row.p99Ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {opsRows.length === 0 ? <p className="px-2 py-3 text-xs text-[var(--text-muted)]">No API metrics yet.</p> : null}
              </div>
            </div>

            {growth ? (
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Growth Intelligence</p>
                <p className="mt-2 text-xs text-[var(--text-soft)]">Retention: {growth.retentionRatePercent}%</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded border border-[var(--surface-border)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Cohort (last 14d)</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {growth.cohorts.slice(-7).map((point) => (
                        <p key={point.day}>
                          {point.day}: new {point.newVisitors} | returning {point.returningVisitors}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded border border-[var(--surface-border)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">CTA CTR blocks</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {growth.ctrByCta.slice(0, 6).map((item) => (
                        <p key={item.cta}>
                          {item.cta}: {item.clicks}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded border border-[var(--surface-border)] p-3 text-xs">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Core Web Vitals bands</p>
                  <p className="mt-1">
                    {growth.performanceBands.map((item) => `${item.band}: ${item.count}`).join(' | ')}
                  </p>
                </div>
              </div>
            ) : null}

            {seoGaps ? (
              <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">SEO Gaps Report</p>
                <p className="mt-2 text-xs text-[var(--text-soft)]">
                  Thin: {seoGaps.thinContentCount} | Missing template: {seoGaps.missingTemplateCount} | No internal links: {seoGaps.noInternalLinkCount}
                </p>
                <div className="mt-3 grid gap-2 text-xs">
                  {seoGaps.rows.slice(0, 8).map((row) => (
                    <div key={row.slug} className="rounded border border-[var(--surface-border)] p-2">
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        score {row.seoScore} | words {row.wordCount}
                      </p>
                      {row.gaps.length > 0 ? <p className="mt-1 text-[11px] text-amber-300">{row.gaps.join(' | ')}</p> : <p className="mt-1 text-[11px] text-emerald-300">No critical gaps.</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded border border-[var(--surface-border)] p-3 text-xs">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">Topic coverage</p>
                  <p className="mt-1">{seoGaps.coverage.slice(0, 8).map((item) => `${item.topic}: ${item.totalPosts}`).join(' | ') || 'No coverage data.'}</p>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Editorial Calendar</p>
              <ul className="mt-3 space-y-3">
                {BLOG_EDITORIAL_CALENDAR.map((item) => (
                  <li key={item.period} className="rounded border border-[var(--surface-border)] p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{item.period}</p>
                    <p className="mt-1 text-sm font-semibold">{item.theme}</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">{item.focus}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
