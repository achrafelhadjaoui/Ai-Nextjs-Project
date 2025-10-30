// 'use client';

// import DashboardLayout from '@/components/DashboardLayout';
// import { Download, ArrowRight } from 'lucide-react';

// export default function DashboardPage() {
//   return (
//     <DashboardLayout>
//       <div className="p-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
//           <p className="text-gray-400">Welcome back! Manage your Farisly AI app from here.</p>
//         </div>

//         {/* Extension Install Card */}
//         <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-8">
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
//                   <Download className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-white">Install Browser Extension</h3>
//                   <p className="text-sm text-gray-400">Get started with Farisly AI</p>
//                 </div>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">
//                 Install our browser extension to start using saved replies and automate your workflow.
//               </p>
//               <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
//                 Install Extension
//                 <ArrowRight className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">Total Saved Replies</div>
//             <div className="text-3xl font-bold text-white">12</div>
//           </div>
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">Active Templates</div>
//             <div className="text-3xl font-bold text-white">8</div>
//           </div>
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">This Month</div>
//             <div className="text-3xl font-bold text-white">143</div>
//           </div>
//         </div>

//         {/* Recent Activity */}
//         <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//           <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
//           <div className="space-y-4">
//             {[1, 2, 3].map((item) => (
//               <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
//                 <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
//                   <MessageSquare className="w-5 h-5 text-gray-400" />
//                 </div>
//                 <div className="flex-1">
//                   <div className="text-sm text-white font-medium">Reply used in conversation</div>
//                   <div className="text-xs text-gray-400">2 hours ago</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// function MessageSquare({ className }: { className?: string }) {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className={className}
//     >
//       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//     </svg>
//   );
// }





'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, ArrowRight } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { AdminRedirect } from '@/components/AdminRedirect';

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  console.log('Translations:', t);

  // Redirect to onboarding if not completed
  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_done');
    if (!onboardingDone) {
      router.push('/onboarding');
    }
  }, [router]);

  return (
    <>
      {/* Redirect admin users to admin dashboard */}
      <AdminRedirect />

      <DashboardLayout>
        <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.headerTitle')}</h1>
          <p className="text-gray-400">{t('dashboard.headerSubtitle')}</p>
        </div>

        {/* Extension Install Card */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('dashboard.extensionTitle')}</h3>
                  <p className="text-sm text-gray-400">{t('dashboard.extensionSubtitle')}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4">{t('dashboard.extensionDescription')}</p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                {t('dashboard.extensionButton')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.savedReplies')}</div>
            <div className="text-3xl font-bold text-white">12</div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.activeTemplates')}</div>
            <div className="text-3xl font-bold text-white">8</div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.thisMonth')}</div>
            <div className="text-3xl font-bold text-white">143</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('dashboard.recentActivity.title')}</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{t('dashboard.recentActivity.itemTitle')}</div>
                  <div className="text-xs text-gray-400">{t('dashboard.recentActivity.itemTime')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}














// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Download, ArrowRight } from 'lucide-react';
// import { useI18n } from '@/providers/i18n-provider';
// import { motion } from 'framer-motion';

// export default function DashboardPage() {
//   const router = useRouter();
//   const { t } = useI18n();

//   // Redirect if onboarding not done
//   useEffect(() => {
//     const done = localStorage.getItem('onboarding_done');
//     if (!done) {
//       router.push('/onboarding');
//     }
//   }, [router]);

//   return (
//     <DashboardLayout>
//       <div className="p-8">
//         {/* Header */}
//         <motion.div
//           className="mb-8"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <h1 className="text-3xl font-bold text-white mb-2">{t('dashboard.headerTitle')}</h1>
//           <p className="text-gray-400">{t('dashboard.headerSubtitle')}</p>
//         </motion.div>

//         {/* Extension Install Card */}
//         <motion.div
//           className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-8"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.1, duration: 0.5 }}
//         >
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-3">
//                 <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
//                   <Download className="w-6 h-6 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-white">{t('dashboard.extensionTitle')}</h3>
//                   <p className="text-sm text-gray-400">{t('dashboard.extensionSubtitle')}</p>
//                 </div>
//               </div>
//               <p className="text-gray-400 text-sm mb-4">{t('dashboard.extensionDescription')}</p>
//               <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
//                 {t('dashboard.extensionButton')}
//                 <ArrowRight className="w-4 h-4" />
//               </button>
//             </div>
//           </div>
//         </motion.div>

//         {/* Stats Grid */}
//         <motion.div
//           className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.2, duration: 0.5 }}
//         >
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.savedReplies')}</div>
//             <div className="text-3xl font-bold text-white">12</div>
//           </div>
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.activeTemplates')}</div>
//             <div className="text-3xl font-bold text-white">8</div>
//           </div>
//           <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//             <div className="text-gray-400 text-sm mb-2">{t('dashboard.stats.thisMonth')}</div>
//             <div className="text-3xl font-bold text-white">143</div>
//           </div>
//         </motion.div>

//         {/* Recent Activity */}
//         <motion.div
//           className="bg-[#111111] border border-gray-800 rounded-xl p-6"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.3, duration: 0.5 }}
//         >
//           <h3 className="text-lg font-semibold text-white mb-4">{t('dashboard.recentActivity.title')}</h3>
//           <div className="space-y-4">
//             {[1, 2, 3].map((item) => (
//               <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
//                 <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
//                   <MessageSquare className="w-5 h-5 text-gray-400" />
//                 </div>
//                 <div className="flex-1">
//                   <div className="text-sm text-white font-medium">{t('dashboard.recentActivity.itemTitle')}</div>
//                   <div className="text-xs text-gray-400">{t('dashboard.recentActivity.itemTime')}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     </DashboardLayout>
//   );
// }

// function MessageSquare({ className }: { className?: string }) {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//       className={className}
//     >
//       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
//     </svg>
//   );
// }
