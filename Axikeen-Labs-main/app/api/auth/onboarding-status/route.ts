import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { getUserProfile } from '@/lib/profileStore'

export async function GET() {
  const user = getSessionUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })

  const profile = getUserProfile(user.id)
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    profile: profile ? { onboardingComplete: profile.onboardingComplete, preferredName: profile.preferredName } : null,
  })
}
