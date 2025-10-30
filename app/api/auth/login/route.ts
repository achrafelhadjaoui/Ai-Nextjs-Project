import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { comparePassword } from "@/utils/hash";
import { signToken } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    console.log("Login request received");
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Connect to database
    await connectDB();

    // ✅ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Compare passwords
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }



    // ✅ Check if email is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      );
    }
    

    // ✅ Create JWT token
    const token = signToken({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    });

    // ✅ Store in HTTP-only cookie
    const response = NextResponse.json(
  { 
    message: "Login successful", 
    user: { 
      id: user._id, 
      email: user.email, 
      name: user.name,
      role: user.role // Include role in response
    } 
  },
  { status: 200 }
);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
