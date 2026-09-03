import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, PATCH } from './[id]/route'
import { GET, POST } from './route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { getSessionUser } from '@/lib/auth'
import { isSessionRevoked } from '@/lib/sessionStore'

vi.mock('@/lib/auth', () => ({
  AUTH_COOKIE_NAME: 'sanespace_session',
  getSessionUser: vi.fn(),
}))

const cookieStore = { get: vi.fn(), set: vi.fn() }
vi.mock('next/headers', () => ({ cookies: () => cookieStore }))

const mockedGetSessionUser = vi.mocked(getSessionUser)
const userA = { id: 'route-test-user-a', email: 'a@example.com' }
const userB = { id: 'route-test-user-b', email: 'b@example.com' }

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${url}`, init)
}

function jsonRequest(url: string, body: unknown) {
  return request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function idParams(id: string) {
  return { params: { id } }
}

describe('conversation route authorization', () => {
  beforeEach(() => {
    mockedGetSessionUser.mockReset()
  })

  it('keeps conversation reads isolated by authenticated user', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const created = await POST(jsonRequest('/api/conversations', { title: 'Private thread', mode: 'text' }))
    const conversationId = (await created.json()).conversation.id

    mockedGetSessionUser.mockReturnValue(userB)
    const response = await GET()
    const conversations = (await response.json()).conversations

    expect(response.status).toBe(200)
    expect(conversations.some((conversation: { id: string }) => conversation.id === conversationId)).toBe(false)
  })

  it('rejects cross-user patch and delete attempts', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const created = await POST(jsonRequest('/api/conversations', { title: 'A thread' }))
    const conversationId = (await created.json()).conversation.id

    mockedGetSessionUser.mockReturnValue(userB)
    const patch = await PATCH(jsonRequest(`/api/conversations/${conversationId}`, { title: 'Stolen title' }), idParams(conversationId))
    const deletion = await DELETE(request(`/api/conversations/${conversationId}`, { method: 'DELETE' }), idParams(conversationId))

    expect(patch.status).toBe(404)
    expect(deletion.status).toBe(404)

    mockedGetSessionUser.mockReturnValue(userA)
    const ownList = await GET()
    expect((await ownList.json()).conversations.some((conversation: { title: string }) => conversation.title === 'A thread')).toBe(true)
  })

  it.each([
    ['list', () => GET()],
    ['create', () => POST(jsonRequest('/api/conversations', {}))],
    ['update', () => PATCH(jsonRequest('/api/conversations/missing', { title: 'Nope' }), idParams('missing'))],
    ['delete', () => DELETE(request('/api/conversations/missing', { method: 'DELETE' }), idParams('missing'))],
  ])('rejects unauthenticated %s requests', async (_operation, invoke) => {
    mockedGetSessionUser.mockReturnValue(null)
    const response = await invoke()
    expect(response.status).toBe(401)
  })

  it('assigns ownership from the session and ignores client ownership fields', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const response = await POST(jsonRequest('/api/conversations', {
      userId: userB.id,
      id: 'client-controlled-id',
      title: 'Owned by A',
    }))
    const conversation = (await response.json()).conversation

    expect(response.status).toBe(201)
    expect(conversation.userId).toBe(userA.id)
    expect(conversation.id).not.toBe('client-controlled-id')
  })

  it('persists an authenticated update while keeping its owner', async () => {
    mockedGetSessionUser.mockReturnValue(userA)
    const created = await POST(jsonRequest('/api/conversations', { title: 'Before' }))
    const conversationId = (await created.json()).conversation.id

    const updated = await PATCH(jsonRequest(`/api/conversations/${conversationId}`, { title: 'After' }), idParams(conversationId))
    const conversation = (await updated.json()).conversation

    expect(updated.status).toBe(200)
    expect(conversation.title).toBe('After')
    expect(conversation.userId).toBe(userA.id)
  })
})

describe('conversation access after logout', () => {
  it('revokes the previously valid session token', async () => {
    const token = `route-test-token-${Date.now()}`
    cookieStore.get.mockReturnValue({ value: token })
    mockedGetSessionUser.mockImplementation(() => isSessionRevoked(token) ? null : userA)

    const beforeLogout = await GET()
    expect(beforeLogout.status).toBe(200)

    const response = await logout()

    expect(response.status).toBe(200)
    expect(isSessionRevoked(token)).toBe(true)

    const afterLogout = await GET()
    expect(afterLogout.status).toBe(401)
  })
})
