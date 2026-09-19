import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildContextBundle } from './ai/context'
import { adaptResponseForLanguage } from './ai/translation'
import { LANGUAGE_DEFINITIONS, getLanguageCapabilities, getLanguageDefinition, getLanguageLocale, normalizeLanguageId, resolveLanguagePreference } from './languages'

const message = {
  id: 'lang-message', conversationId: 'lang-conversation', sender: 'user' as const,
  content: 'Help me plan my week and keep it realistic.', adaptiveMode: 'listening' as const, timestamp: '2026-09-03T00:00:00.000Z',
}

afterEach(() => vi.unstubAllGlobals())

describe('global language configuration', () => {
  it.each([
    ['pidgin', 'nigerian-pidgin'], ['nigerian_english', 'nigerian-english'], ['english', 'english'],
    ['Yoruba', 'yoruba'], ['Hausa', 'hausa'], ['Igbo', 'igbo'], ['Simplified Chinese', 'chinese-simplified'],
    ['Traditional Chinese', 'chinese-traditional'], ['Japanese', 'japanese'], ['Korean', 'korean'],
    ['Portuguese (Brazil)', 'portuguese-brazil'], ['Portuguese (Portugal)', 'portuguese-portugal'],
    ['Hindi', 'hindi'], ['Arabic', 'arabic'], ['not-a-language', 'english'],
  ])('normalizes %s to %s', (input, expected) => expect(normalizeLanguageId(input)).toBe(expected))

  it.each([
    ['english', 'en-US'], ['nigerian-english', 'en-NG'], ['nigerian-pidgin', 'en-NG'], ['yoruba', 'yo-NG'],
    ['hausa', 'ha-NG'], ['igbo', 'ig-NG'], ['chinese-simplified', 'zh-CN'], ['chinese-traditional', 'zh-TW'],
    ['japanese', 'ja-JP'], ['korean', 'ko-KR'], ['portuguese-brazil', 'pt-BR'], ['portuguese-portugal', 'pt-PT'],
  ])('maps %s to %s', (input, expected) => expect(getLanguageLocale(input)).toBe(expected))

  it('keeps Chinese variants and cultural metadata distinct', () => {
    expect(getLanguageDefinition('zh-CN').id).toBe('chinese-simplified')
    expect(getLanguageDefinition('zh-TW').id).toBe('chinese-traditional')
    expect(getLanguageDefinition('english').culturalContext).toBe('neutral')
    expect(getLanguageDefinition('nigerian-pidgin').culturalContext).toBe('nigerian')
  })

  it('prefers the saved server profile over local fallback values', () => {
    expect(resolveLanguagePreference('spanish', 'english')).toBe('spanish')
    expect(resolveLanguagePreference('nigerian-pidgin', 'yoruba')).toBe('nigerian-pidgin')
  })

  it('uses localStorage values only as a temporary fallback when the profile is absent', () => {
    expect(resolveLanguagePreference(null, 'hausa')).toBe('hausa')
    expect(resolveLanguagePreference(undefined, 'Neutral / International')).toBe('english')
  })

  it('separates catalog identity from provider and voice capabilities', () => {
    expect(getLanguageCapabilities('Yoruba')).toMatchObject({ languageId: 'yoruba', locale: 'yo-NG', supportedByProvider: 'provider-dependent', supportedByLibreTranslate: true, voiceRecognition: 'best-effort-locale' })
    expect(getLanguageCapabilities('Global English')).toMatchObject({ languageId: 'english', supportedByLibreTranslate: false, culturalContext: 'neutral' })
  })

  it.each(LANGUAGE_DEFINITIONS)('keeps runtime context aligned for %s', (language) => {
    const bundle = buildContextBundle({
      messages: [message],
      languageProfile: language.label,
      specialisation: 'Just to Talk',
    })

    expect(bundle.languageProfile).toBe(language.id)
    expect(bundle.locale).toBe(language.locale)
    expect(bundle.userContext).toContain('Personality/specialisation: Just to Talk')
    expect(bundle.culturalContext).toContain('context')

    if (language.id === 'english') {
      expect(bundle.culturalContext).toContain('global users')
      expect(bundle.culturalContext).not.toContain('Nigerian English')
    }

    if (language.culturalContext === 'nigerian') {
      expect(bundle.culturalContext).toContain('Nigerian')
    }
  })

  it('keeps neutral global English from injecting Nigerian cultural assumptions', () => {
    const bundle = buildContextBundle({
      messages: [{ ...message, content: 'Abeg, I need help planning my week without the extra pressure.' }],
      languageProfile: 'Global English',
      specialisation: 'Life Coaching',
    })

    expect(bundle.languageProfile).toBe('english')
    expect(bundle.culturalContext).toContain('global users')
    expect(bundle.culturalContext).not.toContain('Nigerian English')
    expect(bundle.culturalContext).not.toContain('Nigerian Pidgin')
  })

  it.each(LANGUAGE_DEFINITIONS.filter((language) => language.translationTarget))('uses translation without losing meaning for %s', async (language) => {
    process.env.LIBRETRANSLATE_BASE_URL = 'https://translate.test/translate'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ translatedText: 'Translated response' }), { status: 200 })))
    await expect(adaptResponseForLanguage('I’m with you and I’ll help you plan well.', language.label)).resolves.toBe('Translated response')
    await expect(adaptResponseForLanguage('I hear you, abeg.', 'Nigerian Pidgin')).resolves.toBe('I hear you, abeg.')
  })
})