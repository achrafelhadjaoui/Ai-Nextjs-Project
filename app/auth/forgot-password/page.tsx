'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/app/auth/layout";
import { forgotPassword } from "@/lib/api/auth";
import { useI18n } from "@/providers/i18n-provider";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await forgotPassword({ email });
      if (!res.success) {
        throw new Error(res.error || "Failed to send reset link");
      }
      setStatus({
        type: "success",
        message: t('forgotPassword.successMessage').replace("{email}", email),
      });
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/auth/login");
  };

  return (
    <AuthLayout>
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center text-gray-400 mb-4 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('forgotPassword.back') || "Back"}
      </button>

      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
        <p className="text-gray-400">{t('forgotPassword.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            {t('forgotPassword.email')}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t('forgotPassword.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-4 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
          />
        </div>

        {status.message && (
          <p className={`text-sm ${status.type === "error" ? "text-red-500" : "text-green-500"}`}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('forgotPassword.loading') : t('forgotPassword.sendResetLink')}
        </button>
      </form>
    </AuthLayout>
  );
}
