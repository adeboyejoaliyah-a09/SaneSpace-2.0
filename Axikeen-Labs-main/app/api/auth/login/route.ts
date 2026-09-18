import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, createSessionToken } from '@/lib/auth'
import { getEmailUserByEmail, normalizeEmail, verifyPassword } from '@/lib/emailAuth'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? normalizeEmail(body.email) : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = verifyPassword(email, password)
    if (!user) {
      const exists = getEmailUserByEmail(email)
      return NextResponse.json({ error: exists ? 'Incorrect password.' : 'No account was found for this email.' }, { status: 401 })
    }

    const sessionToken = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.displayName ?? user.email,
      firstName: user.displayName?.split(' ')[0] ?? undefined,
    })

    const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.displayName ?? user.email } })
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 })
  }
}
