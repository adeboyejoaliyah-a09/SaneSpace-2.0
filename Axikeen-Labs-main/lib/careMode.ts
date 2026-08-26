import type { RiskLevel } from './riskClassifier'

export type LanguageProfileDetected = 'pidgin' | 'lagos' | 'student' | 'home' | 'neutral'
export type CareResponseType = 'soft_care' | 'handoff_care' | 'urgent_care'

export interface BuildCareModeResponseInput {
  userMessage: string
  riskScore: number
  riskLevel: Exclude<RiskLevel, 'low'>
  languageProfileDetected: LanguageProfileDetected
  triggersDetected: string[]
  memoryUsed: unknown[]
}

export interface CareModeResponse {
  selectedMode: 'care'
  message: string
  showHumanHandoff: boolean
  shouldLogCrisisEvent: boolean
  responseType: CareResponseType
}

function mediumMessage(language: LanguageProfileDetected) {
  if (language === 'pidgin' || language === 'student' || language === 'lagos') {
    return "I hear you. This thing sounds really heavy right now, and you don't have to rush to solve everything at once. Before anything else, try put both feet on the floor and take one slow breath in, then one slow breath out. Are you safe enough to pause with me for a moment?"
  }

  return "I hear you. This sounds really heavy right now, and you do not have to solve everything at once. Before we think about next steps, place both feet on the floor and take one slow breath in, then one slow breath out. Are you safe enough to pause with me for a moment?"
}

function highMessage(language: LanguageProfileDetected) {
  if (language === 'pidgin' || language === 'student' || language === 'lagos') {
    return "I am really sorry it feels this heavy. I want us to pause normal advice for now and focus on your safety. Are you safe right now, and is there someone nearby you trust, like a friend, roommate, family member, course adviser, or campus support person, that you can contact now?"
  }

  return "I am really sorry it feels this heavy. I want to pause normal advice for now and focus on your safety. Are you safe right now, and is there someone nearby you trust, such as a friend, family member, roommate, course adviser, counselor, or student affairs contact, that you can reach out to now?"
}

function criticalMessage(language: LanguageProfileDetected) {
  if (language === 'pidgin' || language === 'student' || language === 'lagos') {
    return "I am really concerned about your safety right now. Please contact emergency help or someone close to you immediately, and try not to stay alone. If you can, call or message a trusted person now and tell them you need them with you."
  }

  return "I am really concerned about your safety right now. Please contact emergency help or someone near you immediately, and try not to stay alone. If you can, call or message a trusted person now and tell them you need them with you."
}

export function buildCareModeResponse(input: BuildCareModeResponseInput): CareModeResponse {
  if (input.riskLevel === 'critical') {
    return {
      selectedMode: 'care',
      message: criticalMessage(input.languageProfileDetected),
      showHumanHandoff: true,
      shouldLogCrisisEvent: true,
      responseType: 'urgent_care',
    }
  }

  if (input.riskLevel === 'high') {
    return {
      selectedMode: 'care',
      message: highMessage(input.languageProfileDetected),
      showHumanHandoff: true,
      shouldLogCrisisEvent: true,
      responseType: 'handoff_care',
    }
  }

  return {
    selectedMode: 'care',
    message: mediumMessage(input.languageProfileDetected),
    showHumanHandoff: false,
    shouldLogCrisisEvent: false,
    responseType: 'soft_care',
  }
}
