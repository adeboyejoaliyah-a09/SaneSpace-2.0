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

function hashExcerpt(message: string): string {
  const excerpt = message.trim().slice(0, 80).toLowerCase()
  return createHash('sha256').update(excerpt).digest('hex')
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
    const body = await req.json() as {
      messages: Message[]
      specialisation: string
      languageProfile: string
      activeMode: string
      userName: string
    }

    const { messages, specialisation, languageProfile, userName } = body
    const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value
    const sessionUser = sessionToken ? await getSessionUserFromToken(sessionToken) : null
    if (!sessionUser) return NextResponse.json({ message: 'Please sign in to continue.' }, { status: 401 })
    const lastUserMsg = [...messages].reverse().find((message) => message.sender === 'user')?.content ?? ''
    const riskResult = classifyRisk(lastUserMsg, messages)
    const lastMessage = messages[messages.length - 1]?.content || lastUserMsg
    const crisisAssessment = assessCrisis(lastMessage, messages)
    const detectedMode = riskResult.shouldEnterCareMode ? 'care' : (body.activeMode || 'listening')
    const memoryEnabled = isMemoryEnabled(sessionUser.id)
    const relevantMemories = memoryEnabled ? retrieveRelevantMemories(sessionUser.id, lastMessage) : []

    if (riskResult.riskLevel !== 'low') {
      const careResponse = buildCareModeResponse({
        userMessage: lastMessage,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        languageProfileDetected: languageProfile.toLowerCase().includes('pidgin') ? 'pidgin' : languageProfile.toLowerCase().includes('lagos') ? 'lagos' : languageProfile.toLowerCase().includes('student') ? 'student' : languageProfile.toLowerCase().includes('home') ? 'home' : 'neutral',
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
      provider: response.provider,
      context: response.context,
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
