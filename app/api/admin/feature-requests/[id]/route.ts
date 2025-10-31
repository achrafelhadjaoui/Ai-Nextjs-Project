import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureRequest from "@/lib/models/FeatureRequest";
import { cookies } from "next/headers";
import { verifyToken } from "@/utils/jwt";
import mongoose from "mongoose";

// Helper function to verify admin
async function verifyAdmin() {
  const token = cookies().get("token")?.value;
  if (!token) {
    return { isAdmin: false, error: "No token provided" };
  }

  const decoded = verifyToken(token) as any;
  if (!decoded || decoded.role !== "admin") {
    return { isAdmin: false, error: "Unauthorized access" };
  }

  return { isAdmin: true, decoded };
}

// PUT - Update feature request (admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const { isAdmin, error } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feature request ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status, adminResponse } = body;

    // Validate status if provided
    if (status && !['pending', 'in-progress', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Find and update the feature request
    const featureRequest = await FeatureRequest.findById(id);
    if (!featureRequest) {
      return NextResponse.json(
        { success: false, message: "Feature request not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (status) featureRequest.status = status;
    if (adminResponse !== undefined) featureRequest.adminResponse = adminResponse;

    await featureRequest.save();

    return NextResponse.json(
      {
        success: true,
        message: "Feature request updated successfully",
        data: featureRequest
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Error updating feature request:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while updating feature request" },
      { status: 500 }
    );
  }
}

// DELETE - Delete feature request (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const { isAdmin, error } = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: error },
        { status: 403 }
      );
    }

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feature request ID" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Find and delete the feature request
    const featureRequest = await FeatureRequest.findByIdAndDelete(id);
    if (!featureRequest) {
      return NextResponse.json(
        { success: false, message: "Feature request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feature request deleted successfully"
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Error deleting feature request:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while deleting feature request" },
      { status: 500 }
    );
  }
}
