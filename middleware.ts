import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/']

export function middleware(request: NextRequest) {
  const hasWalletConnected = request.cookies.get('wallet_connected')?.value === 'true' && request.cookies.get('luban_login')

  const { pathname } = request.nextUrl

  if (!hasWalletConnected && !publicPaths.includes(pathname)) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
