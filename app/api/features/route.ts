// app/api/features/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureToggle from "@/lib/models/FeatureToggle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Public endpoint to fetch enabled features
export async function GET(request: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || "user";

    // Fetch features that are:
    // 1. Enabled
    // 2. Not in maintenance mode (unless user is admin)
    // 3. Visible to user's role
    const query: any = {
      enabled: true,
    };

    // Non-admins can't see features in maintenance mode
    if (userRole !== "admin") {
      query.maintenanceMode = false;
    }

    // Filter by role visibility
    query.visibleToRoles = userRole;

    const features = await FeatureToggle.find(query)
      .select("-updatedBy -__v")
      .sort({ order: 1, featureName: 1 });

    // Transform to key-value map for easy consumption
    const featuresMap: Record<string, any> = {};
    features.forEach((feature) => {
      featuresMap[feature.featureKey] = {
        name: feature.featureName,
        description: feature.description,
        enabled: feature.enabled,
        maintenanceMode: feature.maintenanceMode,
        route: feature.route,
        adminRoute: userRole === "admin" ? feature.adminRoute : undefined,
        sidebarSection: feature.sidebarSection,
        icon: feature.icon,
        order: feature.order,
        metadata: feature.metadata,
      };
    });

    return NextResponse.json({
      success: true,
      data: featuresMap,
      features: features, // Also provide array format
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch features" },
      { status: 500 }
    );
  }
}
