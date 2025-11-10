// providers/session-provider.tsx (Updated for server session)
"use client";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function SessionProviderWrapper({ 
  children, 
  session 
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider
      session={session}
      refetchInterval={30} // Refetch session every 30 seconds to catch role changes and deletions quickly
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}