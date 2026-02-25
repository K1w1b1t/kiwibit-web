import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MemberPanel from '@/components/member/MemberPanel'
import { MEMBER_IDS, MEMBERS_BY_ID } from '@/data/members'
import { getPublishedMemberById } from '@/lib/member-store'

const SITE_URL = 'http://localhost:3000'

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return MEMBER_IDS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  if (!MEMBER_IDS.includes(slug)) {
    return {
      title: 'Member Not Found | KIWI BIT',
      description: 'Requested member profile was not found.',
    }
  }

  const member = (await getPublishedMemberById(slug)) ?? MEMBERS_BY_ID[slug]
  const title = `${member.realName} | KIWI BIT Member`
  const description = `${member.speciality}. ${member.bio}`
  const canonical = `${SITE_URL}/member/${member.id}`
  const ogImage = `${member.avatar}&w=1200&h=630`

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: member.codename,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { slug } = await params

  if (!MEMBER_IDS.includes(slug)) {
    notFound()
  }

  const member = (await getPublishedMemberById(slug)) ?? MEMBERS_BY_ID[slug]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.realName,
    alternateName: member.codename,
    description: member.bio,
    image: member.avatar,
    jobTitle: member.speciality,
    worksFor: {
      '@type': 'Organization',
      name: 'KIWI BIT',
      url: SITE_URL,
    },
    url: `${SITE_URL}/member/${member.id}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MemberPanel initialMemberId={slug} initialMemberData={member} />
    </>
  )
}
