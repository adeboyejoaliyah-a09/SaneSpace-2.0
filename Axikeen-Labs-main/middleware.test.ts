import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { createSessionToken } from '@/lib/auth'
import { isSessionRevoked, revokeSession } from '@/lib/sessionStore'

process.env.AUTH_SECRET = 'middleware-test-secret'

describe('middleware session revocation', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'middleware-test-secret'
    vi.restoreAllMocks()
  })

  it('allows a valid session after server-side session confirmation', async () => {
    const token = createSessionToken({ id: 'middleware-user' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { id: 'middleware-user' } }), { status: 200 })))
    const response = await middleware(new NextRequest('http://localhost/dashboard', { headers: { cookie: `sanespace_session=${token}` } }))
    expect(response.headers.get('location')).toBeNull()
  })

  it('redirects when the same signed token has been revoked', async () => {
    const token = createSessionToken({ id: 'middleware-user' })
    revokeSession(token)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: null }), { status: 200 })))
    const response = await middleware(new NextRequest('http://localhost/dashboard', { headers: { cookie: `sanespace_session=${token}` } }))
    expect(response.headers.get('location')).toContain('/sign-in')
    expect(isSessionRevoked(token)).toBe(true)
  })

  it('redirects invalid and expired sessions', async () => {
    const invalid = await middleware(new NextRequest('http://localhost/dashboard', { headers: { cookie: 'sanespace_session=tampered' } }))
    expect(invalid.headers.get('location')).toContain('/sign-in')

    const expired = createSessionToken({ id: 'middleware-user' })
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000)
    const expiredResponse = await middleware(new NextRequest('http://localhost/dashboard', { headers: { cookie: `sanespace_session=${expired}` } }))
    vi.useRealTimers()
    expect(expiredResponse.headers.get('location')).toContain('/sign-in')
  })
})