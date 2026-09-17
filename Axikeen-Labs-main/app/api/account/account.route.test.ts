import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE } from './route'
import { createConversation, deleteConversation, listConversations } from '@/lib/conversationStore'
import { createReminder, clearReminders, listReminders } from '@/lib/reminderStore'
import { updateUserProfile, deleteUserProfile, getUserProfile } from '@/lib/profileStore'
import { clearUserMemories, upsertUserMemories, listUserMemories } from '@/lib/memoryStore'
import { isSessionRevoked } from '@/lib/sessionStore'
import { getSessionUser } from '@/lib/auth'

const cookieStore = { get: vi.fn(), set: vi.fn() }
vi.mock('next/headers', () => ({ cookies: () => cookieStore }))
vi.mock('@/lib/auth', () => ({
  AUTH_COOKIE_NAME: 'sanespace_session',
  getSessionUser: vi.fn(),
}))

const mockedGetSessionUser = vi.mocked(getSessionUser)
const userA = { id: 'account-delete-user-a', email: 'a@example.com' }
const userB = { id: 'account-delete-user-b', email: 'b@example.com' }
const token = 'account-delete-session-token'

describe('account deletion route', () => {
  beforeEach(async () => {
    mockedGetSessionUser.mockReset()
    cookieStore.get.mockReturnValue({ value: token })
    deleteUserProfile(userA.id)
    deleteUserProfile(userB.id)
    clearUserMemories(userA.id)
    clearUserMemories(userB.id)
    await clearReminders(userA.id)
    await clearReminders(userB.id)
    for (const userId of [userA.id, userB.id]) {
      for (const conversation of listConversations(userId)) deleteConversation(userId, conversation.id)
    }
  })

  it('deletes all persistent records owned by the authenticated user and revokes their session', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    updateUserProfile(userA.id, { firstName: 'A', onboardingComplete: true })
    createConversation(userA.id, { title: 'Private thread' })
    await createReminder({ userId: userA.id, title: 'Private reminder', dueAt: new Date(Date.now() + 1000).toISOString() })
    upsertUserMemories(userA.id, [{ memoryType: 'pattern', category: 'work', content: 'Private memory', confidenceScore: 0.8, source: 'chat' }])
    updateUserProfile(userB.id, { firstName: 'B', onboardingComplete: true })
    createConversation(userB.id, { title: 'Keep this thread' })

    const response = await DELETE()

    expect(response.status).toBe(200)
    expect(getUserProfile(userA.id)).toBeNull()
    expect(listConversations(userA.id)).toEqual([])
    expect(await listReminders(userA.id)).toEqual([])
    expect(listUserMemories(userA.id)).toEqual([])
    expect(isSessionRevoked(token)).toBe(true)
    expect(getUserProfile(userB.id)?.firstName).toBe('B')
    expect(listConversations(userB.id)).toHaveLength(1)
  })

  it('rejects unauthenticated deletion', async () => {
    mockedGetSessionUser.mockReturnValue(null)
    const response = await DELETE()
    expect(response.status).toBe(401)
  })

  it('uses the session identity and never accepts a client ownership override', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    updateUserProfile(userB.id, { firstName: 'B', onboardingComplete: true })
    const response = await DELETE()
    expect(response.status).toBe(200)
    expect(getUserProfile(userB.id)?.firstName).toBe('B')
  })

  it('reports deletion failures instead of claiming success', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const accountStore = await import('@/lib/accountStore')
    const spy = vi.spyOn(accountStore, 'deleteAccount').mockImplementation(() => { throw new Error('database unavailable') })
    const response = await DELETE()
    expect(response.status).toBe(500)
    expect((await response.json()).success).not.toBe(true)
    spy.mockRestore()
  })
})