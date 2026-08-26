import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth'

const protectedPaths = ['/dashboard', '/chat', '/mood', '/profile', '/onboarding']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token || !(await verifySessionToken(token))) {
    const loginUrl = new URL('/sign-in', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth/google|_next|.*\..*).*)'],
}
