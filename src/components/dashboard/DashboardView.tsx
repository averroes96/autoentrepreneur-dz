"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Users,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  ArrowRight,
  FileSpreadsheet,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { StatutoryDeadlinesWidget } from "@/components/tax/StatutoryDeadlinesWidget";

interface DashboardViewProps {
  session: {
    fullName: string;
    email: string;
  };
  tenant: {
    name: string;
    profile: any;
  };
  activeYear: number;
  availableYears: number[];
  profileCompletion: {
    percentage: number;
    isFullyComplete: boolean;
    missingItems: Array<{ key: string; label: string }>;
  };
  totalPaidDzd: number;
  pendingPaymentDzd: number;
  totalBilledDzd: number;
  ceiling: {
    status: string;
    statusLabel: string;
    badgeColor: string;
    percentage: number;
    ceilingLimitDzd: number;
    remainingDzd: number;
  };
  ifu: {
    taxOwedDzd: number;
    rawTaxDzd: number;
    minimumTaxDzd: number;
    isMinimumApplied: boolean;
  };
  ifuDeadline?: any;
  issuedInvoices: any[];
  draftInvoices: any[];
  threeYearRule: {
    isAtRisk: boolean;
    riskMessage?: string;
    history: Array<{ year: number; turnoverDzd: number; status: string }>;
  };
  deadlines: any[];
  recentInvoices: any[];
}

export function DashboardView({
  session,
  tenant,
  activeYear,
  availableYears,
  profileCompletion,
  totalPaidDzd,
  pendingPaymentDzd,
  totalBilledDzd,
  ceiling,
  ifu,
  ifuDeadline,
  issuedInvoices,
  draftInvoices,
  threeYearRule,
  deadlines,
  recentInvoices,
}: DashboardViewProps) {
  const { t, locale, dir, formatAmount, formatDate } = useI18n();

  // Status badge label translation
  const getCeilingLabel = (status: string) => {
    switch (status) {
      case "EXCEEDED":
        return t("statusExceeded");
      case "CRITICAL":
        return t("statusCritical");
      case "WARNING":
        return t("statusWarning");
      default:
        return t("statusCompliant");
    }
  };

  const getHistoryStatusLabel = (status: string) => {
    switch (status) {
      case "EXCEEDED":
        return t("statusExceeded");
      case "NEAR_ZERO":
        return t("statusNearZero");
      default:
        return t("statusCompliant");
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Completion Progress Card */}
      {!profileCompletion.isFullyComplete && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-500/20 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-semibold">
                  {t("profileConfig")}
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {t("profileCompletedPercent", { percent: profileCompletion.percentage })}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {t("completeInfoTitle")}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {t("completeInfoDesc")}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-lg bg-white/10 rounded-full h-2.5 overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion.percentage}%` }}
                />
              </div>

              {/* Missing items pills */}
              {profileCompletion.missingItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-300">
                  <span className="text-slate-400 font-medium">{t("toProvide")}</span>
                  {profileCompletion.missingItems.map((m) => (
                    <span
                      key={m.key}
                      className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 text-[10px] font-medium"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
            >
              <span>{t("finalizeProfile")}</span>
              <ArrowRight className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>
      )}

      {/* Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {t("fiscalYear", { year: activeYear })}
            </span>
            {availableYears.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {availableYears.map((yr) => (
                  <Link
                    key={yr}
                    href={`/dashboard?year=${yr}`}
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold transition ${
                      yr === activeYear
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                  >
                    {yr}
                  </Link>
                ))}
              </div>
            )}
            <span className="text-xs text-slate-500">
              {t("rnaeNumberLabel", {
                number: tenant.profile.rnaeNumber || t("toFill"),
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("greeting", { name: tenant.profile.fullName || session.fullName })}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("dashboardSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t("createInvoice")}</span>
          </Link>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
            <span>{t("newQuote")}</span>
          </Link>
          <Link
            href="/credit-notes"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>{t("creditNotesBtn")}</span>
          </Link>
          <Link
            href={`/tax-summary?year=${activeYear}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("taxSummaryBtn")}</span>
          </Link>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("clientsBtn")}</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Chiffre d'Affaires Encaissé & Plafond */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("collectedTurnoverTitle")}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ceiling.badgeColor}`}
              >
                {getCeilingLabel(ceiling.status)}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatAmount(totalPaidDzd)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("annualCeilingLimit", {
                amount: formatAmount(ceiling.ceilingLimitDzd),
              })}
            </p>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-600">{t("ceilingProgress")}</span>
              <span className="text-slate-900 font-bold">{ceiling.percentage}%</span>
            </div>
            {/* Progress bar with warning states */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  ceiling.status === "EXCEEDED" || ceiling.status === "CRITICAL"
                    ? "bg-rose-500"
                    : ceiling.status === "WARNING"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(ceiling.percentage, 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-right rtl:text-left">
              {t("remainingAvailable", {
                amount: formatAmount(ceiling.remainingDzd),
              })}
            </p>
          </div>
        </div>

        {/* Card 2: Live IFU Estimate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("ifuEstimateTitle")}
              </span>
              {ifuDeadline ? (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${ifuDeadline.badgeColor}`}
                >
                  <Clock className="w-3 h-3" />
                  <span>
                    {locale === "ar"
                      ? ifuDeadline.daysRemaining !== undefined
                        ? ifuDeadline.daysRemaining > 0
                          ? `${ifuDeadline.daysRemaining} يوم متبقي`
                          : "فات الأجل"
                        : ifuDeadline.badgeLabel
                      : ifuDeadline.badgeLabel}
                  </span>
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {t("liberatoryRate")}
                </span>
              )}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatAmount(ifu.taxOwedDzd)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("calculatedAtRate")}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{t("rawCalculatedAmount")}</span>
              <span className="font-semibold text-slate-900">{formatAmount(ifu.rawTaxDzd)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("annualLegalMinimum")}</span>
              <span className="font-semibold text-slate-900">
                {formatAmount(ifu.minimumTaxDzd)}
              </span>
            </div>
            {ifu.isMinimumApplied && (
              <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-slate-200">
                ℹ {t("minimumAppliedNotice", { amount: formatAmount(ifu.minimumTaxDzd) })}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {t("deadlineLabel")}{" "}
                <strong className="text-slate-700">
                  {t("ifuDeadlineDate", { day: 31, year: activeYear + 1 })}
                </strong>
              </span>
            </div>
            <Link
              href={`/tax-summary?year=${activeYear}`}
              className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition"
            >
              <span>{t("g12bisLink")}</span>
              <ArrowRight className={`w-3 h-3 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Link>
          </div>
        </div>

        {/* Card 3: Invoicing Totals & Compliance Trackers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              {t("billingActivityTitle", { year: activeYear })}
            </span>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">{t("totalBilledIssued")}</span>
                <span className="text-sm font-bold text-slate-900">{formatAmount(totalBilledDzd)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">{t("pendingPayment")}</span>
                <span className="text-sm font-bold text-amber-600">
                  {formatAmount(pendingPaymentDzd)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-600">{t("invoicesCountLabel")}</span>
                <span className="text-xs font-semibold text-slate-700">
                  {t("invoicesBreakdown", {
                    issued: issuedInvoices.length,
                    draft: draftInvoices.length,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t("casnosFlatRateLabel")}</span>
            </span>
            <span className="font-semibold text-slate-900">
              {formatAmount(24000)}{t("perYearSuffix")}
            </span>
          </div>
        </div>
      </div>

      {/* Statutory Obligations Deadlines & Countdown Calendar */}
      <StatutoryDeadlinesWidget
        fiscalYear={activeYear}
        profile={tenant.profile}
        deadlines={deadlines}
      />

      {/* 3-Year Consecutive Years Compliance Alert / Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                {t("threeYearTitle")}
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              {t("threeYearDesc")}
            </p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 shrink-0"
          >
            {t("manageHistory")}
          </Link>
        </div>

        {threeYearRule.isAtRisk ? (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              {locale === "ar"
                ? "تنبيه تنظيمي: تسجيل رقم أعمال منعدم أو تجاوز السقف لمدة 3 سنوات متتالية يعرض ملفك للشطب القانوني من الوكالة."
                : threeYearRule.riskMessage}
            </span>
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{t("normalRegulatoryStatus")}</span>
          </div>
        )}

        {/* History Pills */}
        <div className="mt-4 flex flex-wrap gap-3">
          {threeYearRule.history.map((h) => (
            <div
              key={h.year}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
            >
              <span className="font-semibold text-slate-700">{h.year} :</span>
              <span className="font-bold text-slate-900">{formatAmount(h.turnoverDzd)}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                  h.status === "EXCEEDED"
                    ? "bg-rose-100 text-rose-700"
                    : h.status === "NEAR_ZERO"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {getHistoryStatusLabel(h.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{t("recentInvoicesTitle")}</h2>
            <p className="text-xs text-slate-500">
              {t("recentInvoicesSubtitle")}
            </p>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
          >
            <span>{t("viewAllInvoices")}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">{t("noInvoicesTitle")}</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {t("noInvoicesSubtitle")}
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("createInvoice")}</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">{t("colNumber")}</th>
                  <th className="py-3 px-6">{t("colClient")}</th>
                  <th className="py-3 px-6">{t("colDate")}</th>
                  <th className="py-3 px-6 text-right rtl:text-left">{t("colTotal")}</th>
                  <th className="py-3 px-6">{t("colInvoiceStatus")}</th>
                  <th className="py-3 px-6">{t("colPayment")}</th>
                  <th className="py-3 px-6 text-right rtl:text-left">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 font-mono">
                      {inv.invoiceNumber || (
                        <span className="text-slate-400 font-normal italic">{t("draftLabel")}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {inv.client.name}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-4 px-6 text-right rtl:text-left font-bold text-slate-900">
                      {formatAmount(inv.total)}
                    </td>
                    <td className="py-4 px-6">
                      {inv.status === "ISSUED" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {t("issuedImmutableLabel")}
                        </span>
                      ) : inv.status === "DRAFT" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {t("draftLabel")}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          {t("cancelledLabel")}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {inv.status === "ISSUED" ? (
                        inv.paymentStatus === "PAID" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t("paidLabel")}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {t("pendingLabel")}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right rtl:text-left">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-semibold text-emerald-600 hover:text-emerald-500 text-xs"
                      >
                        {t("detailsAction")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardView;
