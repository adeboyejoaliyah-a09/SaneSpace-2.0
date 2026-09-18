import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { getEmailUserByEmail, markEmailVerified, normalizeEmail, verifyOtpForUser } from '@/lib/emailAuth'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and verification code are required.' }, { status: 400 })
    }

    const user = getEmailUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    const verification = verifyOtpForUser(user.id, otp, 'email_verification')
    if (!verification.ok) {
      const reason = verification.reason ?? 'invalid'
      return NextResponse.json({ error: reason === 'expired' ? 'This code has expired. Request a new one.' : reason === 'attempts_exhausted' ? 'This code has been invalidated after too many attempts.' : 'Incorrect code. Please try again.' }, { status: 400 })
    }

    markEmailVerified(user.id)

    const sessionToken = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.displayName ?? user.email,
      firstName: user.displayName?.split(' ')[0] ?? undefined,
    })

    const response = NextResponse.json({ ok: true, message: 'Email verified.', user: { id: user.id, email: user.email } })
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Unable to verify this code.' }, { status: 500 })
  }
}
