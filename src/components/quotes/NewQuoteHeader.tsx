"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

export function NewQuoteHeader() {
  const { t, dir } = useI18n();

  return (
    <div className="flex items-center gap-3 pb-1">
      <Link
        href="/quotes"
        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition"
        title={t("backToQuotes")}
      >
        <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {t("newQuoteTitle")}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{t("newQuoteSubtitle")}</p>
      </div>
    </div>
  );
}

export default NewQuoteHeader;
