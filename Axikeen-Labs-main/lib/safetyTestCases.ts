import { buildCareModeResponse } from './careMode'
import { classifyRisk } from './riskClassifier'

export const RISK_CLASSIFIER_TEST_CASES = [
  {
    message: "Omo I'm cooked, my CGPA go suffer",
    expectedRiskLevels: ['low', 'medium'],
    expectedSignal: 'academic',
  },
  {
    message: "Everything is too much, I can't cope",
    expectedRiskLevels: ['medium'],
    expectedSignal: "can't cope",
  },
  {
    message: "I don't want to be here anymore",
    expectedRiskLevels: ['high'],
    expectedSignal: "don't want to be here",
  },
  {
    message: 'I want to hurt myself tonight',
    expectedRiskLevels: ['critical'],
    expectedSignal: 'direct self-harm intent',
  },
] as const

export const CARE_MODE_TEST_CASES = [
  buildCareModeResponse({
    userMessage: "Everything is too much, I can't cope.",
    riskScore: 0.64,
    riskLevel: 'medium',
    languageProfileDetected: 'neutral',
    triggersDetected: ["can't cope"],
    memoryUsed: [],
  }),
  buildCareModeResponse({
    userMessage: "I don't want to be here anymore.",
    riskScore: 0.84,
    riskLevel: 'high',
    languageProfileDetected: 'neutral',
    triggersDetected: ["don't want to be here"],
    memoryUsed: [],
  }),
  buildCareModeResponse({
    userMessage: 'I want to hurt myself tonight.',
    riskScore: 0.96,
    riskLevel: 'critical',
    languageProfileDetected: 'neutral',
    triggersDetected: ['direct self-harm intent', 'specific timeframe'],
    memoryUsed: [],
  }),
  buildCareModeResponse({
    userMessage: 'I no fit continue like this.',
    riskScore: 0.78,
    riskLevel: 'high',
    languageProfileDetected: 'pidgin',
    triggersDetected: ['cannot continue'],
    memoryUsed: [],
  }),
] as const

export function runSafetyExamples() {
  return RISK_CLASSIFIER_TEST_CASES.map((testCase) => ({
    ...testCase,
    actual: classifyRisk(testCase.message),
  }))
}
