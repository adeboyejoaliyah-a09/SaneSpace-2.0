import type { Message } from './types'

export type CrisisTier = 'safe' | 'monitor' | 'escalate' | 'stop'

export interface CrisisAssessment {
  tier: CrisisTier
  signals: string[]
  confidence: number
  recommendedAction: string
}

export function assessCrisis(
  message: string,
  recentMessages: Message[],
): CrisisAssessment {
  const msg = message.toLowerCase()

  // Tier 3 — Hard Stop signals
  const tier3Signals = [
    'want to die', 'end my life', 'kill myself',
    'no reason to live', 'better off dead',
    'hurt myself', 'self harm', 'end it all',
    'cant go on', "can't go on", 'final goodbye',
  ]

  // Tier 2 — Escalate signals
  const tier2Signals = [
    'no point', 'give up on everything', 'done with life',
    'nobody cares', 'disappear forever', 'so alone',
    'cant do this anymore', "can't do this anymore",
    'breaking point', 'nothing matters', 'hopeless',
  ]

  // Tier 1 — Monitor signals
  const tier1Signals = [
    'not okay', 'really struggling', 'falling apart',
    'overwhelmed', 'breaking down', 'losing it',
    'e don do me', 'i dey suffer', 'life is hard',
    'tired of everything', 'i give up', 'exhausted',
  ]

  const foundTier3 = tier3Signals.filter((s) => msg.includes(s))
  const foundTier2 = tier2Signals.filter((s) => msg.includes(s))
  const foundTier1 = tier1Signals.filter((s) => msg.includes(s))

  // Check recent message history for sustained distress
  const recentUserMessages = recentMessages
    .filter((m) => m.sender === 'user')
    .slice(-5)
    .map((m) => m.content.toLowerCase())

  const sustainedDistress = recentUserMessages
    .filter((m) => tier1Signals.some((s) => m.includes(s))).length >= 3

  if (foundTier3.length > 0) {
    return {
      tier: 'stop',
      signals: foundTier3,
      confidence: 95,
      recommendedAction: 'Suspend AI chat immediately. Show crisis resources only.',
    }
  }

  if (foundTier2.length > 0) {
    return {
      tier: 'escalate',
      signals: foundTier2,
      confidence: 80,
      recommendedAction: 'Shift to Care mode. Surface crisis resources prominently.',
    }
  }

  if (foundTier1.length > 0 || sustainedDistress) {
    return {
      tier: 'monitor',
      signals: [
        ...foundTier1,
        ...(sustainedDistress ? ['sustained distress across session'] : []),
      ],
      confidence: 60,
      recommendedAction: 'Increase empathy. Gently mention professional support.',
    }
  }

  return {
    tier: 'safe',
    signals: [],
    confidence: 95,
    recommendedAction: 'Continue normal conversation.',
  }
}

export const CRISIS_RESOURCES = {
  primary: {
    name: 'Mentally Aware Nigeria Initiative (MANI)',
    phone: '08091726902',
    description: 'Free mental health crisis support',
  },
  women: {
    name: 'She Writes Woman',
    phone: '0800 800 2000',
    description: 'Crisis support for women',
  },
  facility: {
    name: 'NIMH Lagos',
    phone: '01-7731640',
    description: 'Nearest mental health facility',
  },
}
