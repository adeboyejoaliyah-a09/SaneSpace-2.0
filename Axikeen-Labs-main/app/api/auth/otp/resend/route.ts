import { NextResponse } from 'next/server'
import { canRequestOtp, createOtpCodeForUser, getEmailUserByEmail, invalidatePreviousOtpsForUser, normalizeEmail, isValidEmail } from '@/lib/emailAuth'
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail } from '@/lib/emailDelivery'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    const purpose = body?.purpose === 'password_reset' ? 'password_reset' : 'email_verification'

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const user = getEmailUserByEmail(email)
    if (!user) {
      return NextResponse.json({ ok: true, message: 'If that account exists, a new code has been sent.' })
    }

    if (!canRequestOtp(user.id, purpose)) {
      return NextResponse.json({ error: 'Please wait before requesting a new code.' }, { status: 429 })
    }

    invalidatePreviousOtpsForUser(user.id, purpose)
    const otpRecord = createOtpCodeForUser(user.id, purpose)
    const delivered = purpose === 'password_reset'
      ? await sendPasswordResetOtpEmail(email, user.displayName || user.email.split('@')[0] || 'there', otpRecord.code)
      : await sendVerificationOtpEmail(email, user.displayName || user.email.split('@')[0] || 'there', otpRecord.code)

    if (!delivered) {
      return NextResponse.json({ error: 'Unable to send a new code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'A new code has been sent.' })
  } catch {
    return NextResponse.json({ error: 'Unable to send a new verification code.' }, { status: 500 })
  }
}
