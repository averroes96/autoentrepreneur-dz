"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

export function EditInvoiceHeader({ invoiceId }: { invoiceId: string }) {
  const { t, dir } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/invoices/${invoiceId}`}
        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
        title={t("backToInvoices")}
      >
        <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t("editDraftTitle")}</h1>
        <p className="text-sm text-slate-500">{t("editDraftSubtitle")}</p>
      </div>
    </div>
  );
}

export default EditInvoiceHeader;
