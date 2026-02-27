import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }).toString('hex')
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived}`
}

export function isHashedPassword(value: string) {
  return value.startsWith('scrypt$')
}

export function verifyPassword(password: string, stored: string) {
  if (!isHashedPassword(stored)) {
    return { ok: stored === password, needsRehash: stored === password }
  }

  const parts = stored.split('$')
  if (parts.length !== 6) return { ok: false, needsRehash: false }
  const [, nRaw, rRaw, pRaw, salt, hash] = parts
  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !hash) {
    return { ok: false, needsRehash: false }
  }
  const derived = scryptSync(password, salt, KEY_LEN, { N: n, r, p }).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(derived, 'hex')
  if (a.length !== b.length) return { ok: false, needsRehash: false }
  const ok = timingSafeEqual(a, b)
  const needsRehash = ok && (n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P)
  return { ok, needsRehash }
}
