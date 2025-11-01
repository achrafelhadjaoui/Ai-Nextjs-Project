// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export async function POST(request: Request) {
  try {
    // Require authentication
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `File type ${file.type} is not allowed. Allowed types: images, PDF, Word, Excel, text files`,
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadPath = join(UPLOAD_DIR, folder);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = join(uploadPath, filename);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/${folder}/${filename}`;

    console.log(`✅ File uploaded: ${publicUrl} by user ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: file.name,
        storedFilename: filename,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);

    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
