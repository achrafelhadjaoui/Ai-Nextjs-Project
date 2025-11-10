import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import FeatureRequest from "@/lib/models/FeatureRequest";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";
import mongoose from "mongoose";

// POST - Toggle vote on a feature request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated using centralized auth helper
    const user = await requireAuth();

    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid feature request ID" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Find the feature request
    const featureRequest = await FeatureRequest.findById(id);
    if (!featureRequest) {
      return NextResponse.json(
        { success: false, message: "Feature request not found" },
        { status: 404 }
      );
    }

    const userId = new mongoose.Types.ObjectId(user.id);
    const hasVoted = featureRequest.votedBy.some((voterId) =>
      voterId.equals(userId)
    );

    if (hasVoted) {
      // Remove vote (unvote)
      featureRequest.votedBy = featureRequest.votedBy.filter(
        (voterId) => !voterId.equals(userId)
      );
      featureRequest.votes = Math.max(0, featureRequest.votes - 1);
    } else {
      // Add vote
      featureRequest.votedBy.push(userId);
      featureRequest.votes += 1;
    }

    await featureRequest.save();

    return NextResponse.json(
      {
        success: true,
        message: hasVoted ? "Vote removed" : "Vote added",
        data: {
          votes: featureRequest.votes,
          hasVoted: !hasVoted
        }
      },
      { status: 200 }
    );
  } catch (error: any) {

    if (error.message?.includes("Unauthorized")) {
      return authErrorResponse(error.message);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while toggling vote" },
      { status: 500 }
    );
  }
}
