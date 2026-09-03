import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { clearMoodEntries, listMoodEntries } from '@/lib/moodStore'
import { getSessionUser } from '@/lib/auth'

vi.mock('@/lib/auth', () => ({ getSessionUser: vi.fn() }))
const mockedGetSessionUser = vi.mocked(getSessionUser)
const userA = { id: 'mood-route-a' }
const userB = { id: 'mood-route-b' }

function body(value: unknown) {
  return new NextRequest('http://localhost/api/mood', { method: 'POST', body: JSON.stringify(value), headers: { 'content-type': 'application/json' } })
}

describe('mood route authorization and persistence', () => {
  beforeEach(() => {
    clearMoodEntries(userA.id)
    clearMoodEntries(userB.id)
    mockedGetSessionUser.mockReset()
  })

  it('rejects unauthenticated access', async () => {
    mockedGetSessionUser.mockReturnValue(null)
    expect((await GET()).status).toBe(401)
    expect((await POST(body({ mood: 'Good' }))).status).toBe(401)
  })

  it('creates and retrieves only the authenticated user entries', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const created = await POST(body({ mood: 'Good', triggerTag: 'Work', note: 'A note', date: '2026-09-03T10:00:00.000Z' }))
    expect(created.status).toBe(201)
    expect(listMoodEntries(userA.id)).toHaveLength(1)

    mockedGetSessionUser.mockReturnValue(userB)
    const other = await GET()
    expect((await other.json()).entries).toEqual([])
  })

  it('rejects invalid moods', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    expect((await POST(body({ mood: 'clinical-score' }))).status).toBe(400)
    expect((await POST(body({ mood: 'Good', date: 'not-a-date' }))).status).toBe(400)
  })

  it('updates the authenticated user\'s existing same-day check-in', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const first = await POST(body({ mood: 'Okay', date: '2026-09-03T10:00:00.000Z' }))
    const second = await POST(body({ mood: 'Great', date: '2026-09-03T18:00:00.000Z' }))
    expect(first.status).toBe(201)
    expect(second.status).toBe(200)
    expect((await second.json()).entries).toHaveLength(1)
    expect(listMoodEntries(userA.id)[0].mood).toBe('Great')
  })
})