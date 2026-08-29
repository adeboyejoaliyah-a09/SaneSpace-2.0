export const AUTH_COOKIE_NAME = 'sanespace_session'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const MIN_AUTH_SECRET_LENGTH = 32
const MAX_CLOCK_SKEW_SECONDS = 60

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
  const secret = process.env.AUTH_SECRET?.trim()
  if (!secret || secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters long.')
  }
  return secret
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

function base64UrlToBytes(input: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(input, 'base64url'))
  }

  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(normalized + pad)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function isSafeBase64Url(input: string) {
  return /^[A-Za-z0-9_-]+$/.test(input)
}

function signaturesMatch(actual: string, expected: string) {
  try {
    const actualBytes = base64UrlToBytes(actual)
    const expectedBytes = base64UrlToBytes(expected)
    if (actualBytes.byteLength !== expectedBytes.byteLength) return false
    let diff = 0
    for (let i = 0; i < expectedBytes.byteLength; i += 1) {
      diff |= actualBytes[i] ^ expectedBytes[i]
    }
    return diff === 0
  } catch {
    return false
  }
}

function isValidPayload(payload: SessionPayload): payload is SessionPayload {
  const now = Math.floor(Date.now() / 1000)
  if (!payload || typeof payload !== 'object') return false
  if (typeof payload.sub !== 'string' || !payload.sub.trim() || payload.sub.length > 128) return false
  if (typeof payload.provider !== 'string' || !payload.provider.trim() || payload.provider.length > 40) return false
  if (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat)) return false
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return false
  if (payload.iat > now + MAX_CLOCK_SKEW_SECONDS) return false
  if (payload.exp <= now - MAX_CLOCK_SKEW_SECONDS) return false
  if (payload.exp <= payload.iat) return false
  if (payload.exp - payload.iat > AUTH_COOKIE_MAX_AGE + MAX_CLOCK_SKEW_SECONDS) return false
  return true
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
  if (!header || !payload || !signature) return null
  if (![header, payload, signature].every(isSafeBase64Url)) return null

  try {
    const parsedHeader = JSON.parse(base64UrlToString(header)) as { alg?: string; typ?: string }
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT') return null

    const expectedSignature = await signData(getAuthSecret(), `${header}.${payload}`)
    if (!signaturesMatch(signature, expectedSignature)) return null

    const parsed = JSON.parse(base64UrlToString(payload)) as SessionPayload
    if (!isValidPayload(parsed)) return null
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
