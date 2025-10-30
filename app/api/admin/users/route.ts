import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import { verifyToken } from "@/utils/jwt";

export async function GET() {
  try {
    // 1️⃣ Verify JWT token
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }

      const decoded = verifyToken(token);
      console.log("this is decodes", decoded)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
    }

    // 2️⃣ Connect to DB
    await connectDB();

    // 3️⃣ Get all users
    const users = await User.find({}, "-password -verificationToken -resetToken").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    console.error("💥 Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while fetching users" },
      { status: 500 }
    );
  }
}