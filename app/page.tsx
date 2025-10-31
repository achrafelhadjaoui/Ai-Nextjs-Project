// // 'use client';

// // import { useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

// // export default function LoginPage() {
// //   const [showPassword, setShowPassword] = useState(false);
// //   const [email, setEmail] = useState('');
// //   const [password, setPassword] = useState('');
// //   const router = useRouter();

// //   const handleLogin = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     // Add your login logic here
// //     router.push('/dashboard');
// //   };

// //   return (
// //     <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
// //       <div className="w-full max-w-md">
// //         {/* Logo */}
// //         <div className="text-center mb-8">
// //           <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
// //           <p className="text-gray-400">Sign in to your account</p>
// //         </div>

// //         {/* Login Form */}
// //         <div className="bg-[#111111] border border-gray-800 rounded-xl p-8">
// //           <form onSubmit={handleLogin} className="space-y-6">
// //             {/* Email Input */}
// //             <div>
// //               <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
// //                 Email Address
// //               </label>
// //               <div className="relative">
// //                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
// //                 <input
// //                   id="email"
// //                   type="email"
// //                   value={email}
// //                   onChange={(e) => setEmail(e.target.value)}
// //                   placeholder="you@example.com"
// //                   required
// //                   className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
// //                 />
// //               </div>
// //             </div>

// //             {/* Password Input */}
// //             <div>
// //               <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
// //                 Password
// //               </label>
// //               <div className="relative">
// //                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
// //                 <input
// //                   id="password"
// //                   type={showPassword ? 'text' : 'password'}
// //                   value={password}
// //                   onChange={(e) => setPassword(e.target.value)}
// //                   placeholder="Enter your password"
// //                   required
// //                   className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
// //                 />
// //                 <button
// //                   type="button"
// //                   onClick={() => setShowPassword(!showPassword)}
// //                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
// //                 >
// //                   {showPassword ? (
// //                     <EyeOff className="w-5 h-5" />
// //                   ) : (
// //                     <Eye className="w-5 h-5" />
// //                   )}
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Remember Me & Forgot Password */}
// //             <div className="flex items-center justify-between">
// //               <label className="flex items-center gap-2 cursor-pointer">
// //                 <input
// //                   type="checkbox"
// //                   className="w-4 h-4 bg-[#0a0a0a] border border-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-white/20"
// //                 />
// //                 <span className="text-sm text-gray-400">Remember me</span>
// //               </label>
// //               <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
// //                 Forgot password?
// //               </a>
// //             </div>

// //             {/* Submit Button */}
// //             <button
// //               type="submit"
// //               className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
// //             >
// //               Sign In
// //             </button>
// //           </form>

// //           {/* Divider */}
// //           <div className="relative my-6">
// //             <div className="absolute inset-0 flex items-center">
// //               <div className="w-full border-t border-gray-800"></div>
// //             </div>
// //             <div className="relative flex justify-center text-sm">
// //               <span className="px-2 bg-[#111111] text-gray-400">or</span>
// //             </div>
// //           </div>

// //           {/* Sign Up Link */}
// //           <div className="text-center">
// //             <p className="text-sm text-gray-400">
// //               Don't have an account?{' '}
// //               <a href="/signup" className="text-white hover:text-gray-300 transition-colors font-medium">
// //                 Sign up
// //               </a>
// //             </p>
// //           </div>
// //         </div>

// //         {/* Footer */}
// //         <p className="text-center text-sm text-gray-500 mt-8">
// //           © 2024 Farisly AI. All rights reserved.
// //         </p>
// //       </div>
// //     </div>
// //   );
// // }





// // 'use client';

// // import { useRouter } from 'next/navigation';
// // import Image from 'next/image';

// // export default function HomePage() {
// //   const router = useRouter();

// //   return (
// //     <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#0a0a0a] to-[#111111] px-4 text-center">
      
// //       {/* Logo */}
// //       <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
// //         Farisly AI
// //       </h1>
// //       <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
// //         Welcome to Farisly AI — your intelligent assistant for smarter decisions, faster results, and effortless automation.
// //       </p>

// //       {/* Hero Image (Optional) */}
// //       <div className="mb-8">
// //         <Image
// //           src="/hero-illustration.png" // Replace with your image
// //           alt="Farisly AI Hero"
// //           width={500}
// //           height={300}
// //           className="rounded-lg shadow-lg"
// //         />
// //       </div>

// //       {/* Call to Action Buttons */}
// //       <div className="flex flex-col sm:flex-row gap-4">
// //         <button
// //           onClick={() => router.push('/auth/login')}
// //           className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
// //         >
// //           Sign In
// //         </button>
// //         <button
// //           onClick={() => router.push('/auth/signup')}
// //           className="px-8 py-3 bg-transparent border border-white text-white font-medium rounded-lg hover:bg-white hover:text-black transition-colors"
// //         >
// //           Get Started
// //         </button>
// //       </div>

// //       {/* Footer */}
// //       <p className="text-gray-500 text-sm mt-12">
// //         © 2024 Farisly AI. All rights reserved.
// //       </p>
// //     </div>
// //   );
// // }




// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
// import { useLocale } from "@/lib/i18n";

// export default function LoginPage() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const router = useRouter();

//   const {t} = useLocale();
//   console.log(t)

//   const handleLogin = (e: React.FormEvent) => {
//     e.preventDefault();
//     router.push('/dashboard');
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-white mb-2">Farisly AI</h1>
//           <p className="text-gray-400">{t.login.title}</p>
//         </div>

//         <div className="bg-[#111111] border border-gray-800 rounded-xl p-8">
//           <form onSubmit={handleLogin} className="space-y-6">
//             <div>
//               <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
//                 {t.login.email}
//               </label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@example.com"
//                   required
//                   className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//                 />
//               </div>
//             </div>

//             <div>
//               <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
//                 {t.login.password}
//               </label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   id="password"
//                   type={showPassword ? 'text' : 'password'}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input type="checkbox" className="w-4 h-4 bg-[#0a0a0a] border border-gray-800 rounded" />
//                 <span className="text-sm text-gray-400">{t.remember}</span>
//               </label>
//               <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
//                 {t.login.forgot}
//               </a>
//             </div>

//             <button
//               type="submit"
//               className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
//             >
//               {t.login.signIn}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }




















"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/providers/i18n-provider";
import { useSettings } from "@/providers/settings-provider";

export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { get } = useSettings();

  // Get dynamic content from settings
  const appName = get('app.name', 'Farisly AI');
  const heroTitle = get('content.homepage_hero_title', t('home.title'));
  const heroSubtitle = get('content.homepage_hero_subtitle', t('home.description'));
  const footerText = get('content.footer_text', `© ${new Date().getFullYear()} ${appName}. ${t('home.footer')}`);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-[#0a0a0a] to-[#111111] px-4 text-center">
      {/* Logo / Title */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        {heroTitle}
      </h1>

      <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
        {heroSubtitle}
      </p>

      {/* Hero Image (Optional) */}
      <div className="mb-8">
        <Image
          src="/hero-illustration.png"
          alt="Farisly AI Hero"
          width={500}
          height={300}
          className="rounded-lg shadow-lg"
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push("/auth/login")}
          className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          {t('home.signIn')}
        </button>
        <button
          onClick={() => router.push("/auth/signup")}
          className="px-8 py-3 bg-transparent border border-white text-white font-medium rounded-lg hover:bg-white hover:text-black transition-colors"
        >
          {t('home.getStarted')}
        </button>
      </div>

      <footer className="text-gray-500 text-sm mt-12">
        {footerText}
      </footer>
    </main>
  );
}
