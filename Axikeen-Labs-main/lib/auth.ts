export const AUTH_COOKIE_NAME = 'sanespace_session'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type SaneUser = {
  id: string
  email?: string
  name?: string
  fullName?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  provider?: string
  createdAt?: string
}

type SessionPayload = {
  sub: string
  email?: string
  name?: string
  firstName?: string
  lastName?: string
  picture?: string
  provider: string
  iat: number
  exp: number
}

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? 'dev-sanespace-auth-secret-change-me'
}

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url')
  }

  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function stringToBase64Url(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input).toString('base64url')
  }

  const bytes = new TextEncoder().encode(input)
  return bytesToBase64Url(bytes)
}

function base64UrlToString(input: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64url').toString('utf8')
  }

  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(normalized + pad)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function signData(secret: string, data: string) {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Web Crypto API is not available in this runtime.')
  }

  const key = await subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signed = await subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return bytesToBase64Url(new Uint8Array(signed))
}

export async function createSessionToken(user: SaneUser) {
  const fallbackName = [user.firstName ?? '', user.lastName ?? ''].join(' ').trim() || user.email || 'SaneSpace user'

  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    name: user.name ?? fallbackName,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.avatarUrl,
    provider: user.provider ?? 'google',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE,
  }

  const header = stringToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = stringToBase64Url(JSON.stringify(payload))
  const signature = await signData(getAuthSecret(), `${header}.${body}`)

  return `${header}.${body}.${signature}`
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, payload, signature] = parts

  try {
    const expectedSignature = await signData(getAuthSecret(), `${header}.${payload}`)
    if (signature !== expectedSignature) return null

    const parsed = JSON.parse(base64UrlToString(payload)) as SessionPayload
    if (!parsed?.sub) return null
    if (typeof parsed.exp === 'number' && Date.now() / 1000 > parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

export async function getSessionUserFromToken(token: string): Promise<SaneUser | null> {
  const payload = await verifySessionToken(token)
  if (!payload) return null

  const firstName = payload.firstName
  const lastName = payload.lastName
  const fallbackName = [firstName ?? '', lastName ?? ''].join(' ').trim() || payload.email || 'SaneSpace user'

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    fullName: payload.name ?? fallbackName,
    firstName,
    lastName,
    avatarUrl: payload.picture,
    provider: payload.provider,
    createdAt: new Date().toISOString(),
  }
}
