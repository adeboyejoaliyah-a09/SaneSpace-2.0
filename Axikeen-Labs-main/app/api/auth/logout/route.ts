import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'
import { revokeSession } from '@/lib/sessionStore'
import { cookies } from 'next/headers'

export async function POST() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (token) revokeSession(token)
  const response = NextResponse.json({ success: true }, { status: 200 })

  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })

  return response
}
