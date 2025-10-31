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

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔒 Middleware check:", {
      pathname,
      isAuthenticated,
      role: token?.role,
      email: token?.email
    });
  }

  // Define route types
  const isAuthPage = pathname.startsWith("/auth");
  const isAdminPage = pathname.startsWith("/admin");
  const isUserDashboard = pathname === "/dashboard";
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    isAdminPage ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/saved-replies") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/feature-requests") ||
    pathname.startsWith("/onboarding");

  // 1. Protected routes - require authentication
  if (isProtectedPage && !isAuthenticated) {
    console.log("⛔ Redirecting to login - not authenticated");
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth pages - redirect if already logged in
  if (isAuthPage && isAuthenticated && !pathname.includes("/error")) {
    console.log("✅ Already authenticated - redirecting based on role");
    // Redirect to appropriate dashboard based on role
    const redirectPath = token.role === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 3. Admin routes - check role
  if (isAdminPage && isAuthenticated) {
    if (token.role !== "admin") {
      console.log("⛔ Access denied - not admin. Role:", token.role);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    console.log("✅ Admin access granted");
  }

  // 4. Redirect admin users from /dashboard to /admin/dashboard
  if (isUserDashboard && isAuthenticated && token.role === "admin") {
    console.log("🔄 Admin accessing user dashboard - redirecting to admin dashboard");
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
