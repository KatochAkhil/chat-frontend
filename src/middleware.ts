import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/chat", "/empty", "/loading"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("nexus_access_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth/login") && token) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/login", "/chat/:path*", "/empty", "/loading"]
};
