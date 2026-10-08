"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, Ban, FileSpreadsheet, RotateCcw } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { InvoiceDetailControls } from "./InvoiceDetailControls";

interface InvoiceDetailHeaderProps {
  invoice: any;
}

export function InvoiceDetailHeader({ invoice }: InvoiceDetailHeaderProps) {
  const { t, locale, dir, formatDate } = useI18n();

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title, Status & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
            title={t("backToInvoices")}
          >
            <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {invoice.invoiceNumber || t("draftLabel")}
              </h1>

              {/* Status Pill */}
              {invoice.status === "DRAFT" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {t("draftLabel")}
                </span>
              ) : invoice.status === "CANCELLED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {t("cancelledLabel")}
                </span>
              ) : invoice.paymentStatus === "PAID" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("statusPaidEncaissee")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {t("statusPendingPayment")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("clientLabelPrefix")} <strong className="text-slate-700">{invoice.client?.name}</strong> •{" "}
              {t("dateLabelPrefix")} {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>

        <InvoiceDetailControls invoice={invoice} />
      </div>

      {/* Notice Banners */}
      {invoice.status === "DRAFT" && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p>{t("bannerDraftInvoice")}</p>
        </div>
      )}

      {invoice.status === "ISSUED" && (
        <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <p>{t("bannerIssuedInvoice")}</p>
        </div>
      )}

      {invoice.status === "CANCELLED" && (
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs flex items-center gap-2.5">
          <Ban className="w-4 h-4 text-rose-600 shrink-0" />
          <p>
            {t("bannerCancelledInvoice", {
              reason: invoice.cancellationReason || (locale === "ar" ? "غير محدد" : "Non précisé"),
            })}
          </p>
        </div>
      )}

      {/* Source Quote Banner */}
      {invoice.sourceQuote && (
        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-900 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
            <p>
              {t("bannerSourceQuote", {
                number: invoice.sourceQuote.quoteNumber || t("draftLabel"),
              })}
            </p>
          </div>
          <Link
            href={`/quotes/${invoice.sourceQuote.id}`}
            className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 underline shrink-0"
          >
            <span>{t("bannerViewQuote")}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>&rarr;</span>
          </Link>
        </div>
      )}

      {/* Linked Credit Notes Banner */}
      {invoice.creditNotes && invoice.creditNotes.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <p>
              {t("bannerCreditNoteLinked", {
                number: invoice.creditNotes[0].creditNoteNumber || "AVR",
                reason: invoice.creditNotes[0].reason,
              })}
            </p>
          </div>
          <Link
            href={`/credit-notes/${invoice.creditNotes[0].id}`}
            className="inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline shrink-0"
          >
            <span>{t("bannerViewCreditNote")}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>&rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default InvoiceDetailHeader;
