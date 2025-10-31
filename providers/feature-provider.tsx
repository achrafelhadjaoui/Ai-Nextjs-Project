"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface FeatureData {
  name: string;
  description?: string;
  enabled: boolean;
  maintenanceMode: boolean;
  route?: string;
  adminRoute?: string;
  sidebarSection: "user" | "admin" | "both" | "none";
  icon?: string;
  order: number;
  metadata?: Record<string, any>;
}

interface FeatureContextType {
  features: Record<string, FeatureData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFeatureEnabled: (featureKey: string) => boolean;
  isFeatureInMaintenance: (featureKey: string) => boolean;
  hasFeatureAccess: (featureKey: string) => boolean;
  getFeature: (featureKey: string) => FeatureData | null;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [features, setFeatures] = useState<Record<string, FeatureData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/features", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setFeatures(data.data || {});
      } else {
        setError(data.message || "Failed to fetch features");
      }
    } catch (err: any) {
      console.error("Error fetching features:", err);
      setError(err.message || "Failed to fetch features");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return;

    fetchFeatures();

    // Refresh features every 5 minutes
    const interval = setInterval(fetchFeatures, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status]);

  /**
   * Check if a feature is enabled
   */
  const isFeatureEnabled = (featureKey: string): boolean => {
    const feature = features[featureKey];
    if (!feature) return false;
    return feature.enabled;
  };

  /**
   * Check if a feature is in maintenance mode
   */
  const isFeatureInMaintenance = (featureKey: string): boolean => {
    const feature = features[featureKey];
    if (!feature) return false;
    return feature.maintenanceMode;
  };

  /**
   * Check if the current user has access to a feature
   * (considers enabled state, maintenance mode, and role)
   */
  const hasFeatureAccess = (featureKey: string): boolean => {
    const feature = features[featureKey];
    if (!feature) return false;

    // Feature must be enabled
    if (!feature.enabled) return false;

    // Admins can access features in maintenance mode
    if (feature.maintenanceMode && session?.user?.role !== "admin") {
      return false;
    }

    return true;
  };

  /**
   * Get full feature data
   */
  const getFeature = (featureKey: string): FeatureData | null => {
    return features[featureKey] || null;
  };

  const value: FeatureContextType = {
    features,
    loading,
    error,
    refetch: fetchFeatures,
    isFeatureEnabled,
    isFeatureInMaintenance,
    hasFeatureAccess,
    getFeature,
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}

/**
 * Hook to access feature management
 */
export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error("useFeatures must be used within a FeatureProvider");
  }
  return context;
}

/**
 * Hook to check a specific feature
 */
export function useFeature(featureKey: string) {
  const { getFeature, isFeatureEnabled, isFeatureInMaintenance, hasFeatureAccess } = useFeatures();
  const feature = getFeature(featureKey);

  return {
    feature,
    enabled: isFeatureEnabled(featureKey),
    maintenanceMode: isFeatureInMaintenance(featureKey),
    hasAccess: hasFeatureAccess(featureKey),
    exists: feature !== null,
  };
}
