"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { QuoteDetailControls } from "./QuoteDetailControls";

interface QuoteDetailHeaderProps {
  quote: any;
}

export function QuoteDetailHeader({ quote }: QuoteDetailHeaderProps) {
  const { t, locale, dir, formatDate } = useI18n();

  const generatedInvoice = quote.invoices?.[0];
  const isExpired =
    quote.validUntil &&
    new Date(quote.validUntil) < new Date() &&
    quote.status !== "ACCEPTED" &&
    quote.status !== "CONVERTED";

  return (
    <div className="space-y-4">
      {/* Top Header Row with Title, Status & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <Link
            href="/quotes"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
            title={t("backToQuotes")}
          >
            <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {quote.quoteNumber || t("draftLabel")}
              </h1>

              {/* Status Pill */}
              {quote.status === "DRAFT" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {t("draftLabel")}
                </span>
              ) : quote.status === "SENT" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  {t("statusSentToClient")}
                </span>
              ) : quote.status === "ACCEPTED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("statusAcceptedByClient")}
                </span>
              ) : quote.status === "CONVERTED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {t("statusConvertedInvoiced")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {t("statusRejectedByClient")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("clientLabelPrefix")} <strong className="text-slate-700">{quote.client?.name}</strong> •{" "}
              {t("dateLabelPrefix")} {formatDate(quote.issueDate)}
              {quote.validUntil && (
                <span>
                  {" "}• {t("validityLabelPrefix")} {formatDate(quote.validUntil)}
                </span>
              )}
            </p>
          </div>
        </div>

        <QuoteDetailControls quote={quote} />
      </div>

      {/* Converted to Invoice Banner */}
      {quote.status === "CONVERTED" && generatedInvoice && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
            <p>
              {t("bannerQuoteConverted", {
                number: generatedInvoice.invoiceNumber || "FAC",
              })}
            </p>
          </div>
          <Link
            href={`/invoices/${generatedInvoice.id}`}
            className="inline-flex items-center gap-1 font-bold text-purple-800 hover:text-purple-950 underline shrink-0"
          >
            <span>{t("bannerViewInvoice")}</span>
            <span className={dir === "rtl" ? "rotate-180" : ""}>&rarr;</span>
          </Link>
        </div>
      )}

      {/* Accepted Banner */}
      {quote.status === "ACCEPTED" && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p>{t("bannerQuoteAccepted")}</p>
        </div>
      )}

      {/* Expired Banner */}
      {isExpired && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p>
            {t("bannerQuoteExpired", {
              date: formatDate(quote.validUntil),
            })}
          </p>
        </div>
      )}
    </div>
  );
}

export default QuoteDetailHeader;
