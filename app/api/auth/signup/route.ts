// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/db/connect";
// import User from "@/lib/models/User";
// import { hashPassword } from "@/utils/hash";
// import { signupSchema } from "@/utils/validators/authSchema";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // ✅ Validate input
//     const parsed = signupSchema.safeParse(body);
//     if (!parsed.success) {
//       return NextResponse.json(
//         { error: parsed.error},
//         { status: 400 }
//       );
//     }

//     const { name, email, password } = parsed.data;

//     // ✅ Connect to database
//     await connectDB();

//     // ✅ Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return NextResponse.json({ error: "Email already in use" }, { status: 400 });
//     }

//     // ✅ Hash password
//     const hashedPassword = await hashPassword(password);

//     // ✅ Create user
//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     return NextResponse.json(
//       { message: "User created successfully", userId: newUser._id },
//       { status: 201 }
//     );
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }







import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { hashPassword } from "@/utils/hash";
import { signupSchema } from "@/utils/validators/authSchema";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error }, { status: 400 });

    const { name, email, password } = parsed.data;
    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      onboardingCompleted: false, // Force onboarding for new users
    });

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;
    await sendVerificationEmail(email, verifyLink);

    return NextResponse.json(
      { message: "User created. Verification email sent." },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}