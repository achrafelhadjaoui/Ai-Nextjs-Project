// app/api/profile/password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";
import bcrypt from "bcryptjs";

// POST - Change password
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "New passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const userProfile = await User.findById(user.id);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a password (OAuth users might not)
    if (!userProfile.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot change password for OAuth users. Please use your OAuth provider.",
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userProfile.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userProfile.password = hashedPassword;
    userProfile.updatedAt = new Date();

    await userProfile.save();

    console.log(`✅ Password changed: ${userProfile.email}`);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Password change error:", error);

    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to change password" },
      { status: 500 }
    );
  }
}
