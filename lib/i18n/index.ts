// "use client";

// // ✅ Import translation JSONs
// import en from "./translations/en/common.json";
// import fr from "./translations/fr/common.json";

// // ✅ Create an object with all translations
// const languages: Record<string, any> = { en, fr };

// // ✅ Return default language (later you can read from cookies or browser)
// export function useLocale(): string {
//   return "en";
// }

// // ✅ Return translations for the current locale
// export function useTranslations(): Record<string, string> {
//   const locale = useLocale();
//   return languages[locale] || languages.en;
// }




// "use client";

// import { useState, useEffect } from "react";

// // ✅ Import translation JSONs
// import en from "./translations/en/common.json";
// import fr from "./translations/fr/common.json";

// // ✅ Create an object with all translations
// const languages: Record<string, any> = { en, fr };

// // ✅ Export available locales for the switcher
// export const locales = ["en", "fr"];

// // ✅ Return current language (reads from localStorage)
// export function useLocale(): string {
//   const [locale, setLocale] = useState("en");
  
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const saved = localStorage.getItem("locale") || "en";
//       setLocale(saved);
//     }
//   }, []);
  
//   return locale;
// }

// // ✅ Return translations for the current locale
// export function useTranslations(): Record<string, string> {
//   const locale = useLocale();
//   return languages[locale] || languages.en;
// }



"use client";

import en from "./translations/en/common.json";
import fr from "./translations/fr/common.json";
import { useState, useEffect } from "react";

const allTranslations: Record<string, any> = { en, fr };
const translations = ["en", "fr"];

export function useLocale() {
  const [locale, setLocale] = useState("en");
  const [t, setT] = useState(allTranslations.en);

  useEffect(() => {
    const stored = localStorage.getItem("locale") || "en";
    setLocale(stored);
    setT(allTranslations[stored]);
  }, []);

  const switchLocale = (newLocale: string) => {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
    setT(allTranslations[newLocale]);
  };

  return { translations ,locale, switchLocale, t };
}
