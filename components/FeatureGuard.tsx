"use client";

import React from "react";
import { useFeature } from "@/providers/feature-provider";
import { useSession } from "next-auth/react";
import { Loader2, Wrench, XCircle } from "lucide-react";

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMaintenanceMessage?: boolean;
}

/**
 * FeatureGuard component protects routes based on feature toggles
 *
 * Usage:
 * <FeatureGuard featureKey="feature-requests">
 *   <YourComponent />
 * </FeatureGuard>
 */
export default function FeatureGuard({
  featureKey,
  children,
  fallback,
  showMaintenanceMessage = true,
}: FeatureGuardProps) {
  const { feature, enabled, maintenanceMode, hasAccess, exists } = useFeature(featureKey);
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading" || !exists) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )
    );
  }

  // Feature doesn't exist
  if (!exists) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Feature Not Found</h2>
          <p className="text-gray-400">
            The requested feature does not exist or has been removed.
          </p>
        </div>
      )
    );
  }

  // Feature is disabled
  if (!enabled) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
          <XCircle className="w-16 h-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Feature Unavailable</h2>
          <p className="text-gray-400">
            This feature is currently disabled.
          </p>
          {session?.user?.role === "admin" && (
            <p className="text-sm text-yellow-500 mt-4">
              Admin: You can enable this feature in the Feature Management panel.
            </p>
          )}
        </div>
      )
    );
  }

  // Feature is in maintenance mode (non-admins can't access)
  if (maintenanceMode && session?.user?.role !== "admin") {
    return (
      fallback || (
        showMaintenanceMessage && (
          <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
            <Wrench className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Under Maintenance</h2>
            <p className="text-gray-400 mb-2">
              {feature?.name || "This feature"} is currently undergoing maintenance.
            </p>
            <p className="text-gray-500 text-sm">
              Please check back later. We apologize for the inconvenience.
            </p>
          </div>
        )
      )
    );
  }

  // User has no access
  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">
            You do not have permission to access this feature.
          </p>
        </div>
      )
    );
  }

  // Show maintenance banner for admins
  if (maintenanceMode && session?.user?.role === "admin" && showMaintenanceMessage) {
    return (
      <>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-yellow-500 font-medium">Maintenance Mode Active</p>
              <p className="text-sm text-gray-400">
                This feature is in maintenance mode. Only admins can access it.
              </p>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}

/**
 * Simpler inline feature check component
 *
 * Usage:
 * <IfFeatureEnabled featureKey="analytics">
 *   <AnalyticsWidget />
 * </IfFeatureEnabled>
 */
export function IfFeatureEnabled({
  featureKey,
  children,
}: {
  featureKey: string;
  children: React.ReactNode;
}) {
  const { hasAccess } = useFeature(featureKey);

  if (!hasAccess) return null;

  return <>{children}</>;
}
