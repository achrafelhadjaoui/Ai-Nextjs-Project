// app/api/admin/media/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Media from "@/lib/models/Media";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch all media files
export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');
    const type = searchParams.get('type'); // e.g., 'image'

    const query: any = {};

    if (folder) {
      query.folder = folder;
    }

    if (type) {
      query.mimetype = { $regex: `^${type}/` };
    }

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(100); // Pagination can be added later

    return NextResponse.json({
      success: true,
      data: media,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch media" },
      { status: 500 }
    );
  }
}
