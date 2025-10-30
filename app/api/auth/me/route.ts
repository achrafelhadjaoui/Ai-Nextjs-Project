// import { NextResponse } from "next/server";
// import { verifyToken } from "@/utils/jwt";

// export async function GET(req: Request) {
//   try {
//     // Extract token from cookies
//     const cookie = req.headers.get("cookie") || "";
//     const token = cookie
//       .split("; ")
//       .find(row => row.startsWith("token="))
//       ?.split("=")[1];

//     if (!token) {
//       return NextResponse.json({ user: null }, { status: 401 });
//     }

//     const decoded = verifyToken(token) as any;
//     if (!decoded) {
//       return NextResponse.json({ user: null }, { status: 401 });
//     }

//     return NextResponse.json({ user: decoded }, { status: 200 });
//   } catch (err) {
//     console.error("Error verifying token:", err);
//     return NextResponse.json({ user: null }, { status: 401 });
//   }
// }




/**
 * Get current authenticated user
 * Supports both NextAuth (Google OAuth) and custom JWT (Email/Password)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyToken } from "@/utils/jwt";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";

export async function GET(request: Request) {
  try {
    // First, check for NextAuth session (Google OAuth)
    const session = await getServerSession(authOptions);

    if (session?.user) {
      return NextResponse.json({
        user: {
          id: (session.user as any).id,
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role || 'user',
          image: session.user.image,
          isVerified: true, // OAuth users are always verified
        },
      });
    }

    // Fallback to custom JWT token (Email/Password)
    const cookieHeader = request.headers.get('cookie');
    const cookieToken = cookieHeader?.split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!cookieToken) {
      return NextResponse.json({ error: 'No authentication found' }, { status: 401 });
    }

    const decoded = verifyToken(cookieToken) as any;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}