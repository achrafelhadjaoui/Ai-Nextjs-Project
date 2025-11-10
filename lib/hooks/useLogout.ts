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
      // Even if there's an error, redirect to login
      window.location.href = '/auth/login';
    }
  };

  return { logout };
}
