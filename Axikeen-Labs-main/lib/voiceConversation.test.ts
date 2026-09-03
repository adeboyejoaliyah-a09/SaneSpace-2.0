import { describe, expect, it } from 'vitest'
import { getFinalTranscript, getRecognitionLocale } from './voiceConversation'

describe('voice conversation helpers', () => {
  it('extracts only final non-empty transcript results', () => {
    const results = [
      { isFinal: false, 0: { transcript: 'still speaking' } },
      { isFinal: true, 0: { transcript: 'Hello SaneSpace' } },
      { isFinal: true, 0: { transcript: '  ' } },
    ]

    expect(getFinalTranscript(results)).toBe('Hello SaneSpace')
  })

  it('maps language profiles to browser recognition locales', () => {
    expect(getRecognitionLocale('Nigerian Pidgin')).toBe('en-NG')
    expect(getRecognitionLocale('Yoruba')).toBe('yo-NG')
    expect(getRecognitionLocale('Neutral / International')).toBe('en-US')
  })
})