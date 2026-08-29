import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, getSessionUserFromToken } from '@/lib/auth'

// Curated calm/reassuring premade ElevenLabs voices — kept in sync with
// VOICE_OPTIONS in app/chat/voice/page.tsx. Validating against this list
// server-side stops the route being used as an open relay for arbitrary
// voiceIds against our API key.
const ALLOWED_VOICE_IDS = new Set([
  '21m00Tcm4TlvDq8ikWAM', // Rachel — calm & warm
  'EXAVITQu4vr4xnSDxMaL', // Bella — soft & soothing
  'ErXwobaYiN019PkySvjV', // Antoni — gentle & reassuring
])
const MAX_TEXT_LENGTH = 800
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 8
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string) {
  const now = Date.now()
  const bucket = rateLimitBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) return false
  bucket.count += 1
  return true
}

export async function POST(req: NextRequest) {
  const sessionToken = cookies().get(AUTH_COOKIE_NAME)?.value
  const sessionUser = sessionToken ? await getSessionUserFromToken(sessionToken) : null
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { text?: string; voiceId?: string } | null
  const text = body?.text?.trim()
  const voiceId = body?.voiceId

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'text and voiceId are required' }, { status: 400 })
  }
  if (!ALLOWED_VOICE_IDS.has(voiceId)) {
    return NextResponse.json({ error: 'Unknown voiceId' }, { status: 400 })
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Text is too long' }, { status: 413 })
  }
  if (!checkRateLimit(sessionUser.id)) {
    return NextResponse.json({ error: 'Too many text-to-speech requests' }, { status: 429 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs is not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Text-to-speech request failed' }, { status: 502 })
    }

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'ElevenLabs request failed' }, { status: 502 })
  }
}
