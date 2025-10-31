// app/api/admin/features/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureToggle from "@/lib/models/FeatureToggle";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch all features
export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const features = await FeatureToggle.find({}).sort({ order: 1, featureName: 1 });

    return NextResponse.json({
      success: true,
      data: features,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch features" },
      { status: 500 }
    );
  }
}

// POST - Create a new feature
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const {
      featureKey,
      featureName,
      description,
      enabled = true,
      maintenanceMode = false,
      visibleToRoles = ["admin", "user"],
      route,
      adminRoute,
      sidebarSection = "both",
      icon,
      order = 0,
      isCore = false,
      metadata = {},
    } = body;

    // Validation
    if (!featureKey || !featureName) {
      return NextResponse.json(
        { success: false, message: "Feature key and name are required" },
        { status: 400 }
      );
    }

    // Check if feature already exists
    const existingFeature = await FeatureToggle.findOne({ featureKey });
    if (existingFeature) {
      return NextResponse.json(
        { success: false, message: "Feature with this key already exists" },
        { status: 400 }
      );
    }

    const feature = await FeatureToggle.create({
      featureKey,
      featureName,
      description,
      enabled,
      maintenanceMode,
      visibleToRoles,
      route,
      adminRoute,
      sidebarSection,
      icon,
      order,
      isCore,
      metadata,
      updatedBy: admin.email,
    });

    console.log(`✅ Feature created: ${featureName} by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      message: "Feature created successfully",
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
      { success: false, message: error.message || "Failed to create feature" },
      { status: 500 }
    );
  }
}
