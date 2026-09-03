import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import type { Message } from '@/lib/types'
import { assessCrisis } from '@/lib/crisisDetection'
import { buildCareModeResponse } from '@/lib/careMode'
import { classifyRisk } from '@/lib/riskClassifier'
import { extractEmotionalMemory } from '@/lib/memoryExtraction'
import { generateSaneSpaceResponse } from '@/lib/ai/responseEngine'
import { AUTH_COOKIE_NAME, getSessionUserFromToken } from '@/lib/auth'
import { isMemoryEnabled, retrieveRelevantMemories, upsertUserMemories } from '@/lib/memoryStore'
import { normalizeLanguageId } from '@/lib/languages'

const VALID_MODES = new Set(['listening', 'coach', 'explorer', 'companion', 'care'])
const MAX_MESSAGES = 40
const MAX_MESSAGE_LENGTH = 4000
const MAX_PROFILE_FIELD_LENGTH = 120

type ChatRequestBody = {
  messages?: unknown
  specialisation?: unknown
  languageProfile?: unknown
  activeMode?: unknown
  userName?: unknown
}

function hashExcerpt(message: string): string {
  const excerpt = message.trim().slice(0, 80).toLowerCase()
  return createHash('sha256').update(excerpt).digest('hex')
}

function sanitizeProfileField(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim().slice(0, MAX_PROFILE_FIELD_LENGTH)
  if (!/^[\p{L}\p{N}\s.,'’/&()_-]*$/u.test(trimmed)) return fallback
  return trimmed
}

function validateMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null

  const messages = value.map((message): Message | null => {
    if (!message || typeof message !== 'object') return null
    const candidate = message as Partial<Message>
    const content = typeof candidate.content === 'string' ? candidate.content.trim() : ''
    const sender = candidate.sender
    const adaptiveMode = typeof candidate.adaptiveMode === 'string' && VALID_MODES.has(candidate.adaptiveMode)
      ? candidate.adaptiveMode
      : 'listening'

    if (sender !== 'user' && sender !== 'ai') return null
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null

    return {
      id: typeof candidate.id === 'string' && candidate.id.length <= 128 ? candidate.id : crypto.randomUUID(),
      conversationId: typeof candidate.conversationId === 'string' && candidate.conversationId.length <= 128 ? candidate.conversationId : 'server-validated',
      sender,
      content,
      adaptiveMode,
      timestamp: typeof candidate.timestamp === 'string' && !Number.isNaN(Date.parse(candidate.timestamp))
        ? candidate.timestamp
        : new Date().toISOString(),
    }
  })

  if (messages.some((message) => message === null)) return null
  if (messages[messages.length - 1]?.sender !== 'user') return null
  return messages as Message[]
}

function buildReasoningSummary(messages: Message[], detectedMode: string, specialisation: string, riskResult: ReturnType<typeof classifyRisk>, crisisAssessment: ReturnType<typeof assessCrisis>) {
  const lastMessage = messages[messages.length - 1]?.content ?? ''
  const userMessages = messages.filter((message) => message.sender === 'user')
  const emotionalIntensity = /\b(overwhelmed|panic|breaking down|done with|no point|cant cope|no fit again|i give up)\b/i.test(lastMessage)
    ? 'High'
    : /\b(stress|anxious|sad|worried|struggling|tired|exhausted|not okay)\b/i.test(lastMessage)
      ? 'Medium'
      : 'Low'

  const moodPattern = userMessages.length === 0
    ? 'General support'
    : userMessages.slice(-5).some((message) => /\b(exam|cgpa|assignment|school|course|deadline)\b/i.test(message.content))
      ? 'Academic pressure'
      : userMessages.slice(-5).some((message) => /\b(money|fees|allowance|cash|broke)\b/i.test(message.content))
        ? 'Financial pressure'
        : userMessages.slice(-5).some((message) => /\b(work|job|career|boss|office)\b/i.test(message.content))
          ? 'Work pressure'
          : 'General emotional support'

  return {
    detectedLanguage: 'mixed',
    emotionalIntensity,
    moodPattern,
    modeSelected: detectedMode,
    modeReason: detectedMode === 'care'
      ? 'Safety-sensitive context detected; prioritize care and human support guidance.'
      : 'Multi-domain companion mode selected based on conversation and user context.',
    specialisationApplied: specialisation,
    memoryUsed: userMessages.length > 0 ? `Recent context: ${userMessages.slice(-3).map((message) => message.content.slice(0, 30)).join(' | ')}` : 'First message — no prior context',
    crisisChecked: true,
    responseStyle: 'conversational, context-aware, and culturally aware',
    crisisTier: crisisAssessment.tier,
    riskLevel: riskResult.riskLevel,
    riskScore: riskResult.riskScore,
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value
    const sessionUser = sessionToken ? await getSessionUserFromToken(sessionToken) : null
    if (!sessionUser) return NextResponse.json({ message: 'Please sign in to continue.' }, { status: 401 })

    const body = await req.json().catch(() => null) as ChatRequestBody | null
    if (!body) {
      return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
    }

    const messages = validateMessages(body.messages)
    if (!messages) {
      return NextResponse.json({ message: 'Invalid message history.' }, { status: 400 })
    }

    const specialisation = sanitizeProfileField(body.specialisation)
    const languageProfile = sanitizeProfileField(body.languageProfile, 'Neutral / International')
    const userName = sanitizeProfileField(body.userName, sessionUser.firstName ?? 'there') || 'there'
    const activeMode = typeof body.activeMode === 'string' && VALID_MODES.has(body.activeMode) ? body.activeMode : 'listening'

    const lastUserMsg = [...messages].reverse().find((message) => message.sender === 'user')?.content ?? ''
    const riskResult = classifyRisk(lastUserMsg, messages)
    const lastMessage = messages[messages.length - 1]?.content || lastUserMsg
    const crisisAssessment = assessCrisis(lastMessage, messages)
    const detectedMode = riskResult.shouldEnterCareMode ? 'care' : activeMode
    const memoryEnabled = isMemoryEnabled(sessionUser.id)
    const relevantMemories = memoryEnabled ? retrieveRelevantMemories(sessionUser.id, lastMessage) : []

    if (riskResult.riskLevel !== 'low') {
      const careResponse = buildCareModeResponse({
        userMessage: lastMessage,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        languageProfileDetected: normalizeLanguageId(languageProfile),
        triggersDetected: riskResult.matchedSignals,
        memoryUsed: [],
      })

      const crisisEvent = careResponse.shouldLogCrisisEvent ? {
        eventType: 'risk_escalation',
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore,
        matchedSignals: riskResult.matchedSignals,
        hashedExcerpt: hashExcerpt(lastMessage),
        createdAt: new Date().toISOString(),
      } : null

      const reasoning = buildReasoningSummary(messages, 'care', specialisation, riskResult, crisisAssessment)

      return NextResponse.json({
        message: careResponse.message,
        detectedMode: 'care',
        selectedMode: 'care',
        crisisAssessment,
        hardStop: riskResult.riskLevel === 'critical',
        riskResult,
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore,
        showHumanHandoff: careResponse.showHumanHandoff,
        shouldLogCrisisEvent: careResponse.shouldLogCrisisEvent,
        responseType: careResponse.responseType,
        crisisEvent,
        reasoning,
      })
    }

    if (crisisAssessment.tier === 'stop') {
      return NextResponse.json({
        message: `I hear you, and I’m genuinely concerned about your safety right now. Please reach out to someone who can help immediately.\n\n📞 MANI Crisis Line: 08091726902\n📞 She Writes Woman: 0800 800 2000\n📞 NIMH Lagos: 01-7731640\n\nYou do not have to carry this alone right now.`,
        detectedMode: 'care',
        crisisAssessment,
        hardStop: true,
      })
    }

    const memoryExtraction = extractEmotionalMemory({
      userId: sessionUser.id,
      source: 'chat',
      text: lastMessage,
      riskResult,
      languageProfileDetected: languageProfile,
    })
    if (memoryEnabled) upsertUserMemories(sessionUser.id, memoryExtraction.memoriesExtracted)

    const response = await generateSaneSpaceResponse({
      messages,
      specialisation,
      languageProfile,
      userName,
      userMemories: relevantMemories,
    })

    const reasoning = buildReasoningSummary(messages, detectedMode, specialisation, riskResult, crisisAssessment)

    return NextResponse.json({
      message: response.content,
      detectedMode,
      selectedMode: detectedMode,
      reasoning,
      crisisAssessment,
      riskResult,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
      showHumanHandoff: false,
      shouldLogCrisisEvent: false,
      memoryExtraction,
    })
  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json(
      { message: "I'm having trouble connecting right now. Please try again.", detectedMode: 'listening' },
      { status: 500 },
    )
  }
}
