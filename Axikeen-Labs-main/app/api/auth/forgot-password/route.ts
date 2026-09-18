import { NextResponse } from 'next/server'
import { createOtpCodeForUser, getEmailUserByEmail, invalidatePreviousOtpsForUser, isValidEmail, normalizeEmail } from '@/lib/emailAuth'
import { sendPasswordResetOtpEmail } from '@/lib/emailDelivery'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    const user = getEmailUserByEmail(email)
    if (!user) {
      return NextResponse.json({ ok: true, message: 'If that account exists, a reset code has been sent.' })
    }

    invalidatePreviousOtpsForUser(user.id, 'password_reset')
    const otpRecord = createOtpCodeForUser(user.id, 'password_reset')
    const delivered = await sendPasswordResetOtpEmail(email, user.displayName || user.email.split('@')[0] || 'there', otpRecord.code)
    if (!delivered) {
      return NextResponse.json({ error: 'Unable to send reset code. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: 'Reset code sent.' })
  } catch {
    return NextResponse.json({ error: 'Unable to process your password reset request.' }, { status: 500 })
  }
}
