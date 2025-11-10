// app/api/admin/features/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureToggle from "@/lib/models/FeatureToggle";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch a single feature
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await connectDB();

    const feature = await FeatureToggle.findById(params.id);

    if (!feature) {
      return NextResponse.json(
        { success: false, message: "Feature not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feature,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch feature" },
      { status: 500 }
    );
  }
}

// PATCH - Update a feature
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();

    const feature = await FeatureToggle.findById(params.id);

    if (!feature) {
      return NextResponse.json(
        { success: false, message: "Feature not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      "featureName",
      "description",
      "enabled",
      "maintenanceMode",
      "visibleToRoles",
      "route",
      "adminRoute",
      "sidebarSection",
      "icon",
      "order",
      "metadata",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (feature as any)[field] = body[field];
      }
    });

    feature.updatedBy = admin.email;
    await feature.save();


    return NextResponse.json({
      success: true,
      message: "Feature updated successfully",
      data: feature,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update feature" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a feature
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const feature = await FeatureToggle.findById(params.id);

    if (!feature) {
      return NextResponse.json(
        { success: false, message: "Feature not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of core features
    if (feature.isCore) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete core features. You can disable them instead.",
        },
        { status: 400 }
      );
    }

    await feature.deleteOne();


    return NextResponse.json({
      success: true,
      message: "Feature deleted successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete feature" },
      { status: 500 }
    );
  }
}
