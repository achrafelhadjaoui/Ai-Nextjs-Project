import NextAuth, { AuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.isVerified) {
          throw new Error("Please verify your email before logging in");
        }

        if (!user.password) {
          throw new Error("This account uses Google sign-in. Please sign in with Google.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          console.log("[NextAuth] Google sign-in attempt:", { email: user.email });

          await connectDB();
          console.log("[NextAuth] Database connected");

          const existingUser = await User.findOne({ email: user.email });
          console.log("[NextAuth] Existing user found:", !!existingUser);

          if (existingUser) {
            // Update existing user with Google info if not already set
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.image = user.image;
              existingUser.isVerified = true;
              await existingUser.save();
              console.log("[NextAuth] Updated existing user with Google info");
            }
            // Update user ID for JWT
            user.id = existingUser._id.toString();
            (user as any).role = existingUser.role;
          } else {
            // Create new user for Google OAuth
            console.log("[NextAuth] Creating new user for Google OAuth");
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              googleId: account.providerAccountId,
              image: user.image,
              isVerified: true,
              role: "user",
            });

            console.log("[NextAuth] New user created:", newUser._id.toString());

            // Update user ID for JWT
            user.id = newUser._id.toString();
            (user as any).role = newUser.role;
          }

          console.log("[NextAuth] Google sign-in successful");
          return true;
        } catch (error: any) {
          console.error("[NextAuth] Error during Google sign-in:", error);
          console.error("[NextAuth] Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: { token: JWT; user: any; account: any }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.image = user.image;
        token.email = user.email;
        token.name = user.name;
      }

      // ALWAYS fetch fresh user data from database to get latest role
      // This ensures role updates are reflected without re-login
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role; // Always get fresh role from DB
            token.image = dbUser.image;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
