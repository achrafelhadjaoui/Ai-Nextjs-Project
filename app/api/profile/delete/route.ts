// app/api/profile/delete/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import SupportTicket from "@/lib/models/SupportTicket";
import FeatureRequest from "@/lib/models/FeatureRequest";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";
import bcrypt from "bcryptjs";

// DELETE - Delete user account
export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { password, confirmDelete } = body;

    // Validation
    if (!confirmDelete) {
      return NextResponse.json(
        { success: false, message: "Please confirm account deletion" },
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

    // Prevent admin from deleting their own account
    if (userProfile.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin accounts cannot be self-deleted. Contact another admin for assistance.",
        },
        { status: 403 }
      );
    }

    // Verify password if user has one (not OAuth users)
    if (userProfile.password) {
      if (!password) {
        return NextResponse.json(
          { success: false, message: "Password is required to delete account" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, userProfile.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, message: "Incorrect password" },
          { status: 400 }
        );
      }
    }

    // Delete or anonymize user data
    // Option 1: Hard delete (removes all data)
    // await User.findByIdAndDelete(user.id);

    // Option 2: Soft delete (anonymize data) - RECOMMENDED for data retention
    userProfile.name = "Deleted User";
    userProfile.email = `deleted_${user.id}@deleted.local`;
    userProfile.password = undefined;
    userProfile.googleId = undefined;
    userProfile.image = undefined;
    userProfile.bio = undefined;
    userProfile.phone = undefined;
    userProfile.location = undefined;
    userProfile.company = undefined;
    userProfile.website = undefined;
    userProfile.isVerified = false;
    userProfile.verificationToken = undefined;
    userProfile.resetToken = undefined;
    userProfile.resetTokenExpiry = undefined;
    await userProfile.save();

    // Anonymize user's support tickets
    await SupportTicket.updateMany(
      { userId: user.id },
      {
        $set: {
          userName: "Deleted User",
          userEmail: `deleted_${user.id}@deleted.local`,
        },
      }
    );

    // Anonymize user's feature requests
    await FeatureRequest.updateMany(
      { userId: user.id },
      {
        $set: {
          userName: "Deleted User",
          userEmail: `deleted_${user.id}@deleted.local`,
        },
      }
    );

    console.log(`🗑️ User account deleted: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully. You will be logged out.",
    });
  } catch (error: any) {
    console.error("Account deletion error:", error);

    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}
