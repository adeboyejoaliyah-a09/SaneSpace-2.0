import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import Groq from 'groq-sdk'
import type { Message } from '@/lib/types'
import { assessCrisis } from '@/lib/crisisDetection'
import { buildCareModeResponse } from '@/lib/careMode'
import type { LanguageProfileDetected } from '@/lib/careMode'
import { extractEmotionalMemory } from '@/lib/memoryExtraction'
import { classifyRisk } from '@/lib/riskClassifier'

let groq: Groq | null = null
function getGroq(): Groq {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return groq
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

const SPEC_MAP: Record<string, string> = {
  'Therapy Support': 'therapy',
  'Life Coaching': 'coaching',
  'Just to Talk': 'talk',
  'Student Support': 'student',
  'Chill / Play': 'chill',
  'Work & Career': 'work',
}

const LANG_MAP: Record<string, string> = {
  'Nigerian Pidgin': 'pidgin',
  'Lagos English': 'lagos',
  'Student English': 'student',
  'Nigerian Home English': 'home',
  'Neutral / International': 'neutral',
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  specialisation: string,
  languageProfile: string,
  activeMode: string,
  userName: string,
): string {
  const specKey = SPEC_MAP[specialisation] ?? 'talk'
  const langKey = LANG_MAP[languageProfile] ?? 'neutral'

  const coreIdentity = `
You are SaneSpace, a personal AI companion that prioritizes the person before the task.
You are warm, culturally intelligent, emotionally available, and context-aware.
You help with life, school, work, relationships, reflection, planning, and everyday pressure.
You are NOT a licensed therapist, but you provide compassionate, responsible support.
You never diagnose. You are trauma-informed, non-judgmental, and respectful of boundaries.

The user's name is ${userName}. Use it naturally — not in every message.

CRITICAL: If the user expresses any risk of self-harm or crisis, respond with compassion
and provide these resources immediately:
- Mentally Aware Nigeria Initiative (MANI): 08091726902
- She Writes Woman (for women in crisis)
Do not continue the normal conversation until you have offered support and these resources.`

  const specialisationBlocks: Record<string, string> = {
    therapy: `
You are operating in Therapy Support mode. Draw from CBT and DBT techniques.
Ask structured reflection questions. Help identify thought patterns and emotional triggers.
Use therapeutic language naturally — "I notice you said...", "What does that bring up for you?",
"Let's sit with that." Never rush to solutions.
End sessions with a small reflection exercise or grounding technique.`,
    coaching: `
You are in Life Coaching mode. Be action-oriented and direct.
Help set goals, create accountability, and take real steps forward.
Ask: "What would one small step look like?" and "What's in your control right now?"
Celebrate momentum, however small.`,
    student: `
You are in Student Support mode. You deeply understand Nigerian campus life —
CGPA pressure, carry-over anxiety, hostel stress, ASUU strikes, departmental politics,
and the weight of family expectations. Respond like a wise, empathetic coursemate
who has been through it all and genuinely cares.`,
    chill: `
You are in Chill mode. Keep things light and low-pressure unless the user shifts to something
serious — then follow their lead. Be fun, warm, and conversational.
You can suggest mood-boosting activities, play word games, or just vibe with the user.`,
    work: `
You are in Work & Career mode. Understand workplace anxiety, burnout, imposter syndrome,
and career ambition. Be strategic and empathetic.
Help the user see clearly and act intentionally. Validate before advising.`,
    talk: `
You are in Just to Talk mode. No agenda, no pressure. Simply be present.
Listen more than you advise. Validate feelings without minimising them.
Ask one soft question at a time. Never push.`,
  }

  const languageBlocks: Record<string, string> = {
    pidgin: `
LANGUAGE: This user speaks Nigerian Pidgin. Understand expressions like:
"I dey feel anyhow" = low mood/not okay, "E don do me" = at breaking point,
"I just wan rest" = exhaustion, "Dem dey stress me" = external pressure,
"I dey manage" = coping but struggling, "Abeg" = please/I beg you,
"Wahala" = trouble/problem, "No wahala" = no problem, "Omo" = wow/oh wow.
Respond in natural Pidgin mixed with English — warm, real, unhurried.
Example: "Ah, I hear you. E no easy at all. Wetin dey happen exactly?"`,
    lagos: `
LANGUAGE: This user speaks Lagos English — fast, confident, code-switching.
Understand: "I'm cooked" = burned out, "It's giving anxiety", "They're on my neck" = pressure,
"I no fit again" = done/exhausted, "The thing don do me" = overwhelmed.
Mirror their confident, street-smart energy. Use light slang naturally, not forcefully.`,
    student: `
LANGUAGE: This user speaks Nigerian Student English — campus life vocabulary,
mixed formal and informal. They say things like "this thing don do me",
"my CGPA don scatter", "e be like say I go carry this course over again".
Respond like a smart, empathetic coursemate — educated but real.`,
    home: `
LANGUAGE: This user speaks formal Nigerian Home English. Respond with warmth and structure —
closer to a counsellor tone. Culturally aware of family dynamics but no heavy slang.
Respectful, warm, professional.`,
    neutral: `
LANGUAGE: Respond in clear, warm English. Culturally aware of Nigerian context
but no slang. Professional warmth — empathetic but clear.`,
  }

  const modeBlocks: Record<string, string> = {
    listening: `
CURRENT MODE — LISTENER: The user needs to be heard right now.
Do NOT offer advice unless they explicitly ask for it.
Validate their feelings, reflect their words back, ask one gentle question at a time.
Never rush to solutions. Example: "That sounds really heavy. What's been the hardest part?"`,
    coach: `
CURRENT MODE — COACH: The user wants direction and action. Give structured, practical responses.
Use numbered steps when helpful. Ask: "What's one thing you could do today?"
Follow up after suggestions. Be their accountability partner.`,
    explorer: `
CURRENT MODE — EXPLORER: The user is in a reflective, curious state.
Ask Socratic questions. Go deeper. Take your time.
Example: "That's interesting — what do you think is underneath that feeling?"`,
    companion: `
CURRENT MODE — COMPANION: Keep it light, warm, casual — like a good friend checking in.
Low-pressure, fun, present. Laugh with them. Ask about their day.`,
    care: `
CURRENT MODE — CARE: The user may be in distress. Prioritise safety and compassion.
Be calm, grounding, and present. Provide crisis resources if needed.
Do not minimise or rush. Stay with them.`,
  }

  const culturalContext = `
CULTURAL CONTEXT — always hold this:
- "I'm fine" often means the opposite in this culture — probe gently
- Family pressure and parental expectations are major stressors — honour this context
- Financial stress during university carries shame here — normalise it
- Asking for mental health help takes courage — acknowledge that openly
- Religious faith matters to many users — respect it, never challenge it
- Social media comparison pressure is real and pervasive`

  const responseGuidelines = `
RESPONSE STYLE:
- Keep responses 2–4 sentences max unless the user asks for more
- This is a conversation, not an essay
- Never use bullet points or headers in responses — write like you speak
- One question per response, at the end if needed
- Never say "As an AI" or "I don't have feelings" — just be present`

  return [
    coreIdentity,
    specialisationBlocks[specKey] ?? specialisationBlocks.talk,
    languageBlocks[langKey] ?? languageBlocks.neutral,
    modeBlocks[activeMode] ?? modeBlocks.listening,
    culturalContext,
    responseGuidelines,
  ].join('\n')
}

// ─── Mode detection ───────────────────────────────────────────────────────────

function detectMode(userMessage: string): string {
  const msg = userMessage.toLowerCase()

  const crisisSignals = [
    'end my life', 'kill myself', 'want to die',
    'no reason to live', 'hurt myself', 'self harm', 'suicide',
  ]
  if (crisisSignals.some((s) => msg.includes(s))) return 'care'

  const ventingSignals = [
    'i hate', 'i cant', "i can't", 'so tired', 'done with',
    'e don do me', 'i dey stress', 'overwhelmed', 'breaking down',
    'crying', 'i just feel', 'nobody understands', 'i dont know',
    "i don't know", 'so frustrated', 'fed up', 'exhausted',
  ]
  if (ventingSignals.some((s) => msg.includes(s))) return 'listening'

  const coachSignals = [
    'what should i do', 'how do i', 'help me with', 'give me advice',
    'steps', 'action plan', 'goal', 'want to improve', 'how can i',
    'what can i do', 'tips', 'strategy',
  ]
  if (coachSignals.some((s) => msg.includes(s))) return 'coach'

  const explorerSignals = [
    'why do i', 'i wonder', 'thinking about', 'been reflecting',
    'not sure why', 'trying to understand', 'feel like maybe',
    'what does it mean', 'curious about',
  ]
  if (explorerSignals.some((s) => msg.includes(s))) return 'explorer'

  return 'companion'
}

function toLanguageProfileDetected(languageProfile: string): LanguageProfileDetected {
  const mapped = LANG_MAP[languageProfile] ?? languageProfile.toLowerCase()
  if (mapped === 'pidgin' || mapped === 'lagos' || mapped === 'student' || mapped === 'home') {
    return mapped
  }
  return 'neutral'
}

function hashExcerpt(message: string): string {
  const excerpt = message.trim().slice(0, 80).toLowerCase()
  return createHash('sha256').update(excerpt).digest('hex')
}

// ─── Reasoning transparency helpers ────────────────────────────────────────────

function getEmotionalIntensity(message: string): string {
  const high = [
    'e don do me', 'i cant', "i can't", 'done with',
    'breaking down', 'overwhelmed', 'crying', 'hate this',
    'no point', 'tired of everything', 'i give up',
  ]
  const medium = [
    'stressed', 'anxious', 'worried', 'struggling',
    'not okay', 'dey stress', 'wahala', 'hard',
  ]
  const msg = message.toLowerCase()
  if (high.some((s) => msg.includes(s))) return 'High'
  if (medium.some((s) => msg.includes(s))) return 'Medium'
  return 'Low'
}

function getMoodPattern(messages: Message[]): string {
  const userMessages = messages
    .filter((m) => m.sender === 'user')
    .map((m) => m.content.toLowerCase())

  const patterns = [
    { label: 'Academic stress',
      keywords: ['exam', 'cgpa', 'assignment', 'lecture',
                 'carry-over', 'school', 'test', 'study'] },
    { label: 'Financial pressure',
      keywords: ['money', 'broke', 'fees', 'allowance',
                 'feeding', 'cash', 'afford'] },
    { label: 'Relationship stress',
      keywords: ['boyfriend', 'girlfriend', 'family',
                 'friend', 'mum', 'dad', 'they said'] },
    { label: 'Work pressure',
      keywords: ['work', 'boss', 'job', 'office',
                 'colleague', 'deadline', 'career'] },
    { label: 'Self-worth',
      keywords: ['not good enough', 'failure', 'useless',
                 'why am i', 'hate myself', 'worthless'] },
  ]

  const scores = patterns.map((p) => ({
    label: p.label,
    score: userMessages.reduce((acc, msg) =>
      acc + p.keywords.filter((k) => msg.includes(k)).length, 0,
    ),
  }))

  const top = scores.sort((a, b) => b.score - a.score)[0]
  if (top.score === 0) return 'General emotional support'

  const confidence = Math.min(
    Math.round((top.score /
      (userMessages.length * 2)) * 100 + 40),
    95,
  )
  return `${top.label} — ${confidence}% confidence`
}

function getModeReason(mode: string): string {
  const reasons: Record<string, string> = {
    listening: 'High emotional intensity detected — user needs to feel heard before receiving advice',
    coach: 'User is seeking direction — action-oriented signals detected in message',
    explorer: 'Reflective tone detected — user is processing, not seeking solutions',
    companion: 'Low-intensity casual conversation — social support mode appropriate',
    care: 'Crisis signals detected — immediate safety response required',
  }
  return reasons[mode] || 'Default support mode'
}

function getMemoryUsed(messages: Message[]): string {
  const userMessages = messages
    .filter((m) => m.sender === 'user')
    .slice(0, -1)

  if (userMessages.length === 0)
    return 'First message — no prior context'
  if (userMessages.length < 3)
    return `${userMessages.length} prior messages in session`

  const topics: string[] = []
  const allText = userMessages
    .map((m) => m.content.toLowerCase()).join(' ')

  if (allText.includes('exam') || allText.includes('cgpa'))
    topics.push('academic pressure')
  if (allText.includes('money') || allText.includes('broke'))
    topics.push('financial stress')
  if (allText.includes('family') || allText.includes('mum'))
    topics.push('family dynamics')
  if (allText.includes('work') || allText.includes('job'))
    topics.push('work stress')

  if (topics.length === 0)
    return `${userMessages.length} prior messages in session`
  return `Referenced: ${topics.join(', ')} from earlier in session`
}

// ─── POST handler ─────────────────────────────────────────────────────────────

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

    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user')?.content ?? ''
    const riskResult = classifyRisk(lastUserMsg, messages)
    const detectedLanguage = toLanguageProfileDetected(languageProfile)
    const normalDetectedMode = detectMode(lastUserMsg)
    const detectedMode = riskResult.shouldEnterCareMode ? 'care' : normalDetectedMode

    // ── Crisis assessment ────────────────────────────────────────────────────
    const lastMessage = messages[messages.length - 1]?.content || lastUserMsg
    const crisisAssessment = assessCrisis(lastMessage, messages)
    const memoryExtraction = extractEmotionalMemory({
      userId: 'local',
      source: 'chat',
      text: lastMessage,
      riskResult,
      languageProfileDetected: detectedLanguage,
    })

    if (riskResult.riskLevel !== 'low') {
      const careResponse = buildCareModeResponse({
        userMessage: lastMessage,
        riskScore: riskResult.riskScore,
        riskLevel: riskResult.riskLevel,
        languageProfileDetected: detectedLanguage,
        triggersDetected: riskResult.matchedSignals,
        memoryUsed: [],
      })
      const crisisEvent = careResponse.shouldLogCrisisEvent
        ? {
            eventType: 'risk_escalation',
            riskLevel: riskResult.riskLevel,
            riskScore: riskResult.riskScore,
            matchedSignals: riskResult.matchedSignals,
            hashedExcerpt: hashExcerpt(lastMessage),
            createdAt: new Date().toISOString(),
          }
        : null
      const reasoning = {
        detectedLanguage: languageProfile,
        emotionalIntensity: getEmotionalIntensity(lastMessage),
        moodPattern: getMoodPattern(messages),
        modeSelected: 'care',
        modeReason: getModeReason('care'),
        specialisationApplied: specialisation,
        memoryUsed: getMemoryUsed(messages),
        crisisChecked: true,
        responseStyle: careResponse.responseType,
        crisisTier: crisisAssessment.tier,
        riskLevel: riskResult.riskLevel,
        riskScore: riskResult.riskScore,
      }

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
        memoryExtraction,
        reasoning,
      })
    }

    if (crisisAssessment.tier === 'stop') {
      return NextResponse.json({
        message: `I hear you, and I'm genuinely concerned about you right now.

Please reach out to someone who can really help:

📞 MANI Crisis Line: 08091726902 (free, available now)
📞 She Writes Woman: 0800 800 2000
📞 NIMH Lagos: 01-7731640

You don't have to face this alone. Please make that call. 🌿`,
        detectedMode: 'care',
        crisisAssessment,
        hardStop: true,
      })
    }

    // ── Reasoning transparency object ────────────────────────────────────────
    const reasoning = {
      detectedLanguage: languageProfile,
      emotionalIntensity: getEmotionalIntensity(lastMessage),
      moodPattern: getMoodPattern(messages),
      modeSelected: detectedMode,
      modeReason: getModeReason(detectedMode),
      specialisationApplied: specialisation,
      memoryUsed: getMemoryUsed(messages),
      crisisChecked: true,
      responseStyle: 'conversational, 2-4 sentences',
      crisisTier: crisisAssessment.tier,
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
    }

    // Graceful fallback when API key is missing
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        message:
          "I'm here and listening 🌿 (To enable real AI responses, add GROQ_API_KEY to your .env.local file.)",
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
    }

    const systemPrompt = buildSystemPrompt(specialisation, languageProfile, detectedMode, userName)

    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: openaiMessages,
      max_tokens: 400,
      temperature: 0.8,
    })

    const content = completion.choices?.[0]?.message?.content ?? "I'm here. Tell me more."

    return NextResponse.json({
      message: content,
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
  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json(
      { message: "I'm having trouble connecting right now. Please try again.", detectedMode: 'listening' },
      { status: 500 },
    )
  }
}
