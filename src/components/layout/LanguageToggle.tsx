"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
          locale === "fr"
            ? "bg-white text-slate-900 shadow-2xs font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="Passer en Français (LTR)"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer font-arabic ${
          locale === "ar"
            ? "bg-emerald-600 text-white shadow-2xs font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="التحويل إلى اللغة العربية (RTL)"
      >
        عربي
      </button>
    </div>
  );
}

export default LanguageToggle;
