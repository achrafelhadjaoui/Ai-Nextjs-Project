// // /app/api/admin/users/[id]/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";
// import { cookies } from "next/headers";
// import { verifyToken } from "@/utils/jwt";

// export async function GET() {
//   try {
//     // 1️⃣ Verify JWT token
//     const token = cookies().get("token")?.value;
//     if (!token) {
//       return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     if (!decoded || decoded.role !== "admin") {
//       return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
//     }

//     // 2️⃣ Connect to DB
//     await connectDB();

//     // 3️⃣ Get all users
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

// // 🟢 GET ONE USER
// export async function GET(req: Request, { params }: { params: { id: string } }) {
//   try {
//     // 1️⃣ Verify JWT token
//     const token = cookies().get("token")?.value;
//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: "No token provided" },
//         { status: 401 }
//       );
//     }

//     const decoded = verifyToken(token);
//     if (!decoded || decoded.role !== "admin") {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized access" },
//         { status: 403 }
//       );
//     }

//     // 2️⃣ Connect to database
//     await connectDB();

//     // 3️⃣ Fetch user by ID
//     const user = await User.findById(params.id, "-password -verificationToken -resetToken");

//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "User not found" },
//         { status: 404 }
//       );
//     }

//     // 4️⃣ Return user data
//     return NextResponse.json(
//       { success: true, data: user },
//       { status: 200 }
//     );

//   } catch (error: any) {
//     console.error("💥 Error fetching user:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Server error while fetching user" },
//       { status: 500 }
//     );
//   }
// }

// // Delete user
// export async function DELETE(req: Request, { params }: { params: { id: string } }) {
//     try {
//       // 1️⃣ Verify JWT token
//       const token = cookies().get("token")?.value;
//       if (!token) {
//         return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
//       }
  
//       const decoded = verifyToken(token);
//       if (!decoded || decoded.role !== "admin") {
//         return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });
//       }
  
//       // 2️⃣ Connect DB
//       await connectDB();
  
//       // 3️⃣ Validate user existence
//       const user = await User.findById(params.id);
//       if (!user) {
//         return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
//       }
  
//       // 4️⃣ Delete user
//       await user.deleteOne();
  
//       console.log(`🗑️ User deleted successfully: ${user.email}`);
//       return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });
//     } catch (error: any) {
//       console.error("💥 Error deleting user:", error);
//       return NextResponse.json(
//         { success: false, message: error.message || "Server error while deleting user" },
//         { status: 500 }
//       );
//     }
// }
  
// // 🧩 PATCH — Update User Info
// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//   try {
//     const token = cookies().get("token")?.value;
//     if (!token)
//       return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });

//     const decoded = verifyToken(token);
//     if (!decoded || decoded.role !== "admin")
//       return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 403 });

//     await connectDB();

//     const user = await User.findById(params.id);
//     if (!user)
//       return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

//     const body = await req.json();
//     const { name, email, role, isVerified } = body;

//     // ✅ Optional: Validate input data
//     if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//       return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 });
//     }

//     // ✅ Update fields if provided
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (role) user.role = role;
//     if (typeof isVerified === "boolean") user.isVerified = isVerified;

//     await user.save();

//     console.log(`✅ User updated successfully: ${user.email}`);
//     return NextResponse.json(
//       { success: true, message: "User updated successfully", data: user },
//       { status: 200 }
//     );
//   } catch (error: any) {
//     console.error("💥 Error updating user:", error);
//     return NextResponse.json(
//       { success: false, message: error.message || "Server error while updating user" },
//       { status: 500 }
//     );
//   }
// }










// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import { verifyToken } from "@/utils/jwt";

// 🟢 GET ONE USER
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1️⃣ Verify JWT token
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // 2️⃣ Connect to database
    await connectDB();

    // 3️⃣ Fetch user by ID
    const user = await User.findById(params.id, "-password -verificationToken -resetToken");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Return user data
    return NextResponse.json(
      { success: true, data: user },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("💥 Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while fetching user" },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE USER
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1️⃣ Verify JWT token
    const token = cookies().get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // 2️⃣ Connect DB
    await connectDB();

    // 3️⃣ Validate user existence
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Delete user
    await user.deleteOne();

    console.log(`🗑️ User deleted successfully: ${user.email}`);
    return NextResponse.json(
      { success: true, message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while deleting user" },
      { status: 500 }
    );
  }
}

// ✏️ UPDATE USER
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get("token")?.value;
    console.log("kkkkklslkslslkslksk", token)
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    console.log("===========decodde-------------===========", decoded)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, email, role, isVerified } = body;

    // ✅ Optional: Validate input data
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // ✅ Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isVerified === "boolean") user.isVerified = isVerified;

    await user.save();

    console.log(`✅ User updated successfully: ${user.email}`);
    return NextResponse.json(
      { success: true, message: "User updated successfully", data: user },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("💥 Error updating user:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error while updating user" },
      { status: 500 }
    );
  }
}