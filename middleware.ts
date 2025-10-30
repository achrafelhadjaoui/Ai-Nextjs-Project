import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Get authentication tokens
  const jwtToken = request.cookies.get("token")?.value;
  const nextAuthToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuthenticated = !!(jwtToken || nextAuthToken);

  // Define route types
  const isAuthPage = pathname.startsWith("/auth");
  const isAdminPage = pathname.startsWith("/admin");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isProtectedPage =
    isDashboardPage ||
    isAdminPage ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/saved-replies") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/onboarding");

  // 1. Protected routes - require authentication
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth pages - redirect if already logged in
  if (isAuthPage && isAuthenticated) {
    // Let the app handle role-based redirect
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Images and other static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
