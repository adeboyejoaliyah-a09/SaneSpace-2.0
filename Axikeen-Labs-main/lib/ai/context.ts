import type { Message } from '@/lib/types'
import { classifyRisk } from '@/lib/riskClassifier'
import { extractEmotionalMemory } from '@/lib/memoryExtraction'
import type { StoredUserMemory } from '@/lib/memoryExtraction'
import { getLanguageDefinition, normalizeLanguageId, type LanguageId } from '@/lib/languages'

export type SaneDomain =
  | 'school'
  | 'career'
  | 'relationships'
  | 'productivity'
  | 'creativity'
  | 'emotional_support'
  | 'decision_making'
  | 'general'

export type LanguageProfile = LanguageId

export interface ContextBundle {
  languageId: LanguageProfile
  locale: string
  identity: string
  userContext: string
  personalMemory: string
  culturalContext: string
  emotionalContext: string
  domainContext: string
  safetyContext: string
  languageProfile: LanguageProfile
  specialisation: string
  domain: SaneDomain
  userName: string
}

const DOMAIN_KEYWORDS: Record<SaneDomain, RegExp[]> = {
  school: [/\b(exam|cgpa|assignment|course|school|lecture|study|semester|deadline)\b/i],
  career: [/\b(job|career|work|office|interview|promotion|resume|colleague|boss)\b/i],
  relationships: [/\b(friend|girlfriend|boyfriend|family|mum|mom|dad|relationship|love|partner)\b/i],
  productivity: [/\b(plan|schedule|focus|productivity|organise|organize|task|to-do|habit|routine)\b/i],
  creativity: [/\b(idea|brainstorm|write|creative|art|story|design|project|content)\b/i],
  emotional_support: [/\b(stress|anxious|sad|overwhelmed|tired|cry|lonely|angry|not okay)\b/i],
  decision_making: [/\b(decide|choice|should i|what should i|uncertain|decision|confused)\b/i],
  general: [/./],
}

function inferLanguageProfile(input: string, override?: string): LanguageProfile {
  if (override) return normalizeLanguageId(override)

  const normalized = input.toLowerCase()

  if (/\b(omo|abeg|wahala|dey|don|no fit|sha)\b/.test(normalized)) return 'nigerian-pidgin'
  if (/\b(chai|how far|weytin|na wa|this thing don do me|i no fit again)\b/.test(normalized)) return 'lagos-english'
  if (/\b(cgpa|carry over|harass|course mate|hostel|department)\b/.test(normalized)) return 'student-english'
  if (/\b(family expectations|my parents|mum|dad|house|school fees)\b/.test(normalized)) return 'nigerian-home-english'

  return 'english'
}

function buildCulturalContext(languageProfile: string): string {
  const language = getLanguageDefinition(languageProfile)
  const regionalNote = language.culturalContext === 'nigerian'
    ? ' For Nigerian English, Pidgin, and Lagos context, understand code-switching and local social context without forcing slang.'
    : ['yoruba', 'hausa', 'igbo'].includes(language.id)
      ? ' For a requested Nigerian language, respect the language and cultural context without reducing it to a stereotype.'
      : ' For global users, use the selected language and context without assuming a country or culture.'
  return `Cultural context should be interpreted as supportive context, not stereotype. Adapt examples, references, and social assumptions to the user's stated context. Keep language natural, clear, and respectful.${regionalNote}`
}

function inferDomain(input: string): SaneDomain {
  const normalized = input.toLowerCase()
  for (const [domain, patterns] of Object.entries(DOMAIN_KEYWORDS) as [SaneDomain, RegExp[]][]) {
    if (domain === 'general') continue
    if (patterns.some((pattern) => pattern.test(normalized))) return domain
  }
  return 'general'
}

function getEmotionalSummary(messages: Message[]): string {
  const recent = messages.filter((message) => message.sender === 'user').slice(-6)
  if (recent.length === 0) return 'No recent emotional context yet; treat this as a fresh conversation.'

  const combined = recent.map((message) => message.content.toLowerCase()).join(' ')
  const signals: string[] = []

  if (/\b(stressed|overwhelmed|anxious|tired|exhausted)\b/.test(combined)) signals.push('recent stress or exhaustion')
  if (/\b(sad|low|cry|lonely|angry|frustrated)\b/.test(combined)) signals.push('recent emotional heaviness')
  if (/\b(hopeful|calm|okay|better)\b/.test(combined)) signals.push('recent grounding or relief')

  return signals.length > 0 ? signals.join(', ') : 'Recent conversation is mostly neutral or mixed.'
}

function getMemorySummary(messages: Message[]): string {
  const recent = messages.filter((message) => message.sender === 'user').slice(-4)
  if (recent.length === 0) return 'No prior conversation memory has been established yet.'

  const text = recent.map((message) => message.content).join(' ')
  const memoryHints: string[] = []

  if (/\b(exam|cgpa|school|assignment|course)\b/i.test(text)) memoryHints.push('school pressure')
  if (/\b(job|career|work|office|promotion|interview)\b/i.test(text)) memoryHints.push('career pressure')
  if (/\b(money|fees|allowance|cash|broke)\b/i.test(text)) memoryHints.push('financial pressure')
  if (/\b(family|mum|dad|parents|relationship|boyfriend|girlfriend)\b/i.test(text)) memoryHints.push('personal relationships')

  return memoryHints.length > 0 ? `Likely relevant context: ${memoryHints.join(', ')}.` : 'Conversation context is mostly general.'
}

export function buildContextBundle(input: {
  messages: Message[]
  specialisation?: string
  languageProfile?: string
  userName?: string
  userMemories?: StoredUserMemory[]
}): ContextBundle {
  const lastUserMessage = [...input.messages].reverse().find((message) => message.sender === 'user')?.content ?? ''
  const riskResult = classifyRisk(lastUserMessage, input.messages)
  const languageProfile = inferLanguageProfile(lastUserMessage, input.languageProfile)
  const language = getLanguageDefinition(languageProfile)
  const domain = inferDomain(lastUserMessage)
  const specialisation = input.specialisation ?? 'General support'
  const userName = input.userName?.trim() || 'friend'

  const memoryExtraction = extractEmotionalMemory({
    userId: 'local',
    source: 'chat',
    text: lastUserMessage,
    riskResult,
    languageProfileDetected: languageProfile,
  })

  const identity = `SaneSpace is a personal AI companion that prioritizes the person before the task. It is warm, attentive, practical, culturally aware, non-judgmental, and useful across school, work, relationships, decision-making, creativity, personal planning, and everyday life.`
  const userContext = `Personality/specialisation: ${specialisation}. Language/register preference: ${languageProfile}. User name: ${userName}. Adapt naturally without forcing a rigid script.`
  const retrievedMemory = input.userMemories ?? []
  const personalMemory = `Relevant memory summary: ${getMemorySummary(input.messages)}. Retrieved user memories: ${retrievedMemory.map((item) => `${item.category}:${item.content}`).join('; ') || 'No relevant stored memory.'}. New structured insights: ${memoryExtraction.memoriesExtracted.slice(0, 2).map((item) => `${item.category}:${item.content}`).join('; ') || 'None.'}`
  const culturalContext = buildCulturalContext(input.languageProfile ?? languageProfile)
  const emotionalContext = `Current conversational emotional cues: ${getEmotionalSummary(input.messages)}. Match the tone to the user's actual moment. Be attentive without overperforming empathy. Avoid repetitive “I’m sorry” scripts when the context calls for practical warmth.`
  const domainContext = `Current domain likely in focus: ${domain}. Respond as a companion in that domain while staying aware of the person behind the request.`
  const safetyContext = riskResult.riskLevel === 'low'
    ? 'Safety: routine conversation; continue normal support and keep the conversation calm, useful, and non-judgmental.'
    : riskResult.riskLevel === 'medium'
      ? 'Safety: moderate distress signals. Shift toward supportive grounding and check whether the user is safe enough to continue, without escalating unnecessarily.'
      : riskResult.riskLevel === 'high'
        ? 'Safety: high-risk signals. Prioritize care and human support guidance, avoid normal coaching, and make the safety boundary explicit.'
        : 'Safety: critical-risk signals. Stop normal advice and use urgent crisis guidance and immediate human support direction.'

  return {
    languageId: language.id,
    locale: language.locale,
    identity,
    userContext,
    personalMemory,
    culturalContext,
    emotionalContext,
    domainContext,
    safetyContext,
    languageProfile,
    specialisation,
    domain,
    userName,
  }
}
