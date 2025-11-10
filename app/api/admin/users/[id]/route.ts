// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify admin using session
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Fetch user by ID
    const user = await User.findById(params.id, "-password -verificationToken -resetToken");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

  } catch (error: any) {

    if (error.message === "Unauthorized") {
      return authErrorResponse();
    }
    
    if (error.message.includes("Admin access required")) {
      return authErrorResponse("Forbidden: Admin access required", 403);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while fetching user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify admin using session
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Validate user existence
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await user.deleteOne();

    return NextResponse.json(
      { success: true, message: "User deleted successfully" },
      { status: 200 }
    );

  } catch (error: any) {

    if (error.message === "Unauthorized") {
      return authErrorResponse();
    }

    if (error.message.includes("Admin access required")) {
      return authErrorResponse("Forbidden: Admin access required", 403);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while deleting user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify admin using session
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, email, role, isVerified } = body;

    // Validate email format if provided
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (typeof isVerified === "boolean") user.isVerified = isVerified;

    await user.save();

    return NextResponse.json(
      { success: true, message: "User updated successfully", data: user },
      { status: 200 }
    );

  } catch (error: any) {

    if (error.message === "Unauthorized") {
      return authErrorResponse();
    }

    if (error.message.includes("Admin access required")) {
      return authErrorResponse("Forbidden: Admin access required", 403);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while updating user" },
      { status: 500 }
    );
  }
}