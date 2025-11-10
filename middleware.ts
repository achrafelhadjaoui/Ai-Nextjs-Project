// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, etc.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/auth/error")
  ) {
    return NextResponse.next();
  }

  // Get authentication token from NextAuth
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!token;


  // Define route types
  const isAuthPage = pathname.startsWith("/auth");
  const isAdminPage = pathname.startsWith("/admin");
  const isUserDashboard = pathname === "/dashboard";
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    isAdminPage ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/feature-requests") ||
    pathname.startsWith("/onboarding");

  // 1. Protected routes - require authentication
  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth pages - redirect if already logged in
  if (isAuthPage && isAuthenticated && !pathname.includes("/error")) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = token.role === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 3. Onboarding check - redirect to onboarding if not completed (skip for admins)
  const isOnboarding = pathname === "/onboarding";
  if (isAuthenticated && token.role !== "admin") {
    // If user hasn't completed onboarding and trying to access protected pages
    if (token.onboardingCompleted === false && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // If user already completed onboarding, don't let them access onboarding page
    if (token.onboardingCompleted === true && isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Admin routes - check role
  if (isAdminPage && isAuthenticated) {
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 5. Redirect admin users from /dashboard to /admin/dashboard
  if (isUserDashboard && isAuthenticated && token.role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
