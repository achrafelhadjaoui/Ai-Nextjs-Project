import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";

/**
 * This endpoint forces a session refresh by fetching fresh user data from DB
 * Call this after updating user role in the database
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Session will be refreshed on next request",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { success: false, message: "Failed to refresh session" },
      { status: 500 }
    );
  }
}
