import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { getEmailUserByEmail, normalizeEmail, upsertPasswordResetUser, validatePassword, verifyOtpForUser } from '@/lib/emailAuth'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Email, verification code, and a new password are required.' }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const user = getEmailUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    }

    const verification = verifyOtpForUser(user.id, otp, 'password_reset')
    if (!verification.ok) {
      const reason = verification.reason ?? 'invalid'
      return NextResponse.json({ error: reason === 'expired' ? 'This reset code has expired.' : reason === 'attempts_exhausted' ? 'This reset code has been invalidated.' : 'Incorrect reset code.' }, { status: 400 })
    }

    upsertPasswordResetUser(user.id, password)

    const sessionToken = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.displayName ?? user.email,
      firstName: user.displayName?.split(' ')[0] ?? undefined,
    })

    const response = NextResponse.json({ ok: true, message: 'Password updated.' })
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Unable to update password.' }, { status: 500 })
  }
}
