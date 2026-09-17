import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { deleteAccount } from '@/lib/accountStore'

export async function DELETE() {
  const user = getSessionUser()
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  if (!user || !token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deleteAccount(user.id, token)
    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
    return response
  } catch (error) {
    console.error('Account deletion failed:', error)
    return NextResponse.json({ error: 'Account deletion failed. No changes were completed.' }, { status: 500 })
  }
}