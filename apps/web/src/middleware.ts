import { NextResponse, type NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ??
    req.cookies.get('__Secure-authjs.session-token')?.value
  const isLoggedIn = Boolean(sessionToken)
  const isAppRoute = req.nextUrl.pathname.startsWith('/app')

  if (isAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
}

export const config = {
  matcher: ['/app/:path*'],
}
