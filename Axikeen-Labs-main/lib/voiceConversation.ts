export type VoiceRecognitionResult = {
  isFinal?: boolean
  0?: { transcript?: string }
}

import { getLanguageLocale } from './languages'

export function getRecognitionLocale(languageProfile?: string | null): string {
  return getLanguageLocale(languageProfile)
}

export function getFinalTranscript(results: ArrayLike<VoiceRecognitionResult>): string {
  const finalParts: string[] = []
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    if (result?.isFinal && result[0]?.transcript?.trim()) finalParts.push(result[0].transcript.trim())
  }
  return finalParts.join(' ').trim()
}