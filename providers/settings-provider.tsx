'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  settings: Record<string, any>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  get: (key: string, defaultValue?: any) => any;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/app-settings', {
        cache: 'no-store', // Always get fresh settings
      });

      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.message || 'Failed to load settings');
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message);
      // Set default fallback settings
      setSettings({
        'app.name': 'Farisly AI',
        'app.description': 'AI-powered browser extension',
        'theme.primary_color': '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Refresh settings every 5 minutes to catch admin changes
    const interval = setInterval(fetchSettings, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const get = (key: string, defaultValue: any = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        refetch: fetchSettings,
        get,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}

// Convenience hook for getting a single setting
export function useSetting(key: string, defaultValue?: any) {
  const { get, loading } = useSettings();
  return { value: get(key, defaultValue), loading };
}
