import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "ghero_session"; // keep in sync with src/lib/auth.ts
const PROTECTED_PAGES = ["/account", "/admin"];
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Server-to-server callers that don't send a browser Origin; they authenticate by signature.
const ORIGIN_EXEMPT = ["/api/payment/webhook"];

/**
 * Runs before routes. Two cheap, optimistic checks:
 * 1. Protected pages without a session cookie redirect to their sign-in page
 *    (/admin/login for the admin panel, /login for accounts). The real session/role
 *    check happens in the page layouts and API handlers.
 * 2. CSRF defence in depth: mutating /api requests from a browser must come from our origin.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (MUTATING.has(request.method) && !ORIGIN_EXEMPT.some((p) => pathname.startsWith(p))) {
      const origin = request.headers.get("origin");
      if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Cross-origin request blocked", code: "BAD_ORIGIN" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPage && pathname !== "/admin/login" && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (!isAdminPage && PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!request.cookies.has(SESSION_COOKIE_NAME)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(login);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/account/:path*", "/admin/:path*"],
};
