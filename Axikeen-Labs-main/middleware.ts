import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth-edge'

const PUBLIC_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth/google',
  '/api/auth/google/callback',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const user = await verifySessionToken(token)

  const isPublic =
    PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth/')

  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up'

  let sessionIsRevoked = false
  if (user && !isPublic && !pathname.startsWith('/api/auth/')) {
    const sessionResponse = await fetch(new URL('/api/auth/session', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    }).catch(() => null)
    if (!sessionResponse?.ok) sessionIsRevoked = true
    else {
      const session = await sessionResponse.json().catch(() => null) as { user?: unknown } | null
      sessionIsRevoked = !session?.user
    }
  }

  if ((!user || sessionIsRevoked) && !isPublic && !pathname.startsWith('/api/auth/')) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth/google|_next/static|_next/image|favicon.ico).*)'],
}
