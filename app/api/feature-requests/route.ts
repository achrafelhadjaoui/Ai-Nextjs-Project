import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureRequest from "@/lib/models/FeatureRequest";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch all feature requests (public - no auth required)
export async function GET() {
  try {
    await connectDB();

    // Get all feature requests sorted by votes (highest first) and then by creation date
    const featureRequests = await FeatureRequest.find()
      .sort({ votes: -1, createdAt: -1 });

    return NextResponse.json(
      { success: true, data: featureRequests },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Server error while fetching feature requests" },
      { status: 500 }
    );
  }
}

// POST - Create a new feature request (requires authentication)
export async function POST(request: Request) {
  try {
    // Verify user is authenticated using centralized auth helper
    const user = await requireAuth();

    // Parse request body
    const body = await request.json();
    const { title, description } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: "Title and description are required" },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { success: false, message: "Title must be between 5 and 200 characters" },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 10 || description.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Description must be between 10 and 2000 characters" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Create new feature request using session user data
    const newFeatureRequest = await FeatureRequest.create({
      title,
      description,
      userId: user.id,
      userName: user.name || 'Unknown',
      userEmail: user.email || '',
      status: 'pending',
      votes: 0,
      votedBy: []
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feature request created successfully",
        data: newFeatureRequest
      },
      { status: 201 }
    );
  } catch (error: any) {

    if (error.message?.includes("Unauthorized")) {
      return authErrorResponse(error.message);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while creating feature request" },
      { status: 500 }
    );
  }
}
