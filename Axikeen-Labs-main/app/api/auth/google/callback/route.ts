import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const nextUrl = new URL('/', request.url)

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_error', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=missing_code', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_not_configured', request.url))
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed')
    }

    const tokenData = await tokenResponse.json() as {
      access_token?: string
      id_token?: string
    }

    const idToken = tokenData.id_token
    if (!idToken) {
      throw new Error('No ID token returned')
    }

    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8')) as {
      email?: string
      name?: string
      given_name?: string
      family_name?: string
      picture?: string
      sub?: string
    }

    const user = {
      id: payload.sub ?? `google-${Date.now()}`,
      email: payload.email,
      name: payload.name,
      firstName: payload.given_name,
      lastName: payload.family_name,
      avatarUrl: payload.picture,
      provider: 'google',
      createdAt: new Date().toISOString(),
    }

    const sessionToken = await createSessionToken(user)
    cookies().set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    nextUrl.pathname = '/onboarding'
    return NextResponse.redirect(nextUrl)
  } catch (error) {
    console.error('Google auth callback error', error)
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }
}
