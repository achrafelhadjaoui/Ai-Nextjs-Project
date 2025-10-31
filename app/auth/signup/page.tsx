// 'use client';

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { Mail, Lock, User } from "lucide-react";
// import SocialLogin from "@/components/auth/SocialLogin";
// import { registerUser } from "@/lib/api/auth";
// import AuthLayout from "@/app/auth/layout";
// import { useI18n } from "@/providers/i18n-provider"; // Add this import

// export default function SignupPage() {
//   const router = useRouter();
//   const { t } = useI18n(); // Add this hook call
//   const [formData, setFormData] = useState({ name: "", email: "", password: "" });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const res = await registerUser(formData);
//       console.log("User registered:", res);
//       router.push("/auth/login");
//     } catch (error) {
//       alert(t('signup.error') || "Signup failed");
//     }
//   };

//   return (
//     <AuthLayout>
//       <div className="text-center mb-6">
//         <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
//         <p className="text-gray-400">{t('signup.subtitle')}</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Name Input */}
//         <div>
//           <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
//             {t('signup.name')}
//           </label>
//           <div className="relative">
//             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="name"
//               name="name"
//               type="text"
//               placeholder={t('signup.namePlaceholder')}
//               value={formData.name}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Email Input */}
//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
//             {t('signup.email')}
//           </label>
//           <div className="relative">
//             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="email"
//               name="email"
//               type="email"
//               placeholder={t('signup.emailPlaceholder')}
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Password Input */}
//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
//             {t('signup.password')}
//           </label>
//           <div className="relative">
//             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="password"
//               name="password"
//               type="password"
//               placeholder={t('signup.passwordPlaceholder')}
//               value={formData.password}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
//         >
//           {t('signup.signUp')}
//         </button>
//       </form>

//       {/* Divider */}
//       <div className="relative my-6">
//         <div className="absolute inset-0 flex items-center">
//           <div className="w-full border-t border-gray-800"></div>
//         </div>
//         <div className="relative flex justify-center text-sm">
//           <span className="px-2 bg-[#111111] text-gray-400">{t('signup.or')}</span>
//         </div>
//       </div>

//       {/* Social Login */}
//       <SocialLogin />

//       {/* Login Link */}
//       <div className="text-center mt-6">
//         <p className="text-sm text-gray-400">
//           {t('signup.haveAccount')}{" "}
//           <Link
//             href="/auth/login"
//             className="text-blue-600 font-medium hover:underline"
//           >
//             {t('signup.login')}
//           </Link>
//         </p>
//       </div>
//     </AuthLayout>
//   );
// }






// 'use client';

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import { Mail, Lock, User, Loader2 } from "lucide-react";
// import SocialLogin from "@/components/auth/SocialLogin";
// import { registerUser } from "@/lib/api/auth";
// import AuthLayout from "@/app/auth/layout";
// import { useI18n } from "@/providers/i18n-provider";
// import { toast } from "react-toastify";

// export default function SignupPage() {
//   const router = useRouter();
//   const { t } = useI18n();

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const res = await registerUser(formData);

//       if (res?.success) {
//         toast.success(t("signup.success") || "✅ Account created successfully!");
//         setTimeout(() => router.push("/auth/login"), 1200);
//       } else {
//         toast.error(res?.error || t("signup.error") || "❌ Registration failed");
//       }
//     } catch (error: any) {
//       console.error("Signup error:", error);
//       toast.error(error.message || "An unexpected error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthLayout>
//       <div className="text-center mb-6">
//         <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
//         <p className="text-gray-400">{t("signup.subtitle")}</p>
//       </div>

//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Name */}
//         <div>
//           <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
//             {t("signup.name")}
//           </label>
//           <div className="relative">
//             <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="name"
//               name="name"
//               type="text"
//               placeholder={t("signup.namePlaceholder")}
//               value={formData.name}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Email */}
//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
//             {t("signup.email")}
//           </label>
//           <div className="relative">
//             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="email"
//               name="email"
//               type="email"
//               placeholder={t("signup.emailPlaceholder")}
//               value={formData.email}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Password */}
//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
//             {t("signup.password")}
//           </label>
//           <div className="relative">
//             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               id="password"
//               name="password"
//               type="password"
//               placeholder={t("signup.passwordPlaceholder")}
//               value={formData.password}
//               onChange={handleChange}
//               required
//               className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//             />
//           </div>
//         </div>

//         {/* Submit Button */}
//         <button
//           type="submit"
//           disabled={loading}
//           className={`w-full py-3 rounded-lg font-medium transition-colors flex justify-center items-center ${
//             loading
//               ? "bg-gray-700 cursor-not-allowed"
//               : "bg-green-600 hover:bg-green-700 text-white"
//           }`}
//         >
//           {loading ? (
//             <>
//               <Loader2 className="animate-spin w-5 h-5 mr-2" />
//               {t("signup.loading") || "Creating..."}
//             </>
//           ) : (
//             t("signup.signUp")
//           )}
//         </button>
//       </form>

//       {/* Divider */}
//       <div className="relative my-6">
//         <div className="absolute inset-0 flex items-center">
//           <div className="w-full border-t border-gray-800"></div>
//         </div>
//         <div className="relative flex justify-center text-sm">
//           <span className="px-2 bg-[#111111] text-gray-400">{t("signup.or")}</span>
//         </div>
//       </div>

//       {/* Social Login */}
//       <SocialLogin redirectTo="/dashboard" />

//       {/* Login Link */}
//       <div className="text-center mt-6">
//         <p className="text-sm text-gray-400">
//           {t("signup.haveAccount")}{" "}
//           <Link
//             href="/auth/login"
//             className="text-blue-500 font-medium hover:underline transition-colors"
//           >
//             {t("signup.login")}
//           </Link>
//         </p>
//       </div>
//     </AuthLayout>
//   );
// }















// app/auth/signup/page.tsx - UPDATED
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import SocialLogin from "@/components/auth/SocialLogin";
import { registerUser } from "@/lib/api/auth"; // Keep this for signup
import AuthLayout from "@/app/auth/layout";
import { useI18n } from "@/providers/i18n-provider";
import { toast } from "react-toastify";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await registerUser(formData);

      if (res?.success) {
        toast.success(
          t("signup.success") || "✅ Account created! Please check your email for verification.",
          { 
            position: "top-center",
            autoClose: 5000 
          }
        );
        // Redirect to login after success
        setTimeout(() => router.push("/auth/login"), 2000);
      } else {
        toast.error(
          res?.error || t("signup.error") || "❌ Registration failed",
          { 
            position: "top-center",
            autoClose: 5000 
          }
        );
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(
        error.message || "An unexpected error occurred",
        { 
          position: "top-center",
          autoClose: 5000 
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
        <p className="text-gray-400">{t("signup.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
            {t("signup.name")}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              placeholder={t("signup.namePlaceholder")}
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
              className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            {t("signup.email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t("signup.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
            {t("signup.password")}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("signup.passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t("signup.passwordHint") || "Password must be at least 6 characters"}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium transition-colors flex justify-center items-center ${
            loading
              ? "bg-gray-700 cursor-not-allowed text-gray-400"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              {t("signup.loading") || "Creating Account..."}
            </>
          ) : (
            t("signup.signUp") || "Create Account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#111111] text-gray-400">{t("signup.or")}</span>
        </div>
      </div>

      {/* Social Login */}
      <SocialLogin redirectTo="/dashboard" />

      {/* Login Link */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          {t("signup.haveAccount")}{" "}
          <Link
            href="/auth/login"
            className="text-blue-500 font-medium hover:underline transition-colors"
          >
            {t("signup.login")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}