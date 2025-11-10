// app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import AppSetting from "@/lib/models/AppSetting";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch all settings or by category
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const query = category ? { category } : {};
    const settings = await AppSetting.find(query).sort({ category: 1, key: 1 });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST - Create a new setting
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { key, value, type, category, label, description, isPublic } = body;

    // Validation
    if (!key || !label) {
      return NextResponse.json(
        { success: false, message: "Key and label are required" },
        { status: 400 }
      );
    }

    // Check if setting already exists
    const existing = await AppSetting.findOne({ key });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Setting with this key already exists" },
        { status: 400 }
      );
    }

    const setting = await AppSetting.create({
      key,
      value,
      type: type || "string",
      category: category || "general",
      label,
      description,
      isPublic: isPublic || false,
      updatedBy: admin.id,
    });


    return NextResponse.json({
      success: true,
      data: setting,
      message: "Setting created successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create setting" },
      { status: 500 }
    );
  }
}

// PUT - Bulk update settings
export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { settings } = body; // Array of { key, value }

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, message: "Settings must be an array" },
        { status: 400 }
      );
    }

    const updates = await Promise.all(
      settings.map(async (setting: { key: string; value: any }) => {
        return await AppSetting.findOneAndUpdate(
          { key: setting.key },
          {
            value: setting.value,
            updatedBy: admin.id,
          },
          { new: true }
        );
      })
    );


    return NextResponse.json({
      success: true,
      data: updates,
      message: `${updates.length} settings updated successfully`,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
