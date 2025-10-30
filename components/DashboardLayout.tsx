// 'use client';

// import LanguageSwitcher from './LanguageSwitcher';
// import Sidebar from './Sidebar';
// import { Languages } from 'lucide-react';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-screen bg-[#0a0a0a] relative">
//       <Sidebar />
      
//       {/* Globe Icon - Top Right Corner */}
//       <div className="fixed top-4 right-4 z-50">
//         <Languages className="w-8 h-8 hover:h-10 hover:w-10 cursor-pointer p-1 rounded-full"
//         onclick={() => LanguageSwitcher}
//         />
//       </div>
      
//       <main className="ml-64 transition-all duration-300 ease-in-out">
//         {children}
//       </main>
//     </div>
//   );
// }





// 'use client';

// import { useState } from 'react';
// import Sidebar from './Sidebar';
// import LanguageSwitcher from './LanguageSwitcher';
// import { Languages, X } from 'lucide-react';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);

//   const toggleLanguageSwitcher = () => {
//     setIsLanguageSwitcherOpen(!isLanguageSwitcherOpen);
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] relative">
//       <Sidebar />
      
//       {/* Language Switcher Toggle Button */}
//       <div className="fixed top-4 right-4 z-50">
//         <button
//           onClick={toggleLanguageSwitcher}
//           className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-200 group"
//           title="Change Language"
//         >
//           {isLanguageSwitcherOpen ? (
//             <X className="w-5 h-5 text-white" />
//           ) : (
//             <Languages className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
//           )}
//         </button>
//       </div>

//       {/* Language Switcher Dropdown */}
//       {isLanguageSwitcherOpen && (
//         <div className="fixed top-16 right-4 z-50 bg-[#111111] border border-gray-800 rounded-lg shadow-lg p-4 min-w-[120px]">
//           <LanguageSwitcher onClose={() => setIsLanguageSwitcherOpen(false)} />
//         </div>
//       )}
      
//       <main className="ml-64 transition-all duration-300 ease-in-out">
//         {children}
//       </main>
//     </div>
//   );
// }







// 'use client';

// import { useState } from 'react';
// import UserSidebar from './Sidebar';
// import AdminSideBar from './SidebarAdmin';
// import { Languages, X } from 'lucide-react';
// import LanguageSwitcher from './LanguageSwitcher';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
//   userRole?: 'user' | 'admin';
// }

// export default function DashboardLayout({
//   children,
//   userRole = 'admin'
// }: DashboardLayoutProps) {
//   const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);

//   const toggleLanguageSwitcher = () => {
//     setIsLanguageSwitcherOpen(!isLanguageSwitcherOpen);
//   };

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] relative">
//       {/* Conditionally render the appropriate sidebar */}
//       {/* {userRole === 'admin' ? <AdminSidebar /> : <UserSidebar />} */}

//       <AdminSideBar />
      
//       {/* Language Switcher Toggle Button */}
//       <div className="fixed top-4 right-4 z-50">
//         <button
//           onClick={toggleLanguageSwitcher}
//           className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-200 group"
//           title="Change Language"
//         >
//           {isLanguageSwitcherOpen ? (
//             <X className="w-5 h-5 text-white" />
//           ) : (
//             <Languages className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
//           )}
//         </button>
//       </div>

//       {/* Language Switcher Dropdown */}
//       {isLanguageSwitcherOpen && (
//         <div className="fixed top-16 right-4 z-50 bg-[#111111] border border-gray-800 rounded-lg shadow-lg p-4 min-w-[120px]">
//           <LanguageSwitcher onClose={() => setIsLanguageSwitcherOpen(false)} />
//         </div>
//       )}
      
//       <main className="ml-64 transition-all duration-300 ease-in-out">
//         {children}
//       </main>
//     </div>
//   );
// }










// 'use client';

// import { useState, useEffect } from 'react';
// import UserSidebar from './UserSidebar';
// import AdminSidebar from './AdminSidebar';
// import { Languages, X } from 'lucide-react';
// import LanguageSwitcher from './LanguageSwitcher';
// import { verifyToken } from '@/utils/jwt';

// interface DashboardLayoutProps {
//   children: React.ReactNode;
// }

// export default function DashboardLayout({ children }: DashboardLayoutProps) {
//   const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);
//   const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get token from cookies and decode to get role
//     const getTokenFromCookies = () => {
//       const cookieValue = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('token='))
//         ?.split('=')[1];

//       return cookieValue;
//     };

//     const token = getTokenFromCookies();
//     if (token) {
//       try {
//         const decoded = verifyToken(token) as any;
//         setUserRole(decoded?.role || 'user');
//       } catch (error) {
//         console.error('Error decoding token:', error);
//         setUserRole('user');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const toggleLanguageSwitcher = () => {
//     setIsLanguageSwitcherOpen(!isLanguageSwitcherOpen);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
//         <div className="text-white">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#0a0a0a] relative">
//       {/* Conditionally render the appropriate sidebar */}
//       {userRole === 'admin' ? <AdminSidebar /> : <UserSidebar />}
      
//       {/* Language Switcher Toggle Button */}
//       <div className="fixed top-4 right-4 z-50">
//         <button
//           onClick={toggleLanguageSwitcher}
//           className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-200 group"
//           title="Change Language"
//         >
//           {isLanguageSwitcherOpen ? (
//             <X className="w-5 h-5 text-white" />
//           ) : (
//             <Languages className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
//           )}
//         </button>
//       </div>

//       {/* Language Switcher Dropdown */}
//       {isLanguageSwitcherOpen && (
//         <div className="fixed top-16 right-4 z-50 bg-[#111111] border border-gray-800 rounded-lg shadow-lg p-4 min-w-[120px]">
//           <LanguageSwitcher onClose={() => setIsLanguageSwitcherOpen(false)} />
//         </div>
//       )}
      
//       <main className="ml-64 transition-all duration-300 ease-in-out">
//         {children}
//       </main>
//     </div>
//   );
// }



'use client';

import { useState } from 'react';
import UserSidebar from './UserSidebar';
import AdminSidebar from './AdminSidebar';
import { Languages, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '@/lib/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isLanguageSwitcherOpen, setIsLanguageSwitcherOpen] = useState(false);
  const { user, loading } = useAuth();

  const toggleLanguageSwitcher = () => {
    setIsLanguageSwitcherOpen(!isLanguageSwitcherOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Conditionally render the appropriate sidebar */}
      {user?.role === 'admin' ? <AdminSidebar /> : <UserSidebar />}
      
      {/* Language Switcher Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleLanguageSwitcher}
          className="p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-200 group"
          title="Change Language"
        >
          {isLanguageSwitcherOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Languages className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Language Switcher Dropdown */}
      {isLanguageSwitcherOpen && (
        <div className="fixed top-16 right-4 z-50 bg-[#111111] border border-gray-800 rounded-lg shadow-lg p-4 min-w-[120px]">
          <LanguageSwitcher onClose={() => setIsLanguageSwitcherOpen(false)} />
        </div>
      )}
      
      <main className="ml-64 transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}