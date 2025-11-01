// app/api/admin/support/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SupportTicket from "@/lib/models/SupportTicket";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";
import { sendAdminResponseNotificationToUser } from "@/lib/email/emailService";

// PATCH - Admin update support ticket
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const body = await request.json();
    const { status, priority, adminResponse, adminNotes, tags, message } = body;

    const ticket = await SupportTicket.findById(params.id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Support ticket not found" },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (status) {
      ticket.status = status;
      if (status === "resolved") {
        ticket.resolvedAt = new Date();
      } else if (status === "closed") {
        ticket.closedAt = new Date();
      }
    }

    if (priority) {
      ticket.priority = priority;
    }

    if (adminResponse) {
      ticket.adminResponse = adminResponse;
      ticket.respondedBy = admin.email;
      ticket.respondedAt = new Date();
    }

    if (adminNotes !== undefined) {
      ticket.adminNotes = adminNotes;
    }

    if (tags) {
      ticket.tags = tags;
    }

    // Add admin message to conversation
    if (message && message.trim().length > 0) {
      ticket.conversationHistory.push({
        message: message.trim(),
        sender: "admin",
        senderName: admin.name || admin.email,
        timestamp: new Date(),
      });

      // Update status to in-progress if it was open
      if (ticket.status === "open") {
        ticket.status = "in-progress";
      }
    }

    await ticket.save();

    console.log(`✅ Support ticket updated by admin: ${ticket._id} by ${admin.email}`);

    // Send email notification to user if admin responded (non-blocking)
    if (message && message.trim().length > 0) {
      sendAdminResponseNotificationToUser(ticket.userEmail, {
        ticketId: ticket._id.toString(),
        userName: ticket.userName,
        ticketSubject: ticket.subject,
        adminResponse: message.trim(),
        status: ticket.status,
        respondedBy: admin.name || admin.email,
      }).catch((error) => {
        console.error("Failed to send email notification:", error);
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket updated successfully",
      data: ticket,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update support ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Admin delete support ticket
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await connectDB();

    const ticket = await SupportTicket.findById(params.id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Support ticket not found" },
        { status: 404 }
      );
    }

    await ticket.deleteOne();

    console.log(`🗑️ Support ticket deleted: ${ticket._id} by admin ${admin.email}`);

    return NextResponse.json({
      success: true,
      message: "Support ticket deleted successfully",
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete support ticket" },
      { status: 500 }
    );
  }
}
