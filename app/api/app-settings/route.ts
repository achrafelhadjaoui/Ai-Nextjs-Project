// app/api/app-settings/route.ts
// Public endpoint for fetching app settings (only returns isPublic=true settings)
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import AppSetting from "@/lib/models/AppSetting";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const keys = searchParams.get("keys")?.split(","); // Fetch specific keys

    let query: any = { isPublic: true };

    if (category) {
      query.category = category;
    }

    if (keys && keys.length > 0) {
      query.key = { $in: keys };
    }

    const settings = await AppSetting.find(query, "key value type category label");

    // Return as key-value map for easier consumption
    const settingsMap = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
