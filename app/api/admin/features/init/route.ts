// app/api/admin/features/init/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureToggle from "@/lib/models/FeatureToggle";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// POST - Initialize default features
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    // Check if features already exist
    const existingCount = await FeatureToggle.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Features already initialized (${existingCount} features exist)`,
        },
        { status: 400 }
      );
    }

    // Define default core features
    const defaultFeatures = [
      {
        featureKey: "feature-requests",
        featureName: "Feature Requests",
        description: "Allow users to submit and vote on feature requests",
        enabled: true,
        maintenanceMode: false,
        visibleToRoles: ["admin", "user"],
        route: "/feature-requests",
        adminRoute: "/admin/feature-requests",
        sidebarSection: "both",
        icon: "lightbulb",
        order: 10,
        isCore: true,
        updatedBy: admin.email,
      },
      {
        featureKey: "user-management",
        featureName: "User Management",
        description: "Admin panel for managing users",
        enabled: true,
        maintenanceMode: false,
        visibleToRoles: ["admin"],
        route: null,
        adminRoute: "/admin/dashboard",
        sidebarSection: "admin",
        icon: "users",
        order: 1,
        isCore: true,
        updatedBy: admin.email,
      },
      {
        featureKey: "settings",
        featureName: "Settings Management",
        description: "Admin panel for managing app settings",
        enabled: true,
        maintenanceMode: false,
        visibleToRoles: ["admin"],
        route: null,
        adminRoute: "/admin/settings",
        sidebarSection: "admin",
        icon: "settings",
        order: 20,
        isCore: true,
        updatedBy: admin.email,
      },
      {
        featureKey: "analytics",
        featureName: "Analytics Dashboard",
        description: "View app analytics and statistics",
        enabled: false,
        maintenanceMode: false,
        visibleToRoles: ["admin"],
        route: null,
        adminRoute: "/admin/analytics",
        sidebarSection: "admin",
        icon: "chart",
        order: 30,
        isCore: false,
        updatedBy: admin.email,
      },
    ];

    const features = await FeatureToggle.insertMany(defaultFeatures);

    console.log(`✅ Initialized ${features.length} default features by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${features.length} default features`,
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
      { success: false, message: error.message || "Failed to initialize features" },
      { status: 500 }
    );
  }
}
