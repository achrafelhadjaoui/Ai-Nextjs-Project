'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Monitor session for changes and handle invalid sessions
 * This hook checks if:
 * 1. User was deleted (session becomes null)
 * 2. User role changed (redirect to appropriate dashboard)
 */
export function useSessionMonitor() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Skip if still loading
    if (status === 'loading') return;

    // If unauthenticated, redirect to login
    if (status === 'unauthenticated') {
      console.log('🔒 Session invalidated - redirecting to login');
      router.push('/auth/login');
      return;
    }

    // No polling needed! NextAuth handles session updates automatically
    // Session refreshes on navigation and when needed - professional approach
  }, [status, router]);

  useEffect(() => {
    // When session updates, check if user's role changed
    if (session?.user) {
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath.startsWith('/admin');
      const isAdmin = session.user.role === 'admin';

      // If admin is on user pages, redirect to admin dashboard
      if (isAdmin && !isAdminPath && currentPath.startsWith('/dashboard')) {
        console.log('🔄 Admin detected on user dashboard - redirecting');
        router.push('/admin/dashboard');
      }

      // If non-admin is on admin pages, redirect to user dashboard
      if (!isAdmin && isAdminPath) {
        console.log('⛔ Non-admin on admin page - redirecting');
        router.push('/dashboard');
      }
    }
  }, [session, router]);

  return {
    session,
    status,
    refreshSession: update,
  };
}
