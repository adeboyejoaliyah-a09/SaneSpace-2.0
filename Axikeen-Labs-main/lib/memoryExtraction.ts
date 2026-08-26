import type { RiskResult } from './riskClassifier'

export type MemorySource = 'chat' | 'mood_log' | 'journal'
export type MemoryType = 'trigger' | 'pattern' | 'resilience' | 'vocabulary'

export interface MemoryExtractionInput {
  userId: string
  source: MemorySource
  text: string
  moodEntry?: {
    mood?: string | null
    triggerTag?: string | null
    note?: string | null
  }
  riskResult?: RiskResult
  languageProfileDetected?: string
}

export interface ExtractedMemory {
  memoryType: MemoryType
  category: string
  content: string
  confidenceScore: number
  source: MemorySource
}

export interface MemoryExtractionResult {
  memoriesExtracted: ExtractedMemory[]
}

export interface StoredUserMemory extends ExtractedMemory {
  id: string
  userId: string
  lastUpdated: string
}

const TRIGGER_RULES = [
  { category: 'academic', content: 'User often reports academic stress around exams or CGPA.', keywords: ['exam', 'cgpa', 'assignment', 'school', 'lecture', 'carry-over', 'course', 'test'] },
  { category: 'financial', content: 'User often reports financial stress or money pressure.', keywords: ['money', 'broke', 'fees', 'allowance', 'feeding', 'cash', 'rent'] },
  { category: 'family', content: 'User reports stress connected to family expectations or home pressure.', keywords: ['family', 'mum', 'mom', 'dad', 'parents', 'parent', 'house'] },
  { category: 'relationships', content: 'User reports emotional stress connected to relationships.', keywords: ['relationship', 'boyfriend', 'girlfriend', 'friend', 'breakup', 'partner'] },
  { category: 'self_worth', content: 'User reports self-worth pressure or harsh self-judgment.', keywords: ['failure', 'useless', 'not good enough', 'hate myself', 'worthless'] },
  { category: 'work', content: 'User reports stress connected to work, career, or deadlines.', keywords: ['work', 'job', 'boss', 'office', 'deadline', 'career'] },
  { category: 'social_comparison', content: 'User reports pressure from comparison or social media.', keywords: ['instagram', 'social media', 'comparison', 'everyone is ahead', 'mates'] },
  { category: 'health', content: 'User reports stress connected to health, sleep, or body symptoms.', keywords: ['health', 'sick', 'sleep', 'insomnia', 'tired', 'exhausted'] },
]

const EMOTION_RULES = [
  { category: 'stress', keywords: ['stress', 'pressure', 'overwhelmed', 'wahala'] },
  { category: 'sadness', keywords: ['sad', 'down', 'cry', 'low'] },
  { category: 'anxiety', keywords: ['anxious', 'anxiety', 'worried', 'panic'] },
  { category: 'anger', keywords: ['angry', 'annoyed', 'frustrated', 'vex'] },
  { category: 'exhaustion', keywords: ['tired', 'exhausted', 'burnt out', 'don tire me'] },
  { category: 'shame', keywords: ['ashamed', 'embarrassed', 'disgrace'] },
  { category: 'loneliness', keywords: ['alone', 'lonely', 'nobody'] },
  { category: 'hopeful', keywords: ['hopeful', 'better today', 'small progress'] },
  { category: 'calm', keywords: ['calm', 'okay now', 'peaceful'] },
]

const RESILIENCE_RULES = [
  { category: 'breathing', content: 'Breathing exercise helped the user feel a little steadier.', keywords: ['breathing helped', 'breath helped', 'breathing thing helped'] },
  { category: 'music', content: 'Music helps the user cope or reset.', keywords: ['music helps', 'music helped', 'song helped'] },
  { category: 'family_support', content: 'Talking to family helps the user cope.', keywords: ['talking to family helped', 'called my mum', 'called my mom', 'called my dad'] },
  { category: 'prayer', content: 'Prayer helps the user cope when they mention it.', keywords: ['prayer helped', 'praying helped', 'i prayed'] },
  { category: 'sleep', content: 'Sleep or rest helps the user recover.', keywords: ['sleep helped', 'rest helped', 'slept and'] },
  { category: 'journaling', content: 'Journaling helps the user process emotions.', keywords: ['journaling helped', 'writing helped', 'journal helped'] },
  { category: 'walking', content: 'Walking helps the user reset.', keywords: ['walking helped', 'walk helped', 'took a walk'] },
]

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function detectLanguagePattern(text: string, explicit?: string) {
  const normalizedExplicit = explicit?.toLowerCase()
  if (normalizedExplicit?.includes('pidgin')) return 'pidgin'
  if (normalizedExplicit?.includes('lagos')) return 'lagos'
  if (normalizedExplicit?.includes('student')) return 'student'
  if (normalizedExplicit?.includes('home')) return 'home'

  const hasPidgin = /\b(omo|abeg|wahala|dey|don|no fit|e don|sha)\b/.test(text)
  const hasEnglish = /\b(i|my|the|this|that|school|money|exam)\b/.test(text)
  if (hasPidgin && hasEnglish) return 'code_switching'
  if (hasPidgin) return 'pidgin'
  return 'neutral'
}

function detectIntensity(text: string, riskResult?: RiskResult) {
  if (riskResult) return riskResult.riskScore
  if (/\b(can'?t cope|no fit again|overwhelmed|panic|breaking down)\b/.test(text)) return 0.65
  if (/\b(stress|anxious|sad|tired|worried)\b/.test(text)) return 0.45
  return 0.25
}

export function extractEmotionalMemory(input: MemoryExtractionInput): MemoryExtractionResult {
  const textParts = [input.text, input.moodEntry?.mood, input.moodEntry?.triggerTag, input.moodEntry?.note]
  const text = textParts.filter(Boolean).join(' ').toLowerCase()
  const memories: ExtractedMemory[] = []

  if (input.riskResult?.riskLevel === 'high' || input.riskResult?.riskLevel === 'critical') {
    memories.push({
      memoryType: 'pattern',
      category: 'safety_metadata',
      content: `Safety escalation occurred at ${input.riskResult.riskLevel} risk level; full crisis text was not stored in memory.`,
      confidenceScore: input.riskResult.riskScore,
      source: input.source,
    })
    return { memoriesExtracted: memories }
  }

  const triggerMatch = TRIGGER_RULES.find((rule) =>
    includesAny(text, rule.keywords) || input.moodEntry?.triggerTag?.toLowerCase() === rule.category,
  )
  if (triggerMatch) {
    memories.push({
      memoryType: 'trigger',
      category: triggerMatch.category,
      content: triggerMatch.content,
      confidenceScore: input.source === 'mood_log' ? 0.62 : 0.55,
      source: input.source,
    })
  }

  const mood = input.moodEntry?.mood?.toLowerCase()
  const emotionMatch = EMOTION_RULES.find((rule) => includesAny(text, rule.keywords) || mood === rule.category)
  if (emotionMatch) {
    memories.push({
      memoryType: 'pattern',
      category: emotionMatch.category,
      content: `User has recently expressed ${emotionMatch.category} with intensity ${detectIntensity(text, input.riskResult).toFixed(2)}.`,
      confidenceScore: 0.52,
      source: input.source,
    })
  }

  const resilienceMatch = RESILIENCE_RULES.find((rule) => includesAny(text, rule.keywords))
  if (resilienceMatch) {
    memories.push({
      memoryType: 'resilience',
      category: resilienceMatch.category,
      content: resilienceMatch.content,
      confidenceScore: 0.65,
      source: input.source,
    })
  }

  const languagePattern = detectLanguagePattern(text, input.languageProfileDetected)
  memories.push({
    memoryType: 'vocabulary',
    category: languagePattern,
    content: `User language pattern currently appears to be ${languagePattern}.`,
    confidenceScore: languagePattern === 'neutral' ? 0.4 : 0.6,
    source: input.source,
  })

  return { memoriesExtracted: memories }
}

export function mergeMemoryEntries(
  existing: StoredUserMemory[],
  extracted: ExtractedMemory[],
  userId: string,
): StoredUserMemory[] {
  const now = new Date().toISOString()
  const updated = [...existing]

  for (const memory of extracted) {
    const index = updated.findIndex((item) =>
      item.memoryType === memory.memoryType && item.category === memory.category,
    )

    if (index >= 0) {
      const previous = updated[index]
      updated[index] = {
        ...previous,
        content: memory.content,
        confidenceScore: Math.min(1, Number((previous.confidenceScore + 0.08 + memory.confidenceScore * 0.12).toFixed(2))),
        source: memory.source,
        lastUpdated: now,
      }
    } else {
      updated.unshift({
        ...memory,
        id: crypto.randomUUID(),
        userId,
        lastUpdated: now,
      })
    }
  }

  return updated
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 25)
}
