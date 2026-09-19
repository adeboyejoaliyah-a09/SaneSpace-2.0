import { beforeEach, describe, expect, it } from 'vitest'
import { createSessionToken } from './auth'
import { verifySessionToken } from './auth-edge'

process.env.AUTH_SECRET = 'edge-test-secret'

describe('edge session verification', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'edge-test-secret'
  })

  it('accepts a valid signed session', async () => {
    const token = createSessionToken({ id: 'edge-user' })
    await expect(verifySessionToken(token)).resolves.toMatchObject({ id: 'edge-user' })
  })

  it('rejects malformed and tampered sessions', async () => {
    const token = createSessionToken({ id: 'edge-user' })
    await expect(verifySessionToken(`${token}x`)).resolves.toBeNull()
    await expect(verifySessionToken('not-a-session')).resolves.toBeNull()
  })

  it('rejects expired sessions', async () => {
    const payload = Buffer.from(JSON.stringify({ id: 'edge-user', exp: Date.now() - 1 })).toString('base64url')
    await expect(verifySessionToken(`${payload}.invalid`)).resolves.toBeNull()
  })
})