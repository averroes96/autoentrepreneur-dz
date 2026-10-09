"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  ExpenseData,
  ExpensesSummary,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
} from "@/lib/expenses";
import { ExpenseModal } from "./ExpenseModal";
import { deleteExpenseAction } from "@/app/actions";
import {
  Receipt,
  PlusCircle,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ExpenseListClientProps {
  initialExpenses: ExpenseData[];
  initialSummary: ExpensesSummary;
  availableYears: number[];
  selectedYear: number;
}

export function ExpenseListClient({
  initialExpenses,
  initialSummary,
  availableYears,
  selectedYear,
}: ExpenseListClientProps) {
  const { t, locale, dir, formatAmount, formatDate } = useI18n();

  const [activeTab, setActiveTab] = useState<"JOURNAL" | "PROFITABILITY">("JOURNAL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseData | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((exp) => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.supplier && exp.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || exp.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialExpenses, searchTerm, selectedCategory]);

  const handleDelete = async (id: string) => {
    if (confirm(t("expenseDeleteConfirm"))) {
      setIsDeletingId(id);
      try {
        await deleteExpenseAction(id);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  const handleEdit = (exp: ExpenseData) => {
    setExpenseToEdit(exp);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };

  const getCategoryDef = (catKey: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.key === catKey) || {
        key: catKey,
        labelFr: catKey,
        labelAr: catKey,
        color: "text-slate-600",
        bgColor: "bg-slate-50 border-slate-200",
      }
    );
  };

  const isProfitable = initialSummary.realNetProfitDzd >= 0;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 shadow-xs">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("expensesTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t("expensesSubtitle")}
            </p>
          </div>
        </div>

        {/* Action buttons & Year Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {availableYears.map((yr) => (
              <Link
                key={yr}
                href={`/expenses?year=${yr}`}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  yr === selectedYear
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {yr}
              </Link>
            ))}
          </div>

          {/* Export CSV button */}
          <a
            href={`/api/expenses/${selectedYear}/csv`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t("exportExpensesCsv")}</span>
          </a>

          {/* New Expense button */}
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("newExpenseBtn")}</span>
          </button>
        </div>
      </div>

      {/* Regulatory Disclaimer Notice (Loi 22-23 / IFU) */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950">
            {locale === "ar"
              ? "ملاحظة تشريعية هامة : قاعدة الوعاء الضريبي لنظام المقاول الذاتي"
              : "Règle Fiscale & Statutaire (Loi n° 22-23 du 18 décembre 2022)"}
          </p>
          <p className="leading-relaxed opacity-95">
            {t("expensesRegulatoryNotice")}
          </p>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("statTotalExpenses")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatAmount(initialSummary.totalExpensesDzd)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {initialSummary.expenseCount}{" "}
            {locale === "ar" ? "عملية مسجلة" : "dépenses enregistrées"}
          </p>
        </div>

        {/* Real Net Profit */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("statNetProfit")}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isProfitable ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black ${
              isProfitable ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatAmount(initialSummary.realNetProfitDzd)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isProfitable
              ? locale === "ar"
                ? "نشاط رابح بعد خصم الضرائب والاشتراكات"
                : "Activité nette positive"
              : locale === "ar"
              ? "عجز مالي مؤقت"
              : "Déficit d'exploitation"}
          </p>
        </div>

        {/* Net Profit Margin (%) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("statNetMargin")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {initialSummary.netProfitMarginPercent}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {locale === "ar" ? "من إجمالي المداخيل المحصلة" : "Du C.A brut encaissé"}
          </p>
        </div>

        {/* Top Expense Category */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("statTopCategory")}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900 truncate">
            {initialSummary.topCategory
              ? locale === "ar"
                ? initialSummary.topCategory.labelAr
                : initialSummary.topCategory.labelFr
              : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {initialSummary.topCategory
              ? `${formatAmount(initialSummary.topCategory.totalAmount)} (${initialSummary.topCategory.percentage}%)`
              : locale === "ar" ? "لا توجد مصاريف" : "Aucune charge"}
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Journal vs Analyse de Rentabilité */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("JOURNAL")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "JOURNAL"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {locale === "ar" ? "سجل النفقات التفصيلي" : "Journal des Dépenses"} (
          {initialExpenses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PROFITABILITY")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "PROFITABILITY"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          {t("netProfitBreakdownTitle")}
        </button>
      </div>

      {/* TAB 1: JOURNAL DES DÉPENSES */}
      {activeTab === "JOURNAL" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "بحث بعنوان النفقة، المورد، أو رقم الفاتورة..."
                    : "Rechercher par intitulé, fournisseur, n° pièce..."
                }
                className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              >
                <option value="ALL">{t("allCategories")}</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {locale === "ar" ? cat.labelAr : cat.labelFr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  {t("noExpensesFound")}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {locale === "ar"
                    ? "سجل نفقاتك لتتبع تكاليف العمل التقني ومساحات العمل والبرمجيات."
                    : "Enregistrez vos premières charges professionnelles pour garder une vue claire sur votre rentabilité."}
                </p>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t("newExpenseBtn")}</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500">
                      <th className="py-3 px-4">{t("colDate")}</th>
                      <th className="py-3 px-4">{t("expenseTitleLabel")}</th>
                      <th className="py-3 px-4">{t("expenseCategoryLabel")}</th>
                      <th className="py-3 px-4">{t("expenseSupplierLabel")}</th>
                      <th className="py-3 px-4">{t("expensePaymentMethodLabel")}</th>
                      <th className="py-3 px-4 text-right rtl:text-left">{t("colTotal")}</th>
                      <th className="py-3 px-4 text-center">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredExpenses.map((exp) => {
                      const catDef = getCategoryDef(exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-500">
                            {formatDate(exp.date)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{exp.title}</div>
                            {exp.invoiceNumber && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                N° {exp.invoiceNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${catDef.bgColor} ${catDef.color}`}
                            >
                              {locale === "ar" ? catDef.labelAr : catDef.labelFr}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {exp.supplier || "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {exp.paymentMethod}
                          </td>
                          <td className="py-3 px-4 text-right rtl:text-left font-black text-slate-900 font-mono">
                            {formatAmount(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(exp)}
                                title={t("expenseEditBtn")}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(exp.id)}
                                disabled={isDeletingId === exp.id}
                                title={t("expenseDeleteBtn")}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
      )}

      {/* TAB 2: ANALYSE DE RENTABILITÉ & BÉNÉFICE NET */}
      {activeTab === "PROFITABILITY" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waterfall Profit Table (2 columns on large) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {t("netProfitBreakdownTitle")} ({selectedYear})
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {locale === "ar" ? "حساب الأرباح الفعلية" : "Flux Financier Réel"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Gross Collected Turnover */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="font-semibold text-emerald-950">
                  (+) {t("collectedTurnoverLabel")}
                </span>
                <span className="font-black text-emerald-800 text-sm font-mono">
                  {formatAmount(initialSummary.netCollectedTurnoverDzd)}
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">
                  (-) {t("totalOperatingExpensesLabel")}
                </span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  - {formatAmount(initialSummary.totalExpensesDzd)}
                </span>
              </div>

              {/* IFU Tax (0.5%) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">
                  (-) {t("ifuTaxLabel")}
                </span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  - {formatAmount(initialSummary.estimatedIfuTaxDzd)}
                </span>
              </div>

              {/* CASNOS Social Contribution */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-700">
                  (-) {t("casnosLabel")}
                </span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  - {formatAmount(initialSummary.casnosContributionDzd)}
                </span>
              </div>

              {/* Final Real Net Profit */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  isProfitable
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20"
                    : "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20"
                }`}
              >
                <div>
                  <span className="font-bold text-sm block">
                    (=) {t("realNetProfitLabel")}
                  </span>
                  <span className="text-[11px] opacity-90 block mt-0.5">
                    {locale === "ar"
                      ? `هامش الربح الصافي : ${initialSummary.netProfitMarginPercent}%`
                      : `Marge bénéficiaire nette : ${initialSummary.netProfitMarginPercent}%`}
                  </span>
                </div>
                <span className="font-black text-lg sm:text-xl font-mono">
                  {formatAmount(initialSummary.realNetProfitDzd)}
                </span>
              </div>
            </div>

            {/* Monthly Trend Table */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-3">
                {t("monthlyEvolutionTitle")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold">
                      <th className="py-2 px-3">{locale === "ar" ? "الشهر" : "Mois"}</th>
                      <th className="py-2 px-3 text-right rtl:text-left">{t("monthlyTurnover")}</th>
                      <th className="py-2 px-3 text-right rtl:text-left">{t("monthlyExpenses")}</th>
                      <th className="py-2 px-3 text-right rtl:text-left">{t("monthlyProfit")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {initialSummary.monthlyTrends.map((tr) => (
                      <tr key={tr.month} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 font-medium">
                          {locale === "ar" ? tr.monthNameAr : tr.monthNameFr}
                        </td>
                        <td className="py-2 px-3 text-right rtl:text-left font-mono">
                          {tr.turnoverDzd > 0 ? formatAmount(tr.turnoverDzd) : "—"}
                        </td>
                        <td className="py-2 px-3 text-right rtl:text-left font-mono text-rose-700">
                          {tr.expensesDzd > 0 ? `- ${formatAmount(tr.expensesDzd)}` : "—"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right rtl:text-left font-mono font-bold ${
                            tr.netProfitDzd >= 0 ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {tr.turnoverDzd > 0 || tr.expensesDzd > 0
                            ? formatAmount(tr.netProfitDzd)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown (1 column on large) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              {locale === "ar" ? "توزيع المصاريف حسب الفئات" : "Répartition par Catégorie"}
            </h2>

            <div className="space-y-3">
              {initialSummary.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                      {locale === "ar" ? cat.labelAr : cat.labelFr}
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatAmount(cat.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono w-9 text-right rtl:text-left">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Create/Edit */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
