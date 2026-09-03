import type { Message } from '@/lib/types'

export type VoiceChatResponse = {
  message?: string
  detectedMode?: string
}

export async function requestVoiceChat(input: {
  messages: Message[]
  specialisation: string
  languageProfile: string
  userName: string
}): Promise<VoiceChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, activeMode: 'listening' }),
  })
  const data = await response.json().catch(() => ({})) as VoiceChatResponse
  if (!response.ok || !data.message) {
    const error = new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : 'SaneSpace could not respond right now.') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return data
}

export async function persistVoiceConversation(conversationId: string, messages: Message[]) {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!response.ok) throw new Error('Conversation persistence failed')
}

export async function requestVoiceTts(text: string, voiceId: string, languageCode?: string): Promise<Blob> {
  const response = await fetch('/api/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId, languageCode }),
  })
  if (!response.ok) {
    const error = new Error(response.status === 503 ? 'Enhanced audio is not configured.' : 'Audio playback failed.') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  const audio = await response.blob()
  if (audio.size === 0) throw new Error('Audio playback failed.')
  return audio
}