import type { Message } from './types'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface RiskResult {
  riskScore: number
  riskLevel: RiskLevel
  matchedSignals: string[]
  shouldEnterCareMode: boolean
  shouldShowHumanHandoff: boolean
  shouldLogCrisisEvent: boolean
  reason: string
}

type SignalRule = {
  signal: string
  patterns: RegExp[]
  score: number
}

const LOW_RULES: SignalRule[] = [
  { signal: 'academic pressure', patterns: [/\bexam(s)?\b/, /\bcgpa\b/, /\bassignment\b/, /\bcarry[- ]?over\b/, /\bschool\b/], score: 0.28 },
  { signal: 'money pressure', patterns: [/\bmoney\b/, /\bbroke\b/, /\bfees?\b/, /\ballowance\b/, /\bfeeding\b/, /\bcash\b/], score: 0.3 },
  { signal: 'stress', patterns: [/\bstress(ed)?\b/, /\boverwhelm(ed)?\b/, /\bpressure\b/], score: 0.32 },
  { signal: 'sadness', patterns: [/\bsad\b/, /\bdown\b/, /\blow\b/], score: 0.24 },
  { signal: 'tiredness', patterns: [/\btired\b/, /\bexhausted\b/, /\bburnt out\b/, /\bburned out\b/], score: 0.34 },
  { signal: 'general anxiety', patterns: [/\banxious\b/, /\banxiety\b/, /\bworried\b/, /\bpanic small\b/], score: 0.34 },
  { signal: 'academic stress slang', patterns: [/\bi'?m cooked\b/, /\bomo i'?m cooked\b/, /\bmy cgpa (go|will|don)\b/], score: 0.42 },
]

const MEDIUM_RULES: SignalRule[] = [
  { signal: 'everything is too much', patterns: [/\beverything is too much\b/, /\beverything don tire me\b/, /\ball this thing don tire me\b/], score: 0.62 },
  { signal: "can't cope", patterns: [/\bi can'?t cope\b/, /\bi cannot cope\b/], score: 0.64 },
  { signal: 'i no fit again', patterns: [/\bi no fit again\b/, /\bi no fit\b(?!.*(continue|live|dey here))/, /\be don do me\b/], score: 0.58 },
  { signal: 'panic language', patterns: [/\bpanic(king)?\b/, /\bi'?m losing it\b/, /\bbreaking down\b/, /\bfalling apart\b/], score: 0.64 },
  { signal: 'repeated hopelessness', patterns: [/\bhopeless\b/, /\bno point\b/, /\bi give up\b/], score: 0.68 },
  { signal: 'tired of everything', patterns: [/\bi'?m tired of everything\b/, /\btired of everything\b/], score: 0.68 },
]

const HIGH_RULES: SignalRule[] = [
  { signal: 'want to disappear', patterns: [/\bi (just )?(want|wan) to disappear\b/, /\bi just wan disappear\b/, /\bdisappear forever\b/], score: 0.82 },
  { signal: "don't want to be here", patterns: [/\bi don'?t want to be here\b/, /\bi no wan dey here\b/, /\bi no want dey here\b/], score: 0.84 },
  { signal: 'might hurt myself', patterns: [/\bi might hurt myself\b/, /\bi may hurt myself\b/, /\bi could hurt myself\b/], score: 0.86 },
  { signal: 'cannot continue', patterns: [/\bi no fit continue\b/, /\bi can'?t continue\b/, /\bi cannot continue\b/], score: 0.78 },
  { signal: 'serious hopelessness', patterns: [/\bnothing matters\b/, /\bdone with life\b/, /\bno reason to live\b/], score: 0.86 },
]

const CRITICAL_RULES: SignalRule[] = [
  { signal: 'direct self-harm intent', patterns: [/\bi want to hurt myself\b/, /\bi want to kill myself\b/, /\bi want to end it\b/, /\bend my life\b/, /\bend it all\b/], score: 0.94 },
  { signal: 'specific timeframe', patterns: [/\btonight\b/, /\btoday\b/, /\bright now\b/, /\bnow\b/, /\bthis night\b/], score: 0.08 },
  { signal: 'specific plan', patterns: [/\bwith (a|my) (knife|rope|blade|gun|pills?)\b/, /\boverdose\b/, /\bjump\b/, /\bpoison\b/], score: 0.12 },
  { signal: 'harm to others', patterns: [/\bi will hurt (him|her|them|someone)\b/, /\bi want to hurt (him|her|them|someone)\b/], score: 0.94 },
]

function findMatches(message: string, rules: SignalRule[]) {
  return rules.filter((rule) => rule.patterns.some((pattern) => pattern.test(message)))
}

function clampScore(score: number) {
  return Math.max(0, Math.min(1, Number(score.toFixed(2))))
}

function hasRepeatedNegativeMood(recentMessages: Message[]) {
  const negativePatterns = [
    /\bhopeless\b/,
    /\bno point\b/,
    /\bi can'?t cope\b/,
    /\bi no fit again\b/,
    /\btired of everything\b/,
    /\boverwhelm(ed)?\b/,
  ]
  const recentUserText = recentMessages
    .filter((message) => message.sender === 'user')
    .slice(-5)
    .map((message) => message.content.toLowerCase())

  return recentUserText.filter((text) => negativePatterns.some((pattern) => pattern.test(text))).length >= 3
}

export function classifyRisk(message: string, recentMessages: Message[] = []): RiskResult {
  const normalized = message.toLowerCase().replace(/[’]/g, "'")

  const lowMatches = findMatches(normalized, LOW_RULES)
  const mediumMatches = findMatches(normalized, MEDIUM_RULES)
  const highMatches = findMatches(normalized, HIGH_RULES)
  const criticalMatches = findMatches(normalized, CRITICAL_RULES)
  const repeatedNegativeMood = hasRepeatedNegativeMood(recentMessages)

  let score = Math.max(0.12, ...lowMatches.map((match) => match.score))
  let matchedSignals = lowMatches.map((match) => match.signal)

  if (mediumMatches.length > 0 || repeatedNegativeMood) {
    score = Math.max(score, ...mediumMatches.map((match) => match.score), repeatedNegativeMood ? 0.62 : 0)
    matchedSignals = [
      ...matchedSignals,
      ...mediumMatches.map((match) => match.signal),
      ...(repeatedNegativeMood ? ['repeated negative mood entries'] : []),
    ]
  }

  if (highMatches.length > 0) {
    score = Math.max(score, ...highMatches.map((match) => match.score))
    matchedSignals = [...matchedSignals, ...highMatches.map((match) => match.signal)]
  }

  const directCritical = criticalMatches.some((match) =>
    ['direct self-harm intent', 'harm to others'].includes(match.signal),
  )
  const hasPlanOrTimeframe = criticalMatches.some((match) =>
    ['specific timeframe', 'specific plan'].includes(match.signal),
  )

  if (directCritical && hasPlanOrTimeframe) {
    score = Math.max(score, 0.96)
  } else if (directCritical) {
    score = Math.max(score, 0.9)
  } else if (criticalMatches.length > 0 && highMatches.length > 0) {
    score = Math.max(score, 0.9)
  }

  if (criticalMatches.length > 0) {
    matchedSignals = [...matchedSignals, ...criticalMatches.map((match) => match.signal)]
  }

  const dedupedSignals = Array.from(new Set(matchedSignals))
  const riskScore = clampScore(score)
  const riskLevel: RiskLevel =
    riskScore >= 0.9 ? 'critical' :
    riskScore >= 0.75 ? 'high' :
    riskScore >= 0.5 ? 'medium' :
    'low'

  return {
    riskScore,
    riskLevel,
    matchedSignals: dedupedSignals,
    shouldEnterCareMode: riskLevel !== 'low',
    shouldShowHumanHandoff: riskLevel === 'high' || riskLevel === 'critical',
    shouldLogCrisisEvent: riskLevel === 'high' || riskLevel === 'critical',
    reason:
      riskLevel === 'low' ? 'Low distress or everyday stress signals detected; continue normal support flow.' :
      riskLevel === 'medium' ? 'Moderate distress signals detected; use softer Care Mode language and monitor safety.' :
      riskLevel === 'high' ? 'Possible self-harm or serious hopelessness detected; force Care Mode and show human handoff.' :
      'Immediate danger or direct harm intent detected; use urgent crisis protocol and avoid normal coaching.',
  }
}
