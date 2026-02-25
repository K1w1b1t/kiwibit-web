import { z } from 'zod'

export const skillSchema = z.object({
  name: z.string().min(2).max(60),
  category: z.literal('technical'),
})

export const projectSchema = z.object({
  title: z.string().min(2).max(120),
  image: z.string().url().or(z.string().regex(/^\/uploads\/.+/)),
  href: z.string().url(),
})

export const memberDraftSchema = z.object({
  realName: z.string().min(2).max(80).optional(),
  speciality: z.string().min(2).max(100).optional(),
  bio: z.string().min(20).max(1000).optional(),
  clearance: z.string().min(2).max(20).optional(),
  avatar: z.string().url().or(z.string().regex(/^\/uploads\/.+/)).optional(),
  contactEmail: z.string().email().optional(),
  stack: z.array(z.string().min(1).max(30)).max(20).optional(),
  achievements: z.array(z.string().min(3).max(160)).max(30).optional(),
  skills: z.array(skillSchema).max(30).optional(),
  projects: z.array(projectSchema).max(20).optional(),
})

export const contactSchema = z.object({
  memberId: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
})

export const blogPostInputSchema = z.object({
  slug: z.string().min(2).max(120).optional(),
  title: z.string().min(8).max(180),
  excerpt: z.string().min(20).max(320),
  coverImage: z.string().url().or(z.string().regex(/^\/uploads\/.+/)),
  authorId: z.string().min(1),
  tags: z.array(z.string().min(1).max(40)).min(1).max(12),
  categories: z.array(z.string().min(1).max(40)).min(1).max(6),
  featured: z.boolean(),
  draftContent: z.string().min(60).max(20000),
})

export const blogPostActionSchema = z.object({
  action: z.enum(['save', 'submit_review', 'publish', 'schedule', 'approve', 'preview']),
  slug: z.string().min(1).optional(),
  scheduledFor: z.string().datetime().optional(),
  post: blogPostInputSchema.optional(),
})

export const blogCommentSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(8).max(1200),
})

export const newsletterSchema = z.object({
  email: z.string().email(),
})
