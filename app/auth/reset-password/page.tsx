// 'use client';

// import { useState } from "react";
// import AuthLayout from "@/app/auth/layout";
// import { useI18n } from "@/providers/i18n-provider"; // Add this import

// export default function ResetPasswordPage() {
//   const [password, setPassword] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const { t } = useI18n(); // Add this hook call

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (password !== confirm) {
//       alert(t('resetPassword.passwordsNotMatch'));
//       return;
//     }
//     alert(t('resetPassword.successMessage'));
//   };

//   return (
//     <AuthLayout>
//       <div className="text-center mb-6">
//         <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
//         <p className="text-gray-400">{t('resetPassword.subtitle')}</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* New Password */}
//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
//             {t('resetPassword.newPassword')}
//           </label>
//           <input
//             id="password"
//             type="password"
//             placeholder={t('resetPassword.newPasswordPlaceholder')}
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="w-full pl-4 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//           />
//         </div>

//         {/* Confirm Password */}
//         <div>
//           <label htmlFor="confirm" className="block text-sm font-medium text-gray-400 mb-2">
//             {t('resetPassword.confirmPassword')}
//           </label>
//           <input
//             id="confirm"
//             type="password"
//             placeholder={t('resetPassword.confirmPasswordPlaceholder')}
//             value={confirm}
//             onChange={(e) => setConfirm(e.target.value)}
//             required
//             className="w-full pl-4 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//           />
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
//         >
//           {t('resetPassword.resetPassword')}
//         </button>
//       </form>
//     </AuthLayout>
//   );
// }


// "use client";
// import { useState } from "react";
// import { useSearchParams } from "next/navigation";

// export default function ResetPasswordPage() {
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");
//   const [newPassword, setNewPassword] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     const res = await fetch("/api/auth/reset-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token, newPassword }),
//     });

//     const data = await res.json();
//     setMessage(data.message);
//   };

//   return (
//     <div className="flex flex-col items-center p-6">
//       <h2 className="text-2xl mb-4">Reset Password</h2>
//       <form onSubmit={handleSubmit} className="space-y-3">
//         <input
//           type="password"
//           placeholder="New password"
//           className="border p-2 rounded"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//         />
//         <button className="bg-green-500 text-white px-4 py-2 rounded">
//           Reset Password
//         </button>
//       </form>
//       {message && <p className="mt-4">{message}</p>}
//     </div>
//   );
// }


'use client';

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthLayout from "@/app/auth/layout";
import { resetPassword } from "@/lib/api/auth";
import { useI18n } from "@/providers/i18n-provider";
import { ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", message: t('resetPassword.passwordsNotMatch') });
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, newPassword: form.newPassword });
      if (!res.success) throw new Error(res.error || "Reset failed");

      setStatus({ type: "success", message: t('resetPassword.successMessage') });
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Reset failed" });
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

        {status.message && (
          <p className={`text-sm ${status.type === "error" ? "text-red-500" : "text-green-500"}`}>
            {status.message}
          </p>
        )}

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
