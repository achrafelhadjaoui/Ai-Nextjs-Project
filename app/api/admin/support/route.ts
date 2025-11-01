// app/api/admin/support/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SupportTicket from "@/lib/models/SupportTicket";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

// GET - Fetch all support tickets (admin)
export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (priority && priority !== "all") {
      query.priority = priority;
    }
    if (category && category !== "all") {
      query.category = category;
    }

    const tickets = await SupportTicket.find(query).sort({ priority: -1, createdAt: -1 });

    // Get stats
    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: "open" }),
      inProgress: await SupportTicket.countDocuments({ status: "in-progress" }),
      waitingResponse: await SupportTicket.countDocuments({ status: "waiting-response" }),
      resolved: await SupportTicket.countDocuments({ status: "resolved" }),
      closed: await SupportTicket.countDocuments({ status: "closed" }),
      urgent: await SupportTicket.countDocuments({ priority: "urgent", status: { $nin: ["resolved", "closed"] } }),
    };

    return NextResponse.json({
      success: true,
      data: tickets,
      stats,
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return authErrorResponse(error.message, 401);
    }
    if (error.message.includes("Forbidden")) {
      return authErrorResponse(error.message, 403);
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}
