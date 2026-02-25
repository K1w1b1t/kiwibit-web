import { promises as fs } from 'fs'
import path from 'path'
import { isDatabaseEnabled, isDatabaseStrict, prisma } from '@/lib/prisma'

const STORE_PATH = path.join(process.cwd(), 'data', 'member-overrides.json')

type StoreShape = {
  members?: Record<
    string,
    {
      moderationStatus?: string
      pendingAt?: string
    }
  >
}

export async function listPendingMembers() {
  if (isDatabaseEnabled()) {
    const rows = await prisma.memberProfileState.findMany({
      where: { moderationStatus: 'pending_review' },
      select: { memberId: true, pendingAt: true },
      orderBy: { pendingAt: 'asc' },
    })
    return rows.map((row) => ({
      memberId: row.memberId,
      pendingAt: row.pendingAt?.toISOString() ?? null,
    }))
  }
  if (isDatabaseStrict()) {
    throw new Error('DB_STRICT is enabled but DATABASE_URL is not configured')
  }

  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as StoreShape
    const members = parsed.members ?? {}
    return Object.entries(members)
      .filter(([, value]) => value?.moderationStatus === 'pending_review')
      .map(([memberId, value]) => ({ memberId, pendingAt: value?.pendingAt ?? null }))
  } catch {
    return []
  }
}
