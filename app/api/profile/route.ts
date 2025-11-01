// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";
import bcrypt from "bcryptjs";

// GET - Get current user profile
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const userProfile = await User.findById(user.id).select("-password -resetToken -resetTokenExpiry -verificationToken");

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userProfile,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const {
      name,
      bio,
      phone,
      location,
      company,
      website,
      timezone,
      language,
      image,
      notifications,
    } = body;

    const userProfile = await User.findById(user.id);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { success: false, message: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      userProfile.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        return NextResponse.json(
          { success: false, message: "Bio cannot exceed 500 characters" },
          { status: 400 }
        );
      }
      userProfile.bio = bio.trim();
    }

    if (phone !== undefined) userProfile.phone = phone.trim();
    if (location !== undefined) userProfile.location = location.trim();
    if (company !== undefined) userProfile.company = company.trim();
    if (website !== undefined) {
      // Basic URL validation
      if (website && !website.match(/^https?:\/\/.+/)) {
        return NextResponse.json(
          { success: false, message: "Website must be a valid URL (http:// or https://)" },
          { status: 400 }
        );
      }
      userProfile.website = website.trim();
    }
    if (timezone !== undefined) userProfile.timezone = timezone;
    if (language !== undefined) userProfile.language = language;
    if (image !== undefined) userProfile.image = image;
    if (notifications !== undefined) {
      userProfile.notifications = {
        email: notifications.email ?? userProfile.notifications?.email ?? true,
        push: notifications.push ?? userProfile.notifications?.push ?? true,
        sms: notifications.sms ?? userProfile.notifications?.sms ?? false,
      };
    }

    userProfile.updatedAt = new Date();
    await userProfile.save();

    console.log(`✅ Profile updated: ${userProfile.email}`);

    // Return updated profile without sensitive fields
    const updatedProfile = await User.findById(user.id).select(
      "-password -resetToken -resetTokenExpiry -verificationToken"
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error("Profile update error:", error);

    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
