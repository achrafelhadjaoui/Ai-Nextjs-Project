'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/providers/i18n-provider';

interface LanguageSwitcherProps {
  onClose?: () => void;
}

export default function LanguageSwitcher({ onClose }: LanguageSwitcherProps) {
  const { switchLocale, locale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = (newLocale: string) => {
    switchLocale(newLocale as 'en' | 'fr');
    if (onClose) {
      onClose();
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            locale === lang.code
              ? 'bg-white/10 text-white'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="text-base">{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}