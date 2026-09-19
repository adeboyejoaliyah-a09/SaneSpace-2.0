import { afterEach, describe, expect, it, vi } from 'vitest'
import { LANGUAGE_DEFINITIONS } from './languages'
import { getRecognitionLocale } from './voiceConversation'
import { playAudioElement, speakWithBrowser } from './voiceOutput'

afterEach(() => vi.unstubAllGlobals())

describe('voice output', () => {
  it('sends the final response and locale to browser speech synthesis', async () => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
    })

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        rate = 1
        voice?: SpeechSynthesisVoice
        onstart: (() => void) | null = null
        onend: ((event: SpeechSynthesisEvent) => void) | null = null
        onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null

        constructor(value: string) {
          this.text = value
        }
      },
    )

    vi.stubGlobal('window', {
      speechSynthesis: {
        getVoices: () => [],
        cancel: vi.fn(),
        resume: vi.fn(),
        speak,
      },
    })

    await expect(
      speakWithBrowser('Respuesta final.', 'es-MX'),
    ).resolves.toBe(true)

    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0][0]).toMatchObject({
      text: 'Respuesta final.',
      lang: 'es-MX',
    })
  })

  it('reports browser speech failure without rejecting the conversation', async () => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) =>
      utterance.onerror?.(new Event('error') as SpeechSynthesisErrorEvent),
    )

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        onstart: (() => void) | null = null
        onend: ((event: SpeechSynthesisEvent) => void) | null = null
        onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null

        constructor(value: string) {
          this.text = value
        }
      },
    )

    vi.stubGlobal('window', {
      speechSynthesis: {
        getVoices: () => [],
        cancel: vi.fn(),
        resume: vi.fn(),
        speak,
      },
    })

    await expect(
      speakWithBrowser('Response.', 'en-US'),
    ).resolves.toBe(false)
  })

  it.each(LANGUAGE_DEFINITIONS)('keeps voice locale aligned for %s', async (language) => {
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      utterance.onend?.(new Event('end') as SpeechSynthesisEvent)
    })

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string
        lang = ''
        rate = 1
        voice?: SpeechSynthesisVoice
        onstart: (() => void) | null = null
        onend: ((event: SpeechSynthesisEvent) => void) | null = null
        onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null

        constructor(value: string) {
          this.text = value
        }
      },
    )

    vi.stubGlobal('window', {
      speechSynthesis: {
        getVoices: () => [],
        cancel: vi.fn(),
        resume: vi.fn(),
        speak,
      },
    })

    const message = language.id === 'english'
      ? 'Let’s plan the week together.'
      : language.id === 'nigerian-pidgin'
        ? 'Abeg, make we plan the week well.'
        : language.id === 'nigerian-english'
          ? 'Let’s plan the week properly, no wahala.'
          : language.id === 'lagos-english'
            ? 'How far, make we plan the week well.'
            : language.id === 'yoruba'
              ? 'Jẹ́ ká pèsè eto ọsẹ wa ni ọ̀rọ̀.'
              : language.id === 'hausa'
                ? 'Mu shirya mako tare da kyau.'
                : language.id === 'igbo'
                  ? 'Ka anyị haziri izu anyị n’ụzọ ziri ezi.'
                  : 'Let’s plan the week together.'

    await expect(speakWithBrowser(message, language.locale)).resolves.toBe(true)
    expect(getRecognitionLocale(language.id)).toBe(language.locale)
    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0][0]).toMatchObject({
      text: message,
      lang: language.locale,
    })
  })

  it('resets audio completion on success and failure', async () => {
    const audio = {
      src: '',
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      play: vi.fn().mockResolvedValue(undefined),
    } as unknown as HTMLAudioElement

    const success = playAudioElement(audio, 'blob:response')

    audio.onended?.(new Event('ended'))

    await expect(success).resolves.toBe(true)

    const failedAudio = {
      src: '',
      onended: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      play: vi.fn().mockRejectedValue(new Error('blocked')),
    } as unknown as HTMLAudioElement

    await expect(
      playAudioElement(failedAudio, 'blob:failed'),
    ).resolves.toBe(false)
  })
})