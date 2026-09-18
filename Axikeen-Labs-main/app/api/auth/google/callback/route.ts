import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { getUserProfile } from '@/lib/profileStore'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const expectedState = request.cookies.get('sanespace_google_oauth_state')?.value

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }

  const stateMatches = Boolean(
    state &&
      expectedState &&
      Buffer.byteLength(state) === Buffer.byteLength(expectedState) &&
      crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState)),
  )

  if (!code || !stateMatches) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? new URL('/api/auth/google/callback', request.url).toString()
    if (!clientId || !clientSecret) throw new Error('Google OAuth is not configured')

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenResponse.json() as { id_token?: string }
    if (!tokenResponse.ok || !tokens.id_token) throw new Error('Google token exchange failed')

    const identityResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`)
    const identity = await identityResponse.json() as {
      aud?: string
      iss?: string
      sub?: string
      email?: string
      email_verified?: string
      name?: string
      given_name?: string
    }
    if (!identityResponse.ok || identity.aud !== clientId || !['accounts.google.com', 'https://accounts.google.com'].includes(identity.iss ?? '') || !identity.sub || !identity.email || identity.email_verified !== 'true') {
      throw new Error('Invalid Google identity')
    }

    const user = {
      id: `google:${identity.sub}`,
      email: identity.email,
      name: identity.name,
      firstName: identity.given_name ?? identity.name?.split(' ')[0],
    }

    const token = createSessionToken(user)

    const profile = getUserProfile(user.id)
    const redirectUrl = profile?.onboardingComplete ? new URL('/chat', request.url) : new URL('/onboarding', request.url)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    response.cookies.delete('sanespace_google_oauth_state')

    return response
  } catch {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }
}
