'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Redirects admin users to admin dashboard
 * Place this in /dashboard page to redirect admins
 */
export function AdminRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user?.role === 'admin') {
      console.log('[AdminRedirect] Admin user detected, redirecting to /admin/dashboard');
      router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  return null;
}
