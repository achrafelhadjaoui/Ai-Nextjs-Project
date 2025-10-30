import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import {connectDB} from "@/lib/db/connect";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();
  const { token, newPassword } = await req.json();

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return NextResponse.json({ message: "Password reset successful" });
}
