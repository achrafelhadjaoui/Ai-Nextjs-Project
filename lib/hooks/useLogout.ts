// 'use client';

// import { useRouter } from 'next/navigation';
// import { signOut } from 'next-auth/react';

// /**
//  * Comprehensive logout hook that handles both NextAuth and JWT authentication
//  */
// export function useLogout() {
//   const router = useRouter();

//   const logout = async () => {
//     try {
//       // 1. Clear NextAuth session (for Google OAuth users)
//       await signOut({
//         redirect: false, // Don't auto-redirect, we'll handle it
//         callbackUrl: '/auth/login'
//       });

//       // 2. Clear JWT token cookie (for Email/Password users)
//       document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

//       // 3. Clear any localStorage data
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('onboarding_done');
//         // Add any other localStorage items you want to clear
//       }

//       // 4. Redirect to login page
//       router.push('/auth/login');

//       // 5. Force page reload to clear all state
//       setTimeout(() => {
//         window.location.href = '/auth/login';
//       }, 100);

//     } catch (error) {
//       console.error('Logout error:', error);
//       // Even if there's an error, redirect to login
//       window.location.href = '/auth/login';
//     }
//   };

//   return { logout };
// }


// lib/hooks/useLogout.ts
'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    try {
      // Clear NextAuth session
      await signOut({
        redirect: false,
        callbackUrl: '/auth/login'
      });

      // Clear any localStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding_done');
      }

      // Redirect to login page
      router.push('/auth/login');

      // Force page reload to clear all state
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to login
      window.location.href = '/auth/login';
    }
  };

  return { logout };
}
