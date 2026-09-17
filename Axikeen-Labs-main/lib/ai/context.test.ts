import { describe, expect, it } from 'vitest'
import { buildContextBundle } from './context'

const message = {
  id: 'context-message', conversationId: 'context-conversation', sender: 'user' as const,
  content: 'Help me plan my week', adaptiveMode: 'listening' as const, timestamp: '2026-09-03T00:00:00.000Z',
}

describe('language and cultural context separation', () => {
  it('keeps global English neutral rather than applying Nigerian-only context', () => {
    const bundle = buildContextBundle({ messages: [message], languageProfile: 'Global English', specialisation: 'Just to Talk' })
    expect(bundle.languageProfile).toBe('english')
    expect(bundle.culturalContext).toContain('global users')
    expect(bundle.culturalContext).not.toContain('Nigerian English')
    expect(bundle.userContext).toContain('Personality/specialisation: Just to Talk')
  })

  it('keeps Nigerian language context as explicit soft guidance', () => {
    const bundle = buildContextBundle({ messages: [message], languageProfile: 'Nigerian Pidgin' })
    expect(bundle.languageProfile).toBe('nigerian-pidgin')
    expect(bundle.culturalContext).toContain('Nigerian English')
    expect(bundle.culturalContext).toContain('without forcing slang')
  })

  it('surfaces the user recent mood check-in in emotional context', () => {
    const bundle = buildContextBundle({
      messages: [message],
      languageProfile: 'Global English',
      recentMood: { mood: 'Low', triggerTag: 'Deadlines', date: '2026-09-03T08:00:00.000Z' },
    })
    expect(bundle.emotionalContext).toContain('Low')
    expect(bundle.emotionalContext).toContain('Deadlines')
  })

  it('omits mood context when no check-in exists', () => {
    const bundle = buildContextBundle({ messages: [message], languageProfile: 'Global English' })
    expect(bundle.emotionalContext).not.toContain('checked in feeling')
  })
})