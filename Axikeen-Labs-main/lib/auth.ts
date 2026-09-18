import crypto from 'crypto'
import { cookies } from 'next/headers'
import { isSessionRevoked } from '@/lib/sessionStore'

export type SessionUser = {
  id: string
  email?: string
  name?: string
  firstName?: string
}

export const AUTH_COOKIE_NAME = 'sanespace_session'
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'development-sanespace-auth-secret')
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured')
  }
  return secret
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + pad, 'base64').toString('utf8')
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export function createSessionToken(user: SessionUser): string {
  const secret = getAuthSecret()

  const payload = {
    jti: crypto.randomUUID(),
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
    firstName: user.firstName ?? null,
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload, secret)

  return `${encodedPayload}.${signature}`
}

export function verifySessionToken(token: string | null | undefined): SessionUser | null {
  if (!token) return null
  if (isSessionRevoked(token)) return null

  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const secret = getAuthSecret()
  const expected = signPayload(encodedPayload, secret)

  try {
    const actual = Buffer.from(signature)
    const expectedBuf = Buffer.from(expected)
    if (actual.length !== expectedBuf.length) return null
    if (!crypto.timingSafeEqual(actual, expectedBuf)) return null
  } catch {
    return null
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(encodedPayload)) as {
      id?: string
      email?: string | null
      name?: string | null
      firstName?: string | null
      exp?: number
    }

    if (!decoded.id) return null
    if (typeof decoded.exp === 'number' && Date.now() >= decoded.exp) return null

    return {
      id: String(decoded.id),
      email: decoded.email ?? undefined,
      name: decoded.name ?? undefined,
      firstName: decoded.firstName ?? undefined,
    }
  } catch {
    return null
  }
}

export function getSessionUserFromToken(token: string | null | undefined): SessionUser | null {
  return verifySessionToken(token)
}

export function getSessionUser(): SessionUser | null {
  const cookieStore = cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  return getSessionUserFromToken(token)
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = getSessionUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
