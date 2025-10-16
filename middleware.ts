import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const publicPaths = ["/login", "/register", "/api/auth"];

const walletProtectedPaths = ["/dragon-ball-client", "/dragon-ball-server"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
  return NextResponse.next();
}

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (walletProtectedPaths.some((path) => pathname.startsWith(path))) {
    const hasWalletConnected =
      request.cookies.get("wallet_connected")?.value === "true" &&
      request.cookies.get("luban_login");

    if (!hasWalletConnected) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
