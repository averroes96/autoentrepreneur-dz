"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";

export function LanguageToggle() {
  const [lang, setLang] = useState<"fr" | "ar">("fr");

  useEffect(() => {
    // Check initial stored language or html dir
    const stored = localStorage.getItem("moukawil_locale") as "fr" | "ar" | null;
    if (stored === "ar" || stored === "fr") {
      setLang(stored);
      document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = stored;
    } else {
      const currentDir = document.documentElement.dir;
      if (currentDir === "rtl") {
        setLang("ar");
      }
    }
  }, []);

  const toggleLanguage = (newLang: "fr" | "ar") => {
    setLang(newLang);
    localStorage.setItem("moukawil_locale", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    // Dispatch custom event for document paper cards to sync if on invoice/quote pages
    window.dispatchEvent(new CustomEvent("moukawil:language-change", { detail: { lang: newLang } }));
  };

  return (
    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
      <button
        type="button"
        onClick={() => toggleLanguage("fr")}
        className={`px-2 py-1 rounded-lg font-semibold transition ${
          lang === "fr"
            ? "bg-white text-slate-900 shadow-2xs font-bold"
            : "text-slate-500 hover:text-slate-800"
        }`}
        title="Passer en Français (LTR)"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("ar")}
        className={`px-2 py-1 rounded-lg font-semibold transition font-arabic ${
          lang === "ar"
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
