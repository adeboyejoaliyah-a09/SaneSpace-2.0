import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import {
  createEmailUser,
  createOtpCodeForUser,
  getEmailUserByEmail,
  invalidatePreviousOtpsForUser,
  normalizeEmail,
  isValidEmail,
  validatePassword,
  type EmailAuthUser,
} from '@/lib/emailAuth'
import { sendVerificationOtpEmail } from '@/lib/emailDelivery'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const displayName = typeof body?.name === 'string' ? body.name.trim() : undefined

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const existing = getEmailUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const user = createEmailUser({ email, password, displayName }) as EmailAuthUser
    invalidatePreviousOtpsForUser(user.id, 'email_verification')

    const otpRecord = createOtpCodeForUser(user.id, 'email_verification')
    const delivered = await sendVerificationOtpEmail(email, displayName || user.email.split('@')[0] || 'there', otpRecord.code)
    if (!delivered) {
      return NextResponse.json({ error: 'Unable to send verification code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Verification code sent.' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to create account.'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
