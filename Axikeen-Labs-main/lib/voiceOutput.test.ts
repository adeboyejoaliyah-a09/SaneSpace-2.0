import { afterEach, describe, expect, it, vi } from 'vitest'
import { playAudioElement, speakWithBrowser } from './voiceOutput'

afterEach(() => vi.unstubAllGlobals())

describe('voice output', () => {
  it('sends the final response and locale to browser speech synthesis', async () => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => utterance.onend?.(new Event('end')))
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string
      lang = ''
      rate = 1
      voice?: SpeechSynthesisVoice
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(value: string) { this.text = value }
    })
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => [], cancel: vi.fn(), resume: vi.fn(), speak } })

    await expect(speakWithBrowser('Respuesta final.', 'es-MX')).resolves.toBe(true)
    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0][0]).toMatchObject({ text: 'Respuesta final.', lang: 'es-MX' })
  })

  it('reports browser speech failure without rejecting the conversation', async () => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => utterance.onerror?.(new Event('error')))
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; onstart = null; onend = null; onerror: (() => void) | null = null; constructor(value: string) { this.text = value } })
    vi.stubGlobal('window', { speechSynthesis: { getVoices: () => [], cancel: vi.fn(), resume: vi.fn(), speak } })
    await expect(speakWithBrowser('Response.', 'en-US')).resolves.toBe(false)
  })

  it('resets audio completion on success and failure', async () => {
    const audio = { src: '', onended: null as (() => void) | null, onerror: null as (() => void) | null, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLAudioElement
    const success = playAudioElement(audio, 'blob:response')
    audio.onended?.()
    await expect(success).resolves.toBe(true)

    const failedAudio = { src: '', onended: null, onerror: null, play: vi.fn().mockRejectedValue(new Error('blocked')) } as unknown as HTMLAudioElement
    await expect(playAudioElement(failedAudio, 'blob:failed')).resolves.toBe(false)
  })
})