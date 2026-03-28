import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('session')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Full validation via /api/me: JWT + user exists in DB + tokenVersion
  const meUrl = new URL('/api/me', request.url)
  const res = await fetch(meUrl.toString(), {
    headers: { cookie: `session=${token}` },
  })

  if (res.status === 401) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('session')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|api/me|api/csv|api/uploads).*)',
  ],
}
