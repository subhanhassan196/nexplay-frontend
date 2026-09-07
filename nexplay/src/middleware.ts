import { NextResponse, type NextRequest } from "next/server";

/**
 * Route-guarding middleware. Cheap, edge-runtime check: it only looks
 * at whether the access-token cookie is *present*, not whether it's
 * still cryptographically valid — that verification happens on every
 * real API call via the Express backend (see `requireAuth` there).
 * This keeps the middleware fast and dependency-free while still
 * preventing an obviously-logged-out visitor from flashing into
 * `/dashboard`, and an obviously-logged-in user from seeing `/login`.
 */
const ACCESS_TOKEN_COOKIE = "nexplay_access_token";

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isGuestOnly = GUEST_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register", "/forgot-password"],
};
