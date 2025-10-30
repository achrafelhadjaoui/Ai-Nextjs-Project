import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Logout API Route
 * Clears both JWT token and NextAuth session cookies
 */
export async function POST() {
  try {
    const cookieStore = cookies();

    // Clear JWT token (for Email/Password auth)
    cookieStore.delete("token");

    // Clear NextAuth session cookies (for Google OAuth)
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("__Secure-next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("__Secure-next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("__Secure-next-auth.callback-url");

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
