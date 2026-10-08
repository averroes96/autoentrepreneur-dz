"use client";

import React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { StatutoryDeadlinesWidget } from "./StatutoryDeadlinesWidget";
import { AnnualTaxSummaryCard } from "./AnnualTaxSummaryCard";
import { AnnualTaxSummary } from "@/lib/taxSummary";

interface TaxSummaryViewProps {
  activeYear: number;
  availableYears: number[];
  summary: AnnualTaxSummary;
  deadlines: any[];
  profile: any;
}

export function TaxSummaryView({
  activeYear,
  availableYears,
  summary,
  deadlines,
  profile,
}: TaxSummaryViewProps) {
  const { t, locale, formatAmount, formatDate } = useI18n();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {t("fiscalComplianceBadge")}
            </span>
            <span className="text-xs text-slate-400">
              {t("fiscalDecree")}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("taxSummaryTitle")}
          </h1>
          <p className="text-xs text-slate-500">
            {t("taxSummarySubtitle")}
          </p>
        </div>

        {/* Fiscal Year Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start md:self-auto">
          <span className="text-[11px] font-semibold text-slate-400 px-2">
            {t("fiscalExerciseLabel")}
          </span>
          {availableYears.map((yr) => (
            <Link
              key={yr}
              href={`/tax-summary?year=${yr}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                yr === activeYear
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {yr}
            </Link>
          ))}
        </div>
      </div>

      {/* 1. Dynamic Deadline Badges & Statutory Calendar */}
      <StatutoryDeadlinesWidget
        fiscalYear={activeYear}
        profile={profile}
        deadlines={deadlines}
      />

      {/* 2. Annual Tax Summary Card with 1-Click Exports */}
      <AnnualTaxSummaryCard summary={summary} />

      {/* 3. Paid Invoice Ledger Table (Livre-Journal des Recettes) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {locale === "ar"
                ? `سجل المقبوضات المحصلة (Livre-Journal) — السنة المالية ${activeYear}`
                : `Livre-Journal des Recettes Encaissées — Exercice ${activeYear}`}
            </h3>
            <p className="text-xs text-slate-500">
              {locale === "ar"
                ? "القائمة الشاملة للمدفوعات الفعلية المحصلة التي تشكل رقم الأعمال الخاضع للضريبة."
                : "Liste exhaustive des paiements effectifs constituant le chiffre d'affaires imposable."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/tax-summary/${activeYear}/csv`}
              download
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("exportCsv")}</span>
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t("colNumber")}</th>
                <th className="py-3 px-4">{locale === "ar" ? "تاريخ الإصدار" : "Date d'Émission"}</th>
                <th className="py-3 px-4">{locale === "ar" ? "تاريخ التحصيل" : "Date d'Encaissement"}</th>
                <th className="py-3 px-4">{t("colClient")}</th>
                <th className="py-3 px-4">{locale === "ar" ? "الصفة" : "Type"}</th>
                <th className="py-3 px-4 text-right rtl:text-left">{locale === "ar" ? "المبلغ المحصل" : "Montant Encaissé"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {summary.paidInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {locale === "ar"
                      ? `لا توجد أي فواتير محصلة للسنة المالية ${activeYear}.`
                      : `Aucune facture encaissée pour l'exercice ${activeYear}.`}
                  </td>
                </tr>
              ) : (
                summary.paidInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.paidAt ? formatDate(inv.paidAt) : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {inv.clientName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {inv.clientType === "PROFESSIONAL"
                          ? t("societyClient")
                          : t("individualClient")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right rtl:text-left font-bold text-slate-900">
                      {formatAmount(inv.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TaxSummaryView;
