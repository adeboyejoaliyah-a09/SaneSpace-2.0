import crypto from 'crypto'
import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          'Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your environment.',
      },
      { status: 503 },
    )
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'select_account')

  const state = crypto.randomBytes(32).toString('hex')
  authUrl.searchParams.set('state', state)
  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('sanespace_google_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/google',
    maxAge: 60 * 10,
  })

  return response
}
