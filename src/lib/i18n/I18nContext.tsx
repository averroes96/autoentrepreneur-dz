"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { translations, Locale, TranslationKey } from "./translations";
import { formatDZD } from "@/lib/tax";
import { formatDZD_AR, formatArabicDate } from "@/lib/arabicNomenclature";

interface I18nContextType {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatAmount: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "moukawil_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initial sync from localStorage or html attribute
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    const initialLocale: Locale =
      stored === "ar" || stored === "fr"
        ? stored
        : document.documentElement.dir === "rtl"
        ? "ar"
        : "fr";

    setLocaleState(initialLocale);
    document.documentElement.dir = initialLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = initialLocale;
    setMounted(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "fr" || e.newValue === "ar")) {
        setLocaleState(e.newValue);
        document.documentElement.dir = e.newValue === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = e.newValue;
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
    window.dispatchEvent(
      new CustomEvent("moukawil:language-change", { detail: { lang: newLocale } })
    );
  };

  const toggleLocale = () => {
    setLocale(locale === "fr" ? "ar" : "fr");
  };

  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = translations[locale] || translations.fr;
      let text: string = dict[key] || translations.fr[key] || key;

      if (params) {
        Object.entries(params).forEach(([paramKey, val]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
        });
      }

      return text;
    };
  }, [locale]);

  const formatAmount = useMemo(() => {
    return (amount: number): string => {
      if (locale === "ar") {
        return formatDZD_AR(amount);
      }
      return formatDZD(amount);
    };
  }, [locale]);

  const formatDate = useMemo(() => {
    return (dateInput: Date | string): string => {
      if (locale === "ar") {
        return formatArabicDate(dateInput);
      }
      const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      return d.toLocaleDateString("fr-DZ");
    };
  }, [locale]);

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  const contextValue = useMemo(
    () => ({
      locale,
      dir,
      setLocale,
      toggleLocale,
      t,
      formatAmount,
      formatDate,
    }),
    [locale, dir, t, formatAmount, formatDate]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Graceful fallback for non-provider usage or tests
    return {
      locale: "fr" as Locale,
      dir: "ltr" as const,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text: string = (translations.fr[key] as string) || (key as string);
        if (params) {
          Object.entries(params).forEach(([paramKey, val]) => {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
          });
        }
        return text;
      },
      formatAmount: (amount: number) => formatDZD(amount),
      formatDate: (date: Date | string) =>
        (typeof date === "string" ? new Date(date) : date).toLocaleDateString("fr-DZ"),
    };
  }
  return context;
}
