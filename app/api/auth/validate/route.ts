import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/jwt";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const token = cookieHeader?.split("; ")
      .find(row => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const decoded = verifyToken(token) as any;
    if (!decoded?.userId) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({ valid: true, role: user.role });
  } catch (error) {
    console.error("Error in /api/auth/validate:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
