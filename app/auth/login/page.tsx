// app/auth/login/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import SocialLogin from "@/components/auth/SocialLogin";
import AuthLayout from "@/app/auth/layout";
import { useI18n } from "@/providers/i18n-provider";
import { useSettings } from "@/providers/settings-provider";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { get } = useSettings();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Get app name from settings
  const appName = get('app.name', 'Farisly AI');

  // Check for OAuth errors or success
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      const errorMessages: Record<string, string> = {
        OAuthSignin: "Error connecting to Google. Please try again.",
        OAuthCallback: "Error during Google authentication. Please try again.",
        OAuthCreateAccount: "Could not create your account. Please try again or contact support.",
        EmailCreateAccount: "Could not create your account with this email.",
        Callback: "Authentication callback error. Please try again.",
        OAuthAccountNotLinked: "This email is already registered with a different sign-in method.",
        EmailSignin: "Check your email for the sign-in link.",
        CredentialsSignin: "Invalid email or password. Please try again.",
        SessionRequired: "Please sign in to continue.",
        Default: "Authentication failed. Please try again.",
      };

      const errorMessage = errorMessages[error] || errorMessages.Default;
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });

      // Clean up URL
      router.replace("/auth/login");
    }

    if (success === "true") {
      toast.success("Successfully signed in! Redirecting...", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, // We handle redirect manually to show toast
      });

      if (result?.error) {
        toast.error(result.error, {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.success("Logged in successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        // Middleware will redirect admins from /dashboard to /admin/dashboard
        window.location.href = callbackUrl; // Use window.location for hard redirect to trigger middleware
      }
    } catch (error: any) {
      toast.error("Login failed. Please try again.", {
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">{appName}</h1>
        <p className="text-gray-400">{t('login.title')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            {t('login.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
            {t('login.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t('login.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {/* Remember & Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 bg-[#0a0a0a] border border-gray-800 rounded" />
            <span className="text-sm text-gray-400">{t('login.remember')}</span>
          </label>
          <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:text-white">
            {t('login.forgot')}
          </Link>
        </div>

        {/* Error message */}
        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? t('login.loading') : t('login.signIn')}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#111111] text-gray-400">{t('login.or')}</span>
        </div>
      </div>

      <SocialLogin />

      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          {t('login.noAccount')}{" "}
          <Link href="/auth/signup" className="text-white hover:text-gray-300 font-medium">
            {t('login.signUp')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}