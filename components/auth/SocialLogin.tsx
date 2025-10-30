// "use client";

// import { FcGoogle } from "react-icons/fc";

// export default function SocialLogin() {
//   const handleGoogleLogin = () => {
//     window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
//   };

//   return (
//     <button
//       onClick={handleGoogleLogin}
//       className="w-full border flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-gray-100"
//     >
//       <FcGoogle size={20} /> Continue with Google
//     </button>
//   );
// }



// "use client";
// import { signIn } from "next-auth/react";
// import { FcGoogle } from "react-icons/fc";

// export default function SocialLogin() {
//   return (
//     <div className="flex justify-center">
//       <button
//         onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
//         className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
//       >
//         <FcGoogle className="w-5 h-5" />
//         Sign in with Google
//       </button>
//     </div>
//   );
// }



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
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      toast.info("Redirecting to Google...", {
        autoClose: 2000,
        position: "top-center",
      });

      // Use callbackUrl from query params if available, otherwise use redirectTo prop or default
      const callbackUrl = searchParams.get("callbackUrl") || redirectTo || "/dashboard";

      // NextAuth will handle the redirect automatically
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
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 border border-gray-800 rounded-lg text-white font-medium transition-colors ${
          loading ? "bg-gray-800 cursor-not-allowed opacity-60" : "hover:bg-gray-900"
        }`}
      >
        {loading ? (
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
