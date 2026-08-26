import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getSessionUserFromToken } from '@/lib/auth'

export async function GET() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  const user = await getSessionUserFromToken(token)
  return NextResponse.json({ user })
}
