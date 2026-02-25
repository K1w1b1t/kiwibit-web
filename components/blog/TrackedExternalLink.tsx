'use client'

import type { ReactNode } from 'react'

type TrackedExternalLinkProps = {
  href: string
  slug: string
  className?: string
  children: ReactNode
}

export default function TrackedExternalLink({ href, slug, className, children }: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
      onClick={() => {
        void fetch('/api/blog/analytics/track', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'post_cta_click', slug }),
        })
      }}
    >
      {children}
    </a>
  )
}
