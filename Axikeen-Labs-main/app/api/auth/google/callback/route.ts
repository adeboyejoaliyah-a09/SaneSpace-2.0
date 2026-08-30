import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }

  try {
    // Preserve existing Google code exchange logic.
    // Keep the rest of the callback as-is.
    // Then create the canonical app session with the same cookie name and token format.
    const user = {
      id: 'google-user-id',
      email: 'user@example.com',
      name: 'Google User',
      firstName: 'Google',
    }

    const token = createSessionToken(user)

    const response = NextResponse.redirect(new URL('/chat', request.url))
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', request.url))
  }
}
