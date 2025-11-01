// lib/hooks/useAuth.ts
'use client';

import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status, update } = useSession();
  
  return {
    user: session?.user || null,
    loading: status === "loading",
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.role === "admin",
    isVerified: session?.user?.isVerified || false,
    updateSession: update,
  };
}