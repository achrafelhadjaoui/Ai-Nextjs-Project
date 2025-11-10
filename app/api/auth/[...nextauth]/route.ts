import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { comparePassword } from "@/utils/hash";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user",
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          await connectDB();

          // Find user
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Check if user has a password (OAuth users might not)
          if (!user.password) {
            throw new Error("Please use Google sign-in for this account");
          }

          // Compare passwords
          const isValid = await comparePassword(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          // Check if email is verified
          if (!user.isVerified) {
            throw new Error("Please verify your email before logging in");
          }

          // Return user object (will be stored in JWT token)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "user",
            isVerified: user.isVerified,
          };
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Handle Google OAuth
        if (account?.provider === "google") {
          await connectDB();

          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            if (!existingUser.googleId) {
              existingUser.googleId = profile?.sub;
              if (profile?.picture) existingUser.image = profile.picture;
              await existingUser.save();
            }
            
            if (!existingUser.isVerified) {
              existingUser.isVerified = true;
              await existingUser.save();
            }
          } else {
            // New Google OAuth user - set onboardingCompleted to false
            await User.create({
              name: user.name,
              email: user.email,
              googleId: profile?.sub,
              image: profile?.picture,
              role: "user",
              isVerified: true,
              onboardingCompleted: false, // Force onboarding for new users
            });
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    },
    
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }

      // ALWAYS fetch fresh user data from database to get latest role
      // This ensures role updates are reflected without re-login
      if (token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });

          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.role = dbUser.role; // Always get fresh role from DB
            token.isVerified = dbUser.isVerified;
            token.name = dbUser.name;
            token.image = dbUser.image;
            token.onboardingCompleted = dbUser.onboardingCompleted ?? false; // Include onboarding status
          } else {
            // User was deleted from database - invalidate their session
            return null; // Return null to invalidate the token
          }
        } catch (error) {
        }
      }

      // Update session when user updates their profile
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 5 * 60, // Refresh session every 5 minutes to check for role changes
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
