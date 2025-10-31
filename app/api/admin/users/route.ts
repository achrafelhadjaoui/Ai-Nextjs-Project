// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";
// import { cookies } from "next/headers";
// import { verifyToken } from "@/utils/jwt";
// import bcrypt from "bcryptjs";

// // Helper function to verify admin
// async function verifyAdmin() {
//   const token = cookies().get("token")?.value;
//   if (!token) {
//     return { isAdmin: false, error: "No token provided" };
//   }

//   const decoded = verifyToken(token) as any;
//   if (!decoded || decoded.role !== "admin") {
//     return { isAdmin: false, error: "Unauthorized access" };
//   }

//   return { isAdmin: true, decoded };
// }

// export async function GET() {
//   try {
//     // Verify admin
//     const { isAdmin, error } = await verifyAdmin();
//     if (!isAdmin) {
//       return NextResponse.json({ success: false, message: error }, { status: 403 });
//     }

//     // Connect to DB
//     await connectDB();

//     // Get all users
//     const users = await User.find({}, "-password -verificationToken -resetToken").sort({ createdAt: -1 });

//     return NextResponse.json({ success: true, data: users }, { status: 200 });
//   } catch (error: any) {
//     console.error("💥 Error fetching users:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Server error while fetching users" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     // Verify admin
//     const { isAdmin, error } = await verifyAdmin();
//     if (!isAdmin) {
//       return NextResponse.json({ success: false, message: error }, { status: 403 });
//     }

//     // Parse request body
//     const body = await request.json();
//     const { name, email, password, role, isVerified } = body;

//     // Validate required fields
//     if (!name || !email || !password) {
//       return NextResponse.json(
//         { success: false, message: "Name, email, and password are required" },
//         { status: 400 }
//       );
//     }

//     // Validate email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return NextResponse.json(
//         { success: false, message: "Invalid email format" },
//         { status: 400 }
//       );
//     }

//     // Validate password length
//     if (password.length < 6) {
//       return NextResponse.json(
//         { success: false, message: "Password must be at least 6 characters" },
//         { status: 400 }
//       );
//     }

//     // Connect to DB
//     await connectDB();

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return NextResponse.json(
//         { success: false, message: "User with this email already exists" },
//         { status: 409 }
//       );
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new user
//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || "user",
//       isVerified: isVerified !== undefined ? isVerified : false,
//     });

//     // Return user without sensitive data
//     const userResponse = {
//       _id: newUser._id,
//       name: newUser.name,
//       email: newUser.email,
//       role: newUser.role,
//       isVerified: newUser.isVerified,
//       createdAt: newUser.createdAt,
//     };

//     return NextResponse.json(
//       { success: true, message: "User created successfully", data: userResponse },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("💥 Error creating user:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Server error while creating user" },
//       { status: 500 }
//     );
//   }
// }








// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { requireAdmin, authErrorResponse } from "@/lib/auth/auth-utils";

export async function GET() {
  try {
    // Verify admin using session
    const user = await requireAdmin();

    // Connect to DB
    await connectDB();

    // Get all users
    const users = await User.find({}, "-password -verificationToken -resetToken").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: any) {
    console.error("💥 Error fetching users:", error);
    
    if (error.message === "Unauthorized") {
      return authErrorResponse();
    }
    
    if (error.message.includes("Admin access required")) {
      return authErrorResponse("Forbidden: Admin access required", 403);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while fetching users" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    // Verify admin using session
    await requireAdmin();

    // Parse request body
    const body = await request.json();
    const { name, email, password, role, isVerified } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password (using bcryptjs which is already in package.json)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: isVerified !== undefined ? isVerified : false,
    });

    // Return user without sensitive data
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      { success: true, message: "User created successfully", data: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("💥 Error creating user:", error);

    if (error.message?.includes("Unauthorized")) {
      return authErrorResponse();
    }

    if (error.message?.includes("Admin access required")) {
      return authErrorResponse("Forbidden: Admin access required", 403);
    }

    return NextResponse.json(
      { success: false, message: error.message || "Server error while creating user" },
      { status: 500 }
    );
  }
}
