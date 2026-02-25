import type { MetadataRoute } from 'next'
import { MEMBER_IDS } from '@/data/members'
import { listPublishedSlugs } from '@/lib/blog-store'

const BASE_URL = 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogSlugs = await listPublishedSlugs()
  const blogEntries = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  const memberEntries = MEMBER_IDS.map((slug) => ({
    url: `${BASE_URL}/member/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  return [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...blogEntries,
    ...memberEntries,
  ]
}
