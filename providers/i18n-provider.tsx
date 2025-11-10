
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/lib/i18n/translations/en/common.json';
import fr from '@/lib/i18n/translations/fr/common.json';

const translations = { en, fr };

type Locale = 'en' | 'fr';

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  switchLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // ✅ Load locale from localStorage (on mount)
  useEffect(() => {
    setMounted(true);
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && translations[savedLocale]) {
      setLocale(savedLocale);
    }
  }, []);

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) value = value?.[k];
    return value ?? key;
  };

  // ✅ Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ locale, t, switchLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};