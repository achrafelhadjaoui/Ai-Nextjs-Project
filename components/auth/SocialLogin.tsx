// components/auth/SocialLogin.tsx
'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface SocialLoginProps {
  redirectTo?: string;
}

export default function SocialLogin({ redirectTo }: SocialLoginProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleGoogleLogin = async () => {
    try {
      setLoading("google");

      toast.info("Redirecting to Google...", {
        autoClose: 2000,
        position: "top-center",
      });

      const callbackUrl = searchParams.get("callbackUrl") || redirectTo || "/dashboard";

      await signIn("google", {
        callbackUrl,
        redirect: true, // Let NextAuth handle the redirect
      });

      // This code won't execute because redirect:true redirects before it returns
    } catch (error) {
      console.error("Google authentication error:", error);
      toast.error("Failed to connect to Google. Please try again.", {
        position: "top-center",
      });
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={!!loading}
        className={`w-full flex items-center justify-center gap-2 py-3 border border-gray-800 rounded-lg text-white font-medium transition-colors ${
          loading ? "bg-gray-800 cursor-not-allowed opacity-60" : "hover:bg-gray-900"
        }`}
      >
        {loading === "google" ? (
          <>
            <Loader2 className="animate-spin w-5 h-5 text-white" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <FcGoogle className="w-5 h-5" />
            <span>Continue with Google</span>
          </>
        )}
      </button>
    </div>
  );
}
