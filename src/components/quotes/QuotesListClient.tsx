"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface QuoteItem {
  id: string;
  quoteNumber: string | null;
  status: string;
  issueDate: Date | string;
  validUntil: Date | string | null;
  total: number;
  client: {
    id: string;
    name: string;
    clientType: string;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string | null;
    status: string;
  }>;
}

interface QuotesListClientProps {
  initialQuotes: QuoteItem[];
}

export default function QuotesListClient({ initialQuotes }: QuotesListClientProps) {
  const { t, locale, dir, formatAmount, formatDate } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredQuotes = initialQuotes.filter((q) => {
    const matchesSearch =
      (q.quoteNumber && q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.client.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && q.status === statusFilter;
  });

  const totalQuotesCount = initialQuotes.length;
  const acceptedQuotes = initialQuotes.filter(
    (q) => q.status === "ACCEPTED" || q.status === "CONVERTED"
  );
  const acceptedTotalDzd = acceptedQuotes.reduce((acc, q) => acc + q.total, 0);
  const pendingQuotes = initialQuotes.filter(
    (q) => q.status === "SENT" || q.status === "DRAFT"
  );
  const convertedCount = initialQuotes.filter((q) => q.status === "CONVERTED").length;
  const conversionRate =
    totalQuotesCount > 0 ? Math.round((convertedCount / totalQuotesCount) * 100) : 0;

  const filterTabs = [
    { id: "ALL", label: t("filterAll"), count: initialQuotes.length },
    {
      id: "DRAFT",
      label: t("filterDrafts"),
      count: initialQuotes.filter((q) => q.status === "DRAFT").length,
    },
    {
      id: "SENT",
      label: t("filterSent"),
      count: initialQuotes.filter((q) => q.status === "SENT").length,
    },
    {
      id: "ACCEPTED",
      label: t("filterAccepted"),
      count: initialQuotes.filter((q) => q.status === "ACCEPTED").length,
    },
    {
      id: "CONVERTED",
      label: t("filterConverted"),
      count: initialQuotes.filter((q) => q.status === "CONVERTED").length,
    },
    {
      id: "REJECTED",
      label: t("filterRejected"),
      count: initialQuotes.filter((q) => q.status === "REJECTED").length,
    },
  ];

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {t("quotesTitle")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("quotesSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t("newQuoteBtn")}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("totalQuotesStat")}</span>
            <FileSpreadsheet className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalQuotesCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">{t("allExercises")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("acceptedQuotesStat")}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatAmount(acceptedTotalDzd)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("proposalsAccepted", { count: acceptedQuotes.length })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("pendingQuotesStat")}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingQuotes.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">{t("draftOrSent")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("conversionRateStat")}</span>
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-black text-violet-700">{conversionRate}%</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {t("convertedCountText", { count: convertedCount })}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchQuotesPlaceholder")}
            className={`w-full ${dir === "rtl" ? "pr-8.5 pl-3" : "pl-8.5 pr-3"} py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none`}
          />
        </div>
      </div>

      {/* Quotes List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t("noQuotesFound")}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t("startCreateQuote")}
            </p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("newQuoteBtn")}</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t("colQuoteNumber")}</th>
                  <th className="py-3 px-4">{t("colClient")}</th>
                  <th className="py-3 px-4">{t("colValidity")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colEstimatedAmount")}</th>
                  <th className="py-3 px-4 text-center">{t("colInvoiceStatus")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => {
                  const isExpired =
                    quote.validUntil &&
                    new Date(quote.validUntil) < now &&
                    quote.status !== "ACCEPTED" &&
                    quote.status !== "CONVERTED";

                  const generatedInvoice = quote.invoices?.[0];

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="hover:text-sky-600 transition flex items-center gap-1.5"
                        >
                          <span>{quote.quoteNumber || t("draftLabel")}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{quote.client.name}</p>
                        <span className="text-[10px] text-slate-400">
                          {quote.client.clientType === "PROFESSIONAL"
                            ? t("societyClient")
                            : t("individualClient")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <p>{formatDate(quote.issueDate)}</p>
                        {quote.validUntil && (
                          <p
                            className={`text-[10px] ${
                              isExpired ? "text-rose-600 font-bold" : "text-slate-400"
                            }`}
                          >
                            {isExpired ? t("expiredOn") : t("validUntil")}
                            {formatDate(quote.validUntil)}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-slate-900">
                        {formatAmount(quote.total)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {quote.status === "DRAFT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {t("draftLabel")}
                          </span>
                        ) : quote.status === "SENT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            {t("statusSent")}
                          </span>
                        ) : quote.status === "ACCEPTED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t("statusAccepted")}
                          </span>
                        ) : quote.status === "CONVERTED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {t("statusConverted")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {t("statusRejected")}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          {generatedInvoice ? (
                            <Link
                              href={`/invoices/${generatedInvoice.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold transition"
                              title={t("viewGeneratedInvoice")}
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>{generatedInvoice.invoiceNumber || t("viewGeneratedInvoice")}</span>
                            </Link>
                          ) : null}

                          {quote.status !== "DRAFT" && (
                            <a
                              href={`/api/quotes/${quote.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                              title={t("downloadPdf")}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <Link
                            href={`/quotes/${quote.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition shadow-2xs"
                          >
                            <span>{locale === "ar" ? "التفاصيل" : "Détails"}</span>
                            <ArrowRight className={`w-3 h-3 ${dir === "rtl" ? "rotate-180" : ""}`} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
