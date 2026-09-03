import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Message } from '@/lib/types'
import { persistVoiceConversation, requestVoiceChat, requestVoiceTts } from './voiceTransport'

const message: Message = {
  id: 'user-message',
  conversationId: 'voice-conversation',
  sender: 'user',
  content: 'Help me plan my week',
  adaptiveMode: 'listening',
  timestamp: '2026-09-03T00:00:00.000Z',
}

afterEach(() => vi.unstubAllGlobals())

describe('voice transport', () => {
  it('sends the final transcript through the existing chat API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Let us plan it together.' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestVoiceChat({ messages: [message], specialisation: 'Life Coaching', languageProfile: 'Neutral / International', userName: 'Ada' })).resolves.toMatchObject({ message: 'Let us plan it together.' })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ messages: [message], activeMode: 'listening' })
  })

  it('surfaces failed chat requests, including authentication failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 401 })))
    await expect(requestVoiceChat({ messages: [message], specialisation: '', languageProfile: 'Neutral / International', userName: 'Ada' })).rejects.toThrow('session expired')
  })

  it('persists the completed user and assistant message list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const assistant = { ...message, id: 'assistant-message', sender: 'ai' as const, content: 'Here is a plan.' }
    await expect(persistVoiceConversation('voice-conversation', [message, assistant])).resolves.toBeUndefined()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/conversations/voice-conversation')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages).toHaveLength(2)
  })

  it('returns TTS audio and reports missing credentials without breaking chat', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('audio', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestVoiceTts('Here is your response.', 'voice-id')).resolves.toBeInstanceOf(Blob)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'not configured' }), { status: 503 })))
    await expect(requestVoiceTts('Here is your response.', 'voice-id')).rejects.toThrow('not configured')
  })
})