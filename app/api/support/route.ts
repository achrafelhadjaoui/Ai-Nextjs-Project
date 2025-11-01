// app/api/support/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SupportTicket from "@/lib/models/SupportTicket";
import { requireAuth, authErrorResponse } from "@/lib/auth/auth-utils";
import { sendNewTicketNotificationToAdmin } from "@/lib/email/emailService";

// GET - Fetch user's support tickets
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query: any = { userId: user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .select("-adminNotes"); // Hide internal admin notes from users

    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

// POST - Create a new support ticket
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { subject, message, category = "general", priority = "medium", attachments = [] } = body;

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: "Subject and message are required" },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { success: false, message: "Subject cannot exceed 200 characters" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, message: "Message cannot exceed 5000 characters" },
        { status: 400 }
      );
    }

    // Create support ticket
    const ticket = await SupportTicket.create({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject,
      message,
      category,
      priority,
      attachments,
      status: "open",
      conversationHistory: [
        {
          message,
          sender: "user",
          senderName: user.name,
          timestamp: new Date(),
        },
      ],
    });

    console.log(`✅ Support ticket created: ${ticket._id} by user ${user.email}`);

    // Send email notification to support team (non-blocking)
    sendNewTicketNotificationToAdmin({
      ticketId: ticket._id.toString(),
      userName: user.name,
      userEmail: user.email,
      subject,
      message,
      category,
      priority,
      createdAt: ticket.createdAt,
    }).catch((error) => {
      console.error("Failed to send email notification:", error);
      // Don't fail the request if email fails
    });

    return NextResponse.json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
