import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/models/User";

/**
 * Get current authenticated user
 * Supports both NextAuth session (web) and JWT Bearer token (extension)
 */
export async function GET(request: NextRequest) {
  try {
    // Check for Bearer token from extension
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extension auth with Bearer token
      const token = authHeader.substring(7);

      // Verify JWT token
      const { verify } = await import('jsonwebtoken');
      const secret = process.env.NEXTAUTH_SECRET;

      if (!secret) {
        return NextResponse.json(
          { success: false, error: "Server configuration error" },
          { status: 500 }
        );
      }

      try {
        const decoded = verify(token, secret) as any;
        const userId = decoded.sub || decoded.id;

        // Connect to database and verify user exists
        await connectDB();
        const dbUser = await User.findById(userId).select('-password -resetToken -resetTokenExpiry -verificationToken');

        if (!dbUser) {
          return NextResponse.json(
            { success: false, error: "User no longer exists" },
            { status: 404 }
          );
        }

        user = {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          isVerified: dbUser.isVerified,
          image: dbUser.image,
        };
      } catch (error) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }
    } else {
      // Web app auth with session
      user = await getCurrentUser();

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }

      // Verify user still exists in database
      await connectDB();
      const dbUser = await User.findById(user.id);

      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: "User no longer exists" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        image: user.image,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
