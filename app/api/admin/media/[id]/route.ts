// app/api/admin/media/[id]/route.ts
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { connectDB } from "@/lib/db/connect";
import Media from "@/lib/models/Media";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// DELETE - Delete a media file
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const media = await Media.findById(params.id);

    if (!media) {
      return NextResponse.json(
        { success: false, message: "Media not found" },
        { status: 404 }
      );
    }

    // Check if media is being used
    if (media.usedIn && media.usedIn.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete: File is being used in ${media.usedIn.length} place(s)`,
          usedIn: media.usedIn,
        },
        { status: 400 }
      );
    }

    // Delete file from filesystem
    try {
      await unlink(media.path);
    } catch (error) {
      // Continue anyway to clean up database
    }

    // Delete from database
    await media.deleteOne();


    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media metadata
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { alt, title, description, folder } = body;

    const media = await Media.findById(params.id);

    if (!media) {
      return NextResponse.json(
        { success: false, message: "Media not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (alt !== undefined) media.alt = alt;
    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    if (folder !== undefined) media.folder = folder;

    await media.save();


    return NextResponse.json({
      success: true,
      message: "Media updated successfully",
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
      { success: false, message: error.message || "Failed to update media" },
      { status: 500 }
    );
  }
}
