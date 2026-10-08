"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { CreditNoteDetailControls } from "./CreditNoteDetailControls";

interface CreditNoteDetailHeaderProps {
  creditNote: any;
}

export function CreditNoteDetailHeader({ creditNote }: CreditNoteDetailHeaderProps) {
  const { t, locale, dir, formatDate } = useI18n();

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title, Status & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/credit-notes"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
            title={t("backToCreditNotes")}
          >
            <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {creditNote.creditNoteNumber || (locale === "ar" ? "سند إنقاص مسودة" : "Avoir Brouillon")}
              </h1>

              {/* Status Pill */}
              {creditNote.refundStatus === "REFUNDED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("statusRefundedDeduit")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("statusPendingCompensation")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("clientLabelPrefix")} <strong className="text-slate-700">{creditNote.client?.name}</strong> •{" "}
              {t("dateLabelPrefix")} {formatDate(creditNote.issueDate)} • {t("refLabelPrefix")}{" "}
              <strong className="text-slate-700">{creditNote.originalInvoice?.invoiceNumber || "FAC"}</strong>
            </p>
          </div>
        </div>

        <CreditNoteDetailControls creditNote={creditNote} />
      </div>

      {/* Original Invoice & Legal Notice Banner */}
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <p>
              {t("bannerCreditNoteOriginal", {
                number: creditNote.originalInvoice?.invoiceNumber || "FAC",
                reason: creditNote.reason,
              })}
            </p>
          </div>
        </div>
        <Link
          href={`/invoices/${creditNote.originalInvoice?.id}`}
          className="inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline shrink-0"
        >
          <span>{t("bannerViewInvoice")}</span>
          <span className={dir === "rtl" ? "rotate-180" : ""}>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export default CreditNoteDetailHeader;
