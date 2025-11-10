// import { NextResponse } from "next/server";
// import User from "@/lib/models/User";
// import {connectDB} from "@/lib/db/connect";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   await connectDB();
//   const { email } = await req.json();

//   const user = await User.findOne({ email });
//   if (!user) {
//     return NextResponse.json({ message: "User not found" }, { status: 404 });
//   }

//   // Generate token
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min validity

//   user.resetToken = resetToken;
//   user.resetTokenExpiry = resetTokenExpiry;
//   await user.save();

//   const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

//   // ⚠️ In a real app → send this link via email

//   return NextResponse.json({ message: "Reset link sent to email" });
// }





import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import {connectDB} from "@/lib/db/connect";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  await connectDB();
  const { email } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
    return NextResponse.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to send email" }, { status: 500 });
  }
}
