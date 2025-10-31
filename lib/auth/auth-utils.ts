// lib/auth/auth-utils.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Get the current NextAuth session
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require any authenticated user
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized - Please login to continue");
  }

  return user;
}

/**
 * Require admin role - throws error if not admin
 * Use this in API routes that require admin access
 */
export async function requireAdmin() {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Forbidden - Admin access required");
  }

  return user;
}

/**
 * Helper to create standardized error responses
 */
export function authErrorResponse(message: string = "Unauthorized", status: number = 401) {
  return NextResponse.json({ success: false, message }, { status });
}

/**
 * Wrapper for API route handlers with automatic auth checking
 * Returns properly formatted error responses
 */
export async function withAuth<T>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await requireAuth();
    return await handler(user);
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    throw error;
  }
}

/**
 * Wrapper for admin-only API route handlers
 * Returns properly formatted error responses
 */
export async function withAdmin<T>(
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await requireAdmin();
    return await handler(user);
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    throw error;
  }
}
