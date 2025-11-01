// app/api/support/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SupportTicket from "@/lib/models/SupportTicket";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch a single support ticket
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();

    const ticket = await SupportTicket.findById(params.id).select("-adminNotes");

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Support ticket not found" },
        { status: 404 }
      );
    }

    // Users can only view their own tickets
    if (ticket.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch support ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Add a message to the conversation (user reply)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { message, action } = body;

    const ticket = await SupportTicket.findById(params.id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Support ticket not found" },
        { status: 404 }
      );
    }

    // Users can only update their own tickets
    if (ticket.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Handle different actions
    if (action === "add-message") {
      if (!message || message.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Message cannot be empty" },
          { status: 400 }
        );
      }

      ticket.conversationHistory.push({
        message: message.trim(),
        sender: "user",
        senderName: user.name,
        timestamp: new Date(),
      });

      // Change status to waiting-response if ticket was resolved
      if (ticket.status === "resolved" || ticket.status === "closed") {
        ticket.status = "waiting-response";
      }
    } else if (action === "close") {
      ticket.status = "closed";
      ticket.closedAt = new Date();
    } else if (action === "rate") {
      const { rating, feedback } = body;

      if (!rating || rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, message: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }

      ticket.rating = rating;
      ticket.feedback = feedback || "";
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    await ticket.save();

    console.log(`✅ Support ticket updated: ${ticket._id} - action: ${action}`);

    return NextResponse.json({
      success: true,
      message: "Support ticket updated successfully",
      data: ticket,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
