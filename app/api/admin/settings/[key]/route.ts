// app/api/admin/settings/[key]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import AppSetting from "@/lib/models/AppSetting";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch a single setting
export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const setting = await AppSetting.findOne({ key: params.key });

    if (!setting) {
      return NextResponse.json(
        { success: false, message: "Setting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch setting" },
      { status: 500 }
    );
  }
}

// PUT - Update a single setting
export async function PUT(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { value, label, description, isPublic } = body;

    const setting = await AppSetting.findOne({ key: params.key });

    if (!setting) {
      return NextResponse.json(
        { success: false, message: "Setting not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (value !== undefined) setting.value = value;
    if (label !== undefined) setting.label = label;
    if (description !== undefined) setting.description = description;
    if (isPublic !== undefined) setting.isPublic = isPublic;
    setting.updatedBy = admin.id;

    await setting.save();

    console.log(`✅ Setting updated: ${params.key} by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      data: setting,
      message: "Setting updated successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update setting" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a setting
export async function DELETE(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const setting = await AppSetting.findOneAndDelete({ key: params.key });

    if (!setting) {
      return NextResponse.json(
        { success: false, message: "Setting not found" },
        { status: 404 }
      );
    }

    console.log(`🗑️ Setting deleted: ${params.key} by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete setting" },
      { status: 500 }
    );
  }
}
