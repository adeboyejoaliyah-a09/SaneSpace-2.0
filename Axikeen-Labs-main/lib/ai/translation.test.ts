import { afterEach, describe, expect, it, vi } from 'vitest'
import { adaptResponseForLanguage } from './translation'
import { buildCareModeResponse } from '@/lib/careMode'

afterEach(() => vi.unstubAllGlobals())

describe('language and cultural adaptation', () => {
  it('keeps global English and Nigerian register responses in the original pipeline output', async () => {
    expect(await adaptResponseForLanguage('A clear response.', 'Neutral / International')).toBe('A clear response.')
    expect(await adaptResponseForLanguage('I hear you, abeg.', 'Nigerian Pidgin')).toBe('I hear you, abeg.')
  })

  it.each(['Yoruba', 'Hausa', 'Igbo', 'French', 'Spanish', 'Arabic'])('uses the optional translation provider for %s', async (language) => {
    process.env.LIBRETRANSLATE_BASE_URL = 'https://translate.test/translate'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ translatedText: 'Translated response' }), { status: 200 })))
    await expect(adaptResponseForLanguage('Original response.', language)).resolves.toBe('Translated response')
  })

  it('falls back to the provider response when translation is unavailable', async () => {
    process.env.LIBRETRANSLATE_BASE_URL = 'https://translate.test/translate'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('translation unavailable')))
    await expect(adaptResponseForLanguage('Original response.', 'Yoruba')).resolves.toBe('Original response.')
  })

  it('does not remove crisis guidance when optional translation is unavailable', async () => {
    process.env.LIBRETRANSLATE_BASE_URL = ''
    const safetyResponse = buildCareModeResponse({
      userMessage: 'I want to die', riskScore: 100, riskLevel: 'critical',
      languageProfileDetected: 'Yoruba', triggersDetected: ['want to die'], memoryUsed: [],
    })
    await expect(adaptResponseForLanguage(safetyResponse.message, 'Yoruba')).resolves.toContain('MANI')
  })
})