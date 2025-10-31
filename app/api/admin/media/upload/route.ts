// app/api/admin/media/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { connectDB } from "@/lib/db/connect";
import Media from "@/lib/models/Media";
import { requireAdmin } from "@/lib/auth/auth-utils";

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'general';
    const alt = formData.get('alt') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storedFilename = `${timestamp}-${sanitizedFilename}`;
    const filePath = path.join(uploadDir, storedFilename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Get image dimensions (if it's an image)
    let width, height;
    if (file.type.startsWith('image/')) {
      try {
        // For now, we'll skip dimension detection to keep it simple
        // You can add sharp or image-size library later
        width = undefined;
        height = undefined;
      } catch (error) {
        console.log('Could not get image dimensions:', error);
      }
    }

    // Save to database
    const media = await Media.create({
      filename: file.name,
      storedFilename,
      mimetype: file.type,
      size: file.size,
      url: `/uploads/${folder}/${storedFilename}`,
      path: filePath,
      folder,
      alt: alt || file.name,
      title: title || file.name,
      uploadedBy: admin.id,
      width,
      height,
    });

    console.log(`✅ File uploaded: ${file.name} by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: media,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
