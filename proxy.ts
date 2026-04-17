import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authCookieName = "lab_edu_token";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/courses") || pathname.startsWith("/experiments");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(authCookieName)?.value);

  if ((pathname === "/login" || pathname === "/register") && hasToken) {
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  if (isProtectedPath(pathname) && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/courses/:path*", "/experiments/:path*"],
};