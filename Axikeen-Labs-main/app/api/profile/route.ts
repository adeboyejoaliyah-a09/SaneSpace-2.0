import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUserProfile, updateUserProfile } from '@/lib/profileStore'
import { isSupportedLanguage, normalizeLanguageId } from '@/lib/languages'

const MAX_FIELD_LENGTH = 120
const MAX_GOAL_LENGTH = 500
const VALID_MODES = new Set(['Therapy Support', 'Life Coaching', 'Just to Talk', 'Student Support', 'Chill / Play', 'Work & Career'])

function text(value: unknown, maxLength: number): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ profile: getUserProfile(user.id) })
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body || Array.isArray(body)) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const specialisation = text(body.specialisation, MAX_FIELD_LENGTH)
  const languageProfile = text(body.languageProfile, MAX_FIELD_LENGTH)
  const challenges = body.challenges === undefined
    ? undefined
    : Array.isArray(body.challenges) && body.challenges.length <= 20 && body.challenges.every((item) => typeof item === 'string' && item.length <= MAX_FIELD_LENGTH)
      ? body.challenges.map((item) => (item as string).trim()).filter(Boolean)
      : null

  if (specialisation && !VALID_MODES.has(specialisation)) return NextResponse.json({ error: 'Invalid specialisation' }, { status: 400 })
  if (languageProfile && !isSupportedLanguage(languageProfile)) return NextResponse.json({ error: 'Invalid language profile' }, { status: 400 })
  if (challenges === null) return NextResponse.json({ error: 'Invalid challenges' }, { status: 400 })
  if (body.onboardingComplete !== undefined && typeof body.onboardingComplete !== 'boolean') return NextResponse.json({ error: 'Invalid onboarding status' }, { status: 400 })

  const profile = updateUserProfile(user.id, {
    firstName: text(body.firstName, MAX_FIELD_LENGTH),
    lastName: text(body.lastName, MAX_FIELD_LENGTH),
    specialisation,
    languageProfile: languageProfile ? normalizeLanguageId(languageProfile) : languageProfile,
    currentMood: text(body.currentMood, MAX_FIELD_LENGTH),
    challenges,
    wellnessGoal: text(body.wellnessGoal, MAX_GOAL_LENGTH),
    onboardingComplete: body.onboardingComplete as boolean | undefined,
  })
  return NextResponse.json({ profile })
}