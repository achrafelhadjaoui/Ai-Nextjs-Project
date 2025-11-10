// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");

//     if (!token)
//       return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });

//     await connectDB();
//     const user = await User.findOne({ verificationToken: token });
//     if (!user)
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });


//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save();

//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verified-success`);
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");


//     if (!token)
//       return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });

//     await connectDB();

//     const updatedUser = await User.findOneAndUpdate(
//       { verificationToken: token },
//       { isVerified: true, verificationToken: null },
//       { new: true }
//     );

//     if (!updatedUser)
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });


//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verified-success`);
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }





// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");


//     if (!token)
//       return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });

//     await connectDB();

//     const user = await User.findOne({ verificationToken: token });

//     if (!user) {
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
//     }

//     // ✅ Update fields
//     user.isVerified = true;
//     user.verificationToken = undefined;

//     await user.save();


//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`);
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {

//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");


//     if (!token) {
//       return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
//     }

//     await connectDB();

//     const user = await User.findOne({ verificationToken: token });
//     if (!user) {
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
//     }

//     // ✅ Update safely
//     await User.updateOne(
//       { _id: user._id },
//       { $set: { isVerified: true, verificationToken: null } }
//     );


//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/login`);
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// // /app/api/auth/verify/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");

//     if (!token) {
//       return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
//     }

//     await connectDB();

//     const updatedUser = await User.findOneAndUpdate(
//       { verificationToken: token },
//       { isVerified: true, verificationToken: null },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
//     }


//     return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verified-success`);
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }



// // /app/api/auth/verify/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");

//     if (!token) {
//       return NextResponse.json({ success: false, message: "Invalid or missing token" }, { status: 400 });
//     }

//     await connectDB();

//     const user = await User.findOne({ verificationToken: token });

//     if (!user) {
//       return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
//     }

//     if (user.isVerified) {
//       return NextResponse.json({ success: true, message: "Your email is already verified" }, { status: 200 });
//     }

//     // ✅ Update user safely
//     user.isVerified = true;
//     // user.verificationToken = null;
//     await user.save();


//     return NextResponse.json({ success: true, message: "Email verified successfully" }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
//   }
// }



// /app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, message: "Invalid or missing token" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: "Your email is already verified" }, { status: 200 });
    }



    // ✅ Set delay before clearing verification token (e.g., 5 seconds)
    setTimeout(async () => {
      try {

        if (user && !user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
      } catch (error) {
      }
    }, 5000); // 5 seconds delay

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. Token will be cleared shortly."
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}