'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/app-settings', {
        cache: 'no-store',
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

  // Connect to real-time settings updates via SSE
  const connectToStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/app-settings/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          // Connection established
          setLoading(false);
        } else if (data.type === 'settings') {
          // Real-time settings update
          setSettings(data.data || {});
          setLoading(false);
          setError(null);
        } else if (data.type === 'error') {
          setError(data.message);
        }
        // Ignore heartbeat messages
      } catch (err) {
        // Invalid message format - ignore
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      setError('Connection lost. Reconnecting...');

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectToStream();
      }, 5000);
    };
  };

  useEffect(() => {
    // Connect to real-time stream instead of polling
    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
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
