import { NextRequest, NextResponse } from 'next/server'

// Curated calm/reassuring premade ElevenLabs voices — kept in sync with
// VOICE_OPTIONS in app/chat/voice/page.tsx. Validating against this list
// server-side stops the route being used as an open relay for arbitrary
// voiceIds against our API key.
const ALLOWED_VOICE_IDS = new Set([
  '21m00Tcm4TlvDq8ikWAM', // Rachel — calm & warm
  'EXAVITQu4vr4xnSDxMaL', // Bella — soft & soothing
  'ErXwobaYiN019PkySvjV', // Antoni — gentle & reassuring
])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { text?: string; voiceId?: string } | null
  const text = body?.text?.trim()
  const voiceId = body?.voiceId

  if (!text || !voiceId) {
    return NextResponse.json({ error: 'text and voiceId are required' }, { status: 400 })
  }
  if (!ALLOWED_VOICE_IDS.has(voiceId)) {
    return NextResponse.json({ error: 'Unknown voiceId' }, { status: 400 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs is not configured' }, { status: 503 })
  }

  // Free tier is character-limited per month — cap a single reply so one
  // long AI response can't burn a disproportionate chunk of the quota.
  const safeText = text.slice(0, 600)

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: safeText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return NextResponse.json({ error: 'ElevenLabs request failed', detail }, { status: res.status })
    }

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ error: 'ElevenLabs request failed' }, { status: 502 })
  }
}
