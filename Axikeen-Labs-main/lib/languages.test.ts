import { describe, expect, it } from 'vitest'
import { getLanguageCapabilities, getLanguageDefinition, getLanguageLocale, normalizeLanguageId, resolveLanguagePreference } from './languages'

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
})