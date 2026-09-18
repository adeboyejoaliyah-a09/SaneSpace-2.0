export type SessionUser = {
  id: string
  email?: string
  name?: string
  firstName?: string
}

export const AUTH_COOKIE_NAME = 'sanespace_session'

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'development-sanespace-auth-secret')
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured')
  }
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  )

  return toBase64Url(new Uint8Array(signature))
}

export async function verifySessionToken(
  token: string | null | undefined
): Promise<SessionUser | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encodedPayload, signature] = parts
  if (!encodedPayload || !signature) return null

  const secret = getAuthSecret()
  const expected = await signPayload(encodedPayload, secret)

  if (expected !== signature) return null

  try {
    const decoded = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload))
    ) as {
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