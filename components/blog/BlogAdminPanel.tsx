'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseMarkdown } from '@/lib/markdown'

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

function emptyPost(authorId: string): AdminPost {
  return {
    slug: '',
    title: '',
    excerpt: '',
    coverImage: '',
    authorId,
    tags: [],
    categories: [],
    featured: false,
    status: 'draft',
    draftContent: '',
  }
}

export default function BlogAdminPanel() {
  const router = useRouter()
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [memberId, setMemberId] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [form, setForm] = useState<AdminPost | null>(null)
  const [feedback, setFeedback] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([])

  const parsedPreview = useMemo(() => {
    if (!form) return []
    return parseMarkdown(form.draftContent).blocks
  }, [form])

  async function loadSessionAndData() {
    const auth = await fetch('/api/auth/me')
    if (!auth.ok) {
      router.push('/login')
      return
    }
    const authData = (await auth.json()) as { csrfToken: string; memberId: string; role: 'member' | 'admin' }
    setCsrfToken(authData.csrfToken)
    setMemberId(authData.memberId)
    setRole(authData.role)

    const postResponse = await fetch('/api/admin/posts')
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

    if (authData.role === 'admin') {
      const commentsResponse = await fetch('/api/admin/blog/comments')
      if (commentsResponse.ok) {
        const commentsData = (await commentsResponse.json()) as { comments: PendingComment[] }
        setPendingComments(commentsData.comments)
      }
    }
  }

  useEffect(() => {
    void loadSessionAndData()
  }, [])

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
    const response = await fetch('/api/admin/posts')
    if (!response.ok) return
    const data = (await response.json()) as { posts: AdminPost[] }
    setPosts(data.posts)
    if (selectedSlug) {
      const found = data.posts.find((post) => post.slug === selectedSlug)
      if (found) setForm(found)
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
    const data = (await response.json()) as { ok?: boolean; post?: AdminPost; previewUrl?: string; error?: string }
    if (!response.ok) {
      setFeedback(data.error ?? 'Action failed.')
      return
    }
    if (data.previewUrl) setPreviewUrl(data.previewUrl)
    if (data.post) {
      setForm(data.post)
      await refreshPosts()
    }
    setFeedback(`Action ${action} completed.`)
  }

  async function moderateComment(commentId: string, status: 'approved' | 'rejected') {
    const response = await secureFetch('/api/admin/blog/comments', {
      method: 'POST',
      body: JSON.stringify({ commentId, status }),
    })
    if (!response.ok) return
    setPendingComments((items) => items.filter((item) => item.id !== commentId))
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
              <input value={form.categories.join(', ')} onChange={(e) => setForm({ ...form, categories: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Categories (comma separated)" className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />
              <textarea value={form.draftContent} onChange={(e) => setForm({ ...form, draftContent: e.target.value })} rows={16} className="w-full rounded border border-[var(--surface-border)] bg-black/30 px-3 py-2 text-sm" />

              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded border border-[var(--text-main)] px-4 py-2 text-xs uppercase tracking-[0.14em]">Save</button>
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
            </form>
          </section>

          <section className="space-y-6">
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
          </section>
        </div>
      </div>
    </main>
  )
}
