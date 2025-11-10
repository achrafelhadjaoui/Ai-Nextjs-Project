'use client';

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthLayout from "@/app/auth/layout";
import { resetPassword } from "@/lib/api/auth";
import { useI18n } from "@/providers/i18n-provider";
import { ArrowLeft } from "lucide-react";
import { showToast } from '@/components/ui/ToastNotification';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showToast.error(t('resetPassword.passwordsNotMatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword: form.newPassword });
      if (!res.success) throw new Error(res.error || "Reset failed");

      showToast.success(t('resetPassword.successMessage') || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (error: any) {
      showToast.error(error.message || "Reset failed");
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
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('resetPassword.back') || "Back"}
      </button>

      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
        <p className="text-gray-400">{t('resetPassword.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-400 mb-2">
            {t('resetPassword.newPassword')}
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder={t('resetPassword.newPasswordPlaceholder')}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
            className="w-full pl-4 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
            {t('resetPassword.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
            className="w-full pl-4 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? t('resetPassword.loading') : t('resetPassword.resetPassword')}
        </button>
      </form>
    </AuthLayout>
  );
}
