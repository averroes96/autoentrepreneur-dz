"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Search,
  Download,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface CreditNoteItem {
  id: string;
  creditNoteNumber: string | null;
  reason: string;
  refundStatus: string;
  issueDate: Date | string;
  total: number;
  client: {
    id: string;
    name: string;
  };
  originalInvoice: {
    id: string;
    invoiceNumber: string | null;
  };
}

interface CreditNotesListClientProps {
  initialCreditNotes: CreditNoteItem[];
}

export default function CreditNotesListClient({
  initialCreditNotes,
}: CreditNotesListClientProps) {
  const { t, locale, dir, formatAmount, formatDate } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredCreditNotes = initialCreditNotes.filter((cn) => {
    const matchesSearch =
      (cn.creditNoteNumber &&
        cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cn.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cn.originalInvoice.invoiceNumber &&
        cn.originalInvoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && cn.refundStatus === statusFilter;
  });

  const totalCount = initialCreditNotes.length;
  const totalCreditedDzd = initialCreditNotes.reduce((acc, cn) => acc + cn.total, 0);
  const refundedList = initialCreditNotes.filter((cn) => cn.refundStatus === "REFUNDED");
  const refundedDzd = refundedList.reduce((acc, cn) => acc + cn.total, 0);
  const pendingCount = initialCreditNotes.filter((cn) => cn.refundStatus === "PENDING").length;

  const filterTabs = [
    { id: "ALL", label: t("filterAll"), count: initialCreditNotes.length },
    {
      id: "PENDING",
      label: t("filterPending"),
      count: initialCreditNotes.filter((cn) => cn.refundStatus === "PENDING").length,
    },
    {
      id: "REFUNDED",
      label: t("filterRefunded"),
      count: initialCreditNotes.filter((cn) => cn.refundStatus === "REFUNDED").length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {t("creditNotesTitle")}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("creditNotesSubtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {locale === "ar"
              ? "يتم إنشاء الفاتورة الدائنة انطلاقًا من فاتورة صادرة عبر تبويب الفواتير."
              : "Un avoir se génère depuis une facture émise sur l'onglet Factures."}
          </span>
        </div>
      </div>

      {/* Legal Regulatory Compliance Card */}
      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-rose-950 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-rose-900">
            {locale === "ar"
              ? "القاعدة المحاسبية تحت نظام الضريبة الجزافية الوحيدة IFU (القانون 22-23) :"
              : "Règle comptable sous le régime de l'IFU (Loi 22-23) :"}
          </h4>
          <p className="text-rose-800 leading-relaxed">
            {locale === "ar"
              ? "الفاتورة الرسمية الصادرة غير قابلة للتعديل. عند إلغاء خدمة أو رد مبالغ، فإن إصدار فاتورة دائنة مرقمة (AVR-YYYY-XXXX) يثبت إرجاع الأموال قانوناً ويخصم المبلغ من رقم الأعمال الخاضع للضريبة لتفادي دفع ضرائب غير مستحقة."
              : "Une facture officielle émise est immuable. Lorsqu'une prestation est annulée ou remboursée, l'émission d'un avoir numéroté (AVR-YYYY-XXXX) certifie la restitution des fonds et permet de déduire ce montant du chiffre d'affaires imposable afin de ne pas payer d'impôt indu."}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("totalCreditNotesStat")}</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {locale === "ar" ? "ترقيم تسلسلي إلزامي AVR" : "Numérotation séquentielle AVR"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">
              {locale === "ar" ? "إجمالي المبالغ المنقوصة" : "Total Crédit Annulé"}
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700">- {formatAmount(totalCreditedDzd)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {locale === "ar" ? "مبلغ خام مخصوم" : "Montant brut rectifié"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("refundedCreditNotesStat")}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatAmount(refundedDzd)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{t("deductedFromTurnover")}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{t("pendingRefundStat")}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {locale === "ar" ? "في انتظار التحويل أو التسوية" : "En attente de virement/remboursement"}
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

        <div className="relative min-w-[260px]">
          <Search className={`w-3.5 h-3.5 text-slate-400 absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchCreditNotesPlaceholder")}
            className={`w-full ${dir === "rtl" ? "pr-8.5 pl-3" : "pl-8.5 pr-3"} py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none`}
          />
        </div>
      </div>

      {/* Credit Notes List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCreditNotes.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {locale === "ar" ? "لا توجد أي فاتورة دائنة" : "Aucun avoir trouvé"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {locale === "ar"
                ? "يتم إصدار الفواتير الدائنة عند الحاجة لتصحيح أو إلغاء فاتورة سابقة."
                : "Les avoirs sont générés lorsqu'une facture doit être rectifiée ou remboursée."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t("colCreditNoteNumber")}</th>
                  <th className="py-3 px-4">{t("colLinkedInvoice")}</th>
                  <th className="py-3 px-4">{t("colClient")}</th>
                  <th className="py-3 px-4">{t("colReason")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colCreditedAmount")}</th>
                  <th className="py-3 px-4 text-center">{t("colRefundStatus")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCreditNotes.map((cn) => {
                  return (
                    <tr key={cn.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/credit-notes/${cn.id}`}
                          className="hover:text-rose-600 transition flex items-center gap-1.5"
                        >
                          <span>{cn.creditNoteNumber || t("draftLabel")}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <Link
                          href={`/invoices/${cn.originalInvoice.id}`}
                          className="hover:text-emerald-600 hover:underline transition"
                        >
                          {cn.originalInvoice.invoiceNumber || "Facture"}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {cn.client.name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={cn.reason}>
                        {cn.reason}
                      </td>

                      <td className="py-3.5 px-4 text-right rtl:text-left font-bold text-rose-700">
                        - {formatAmount(cn.total)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {cn.refundStatus === "REFUNDED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t("statusRefunded")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {t("statusPendingRefund")}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <a
                            href={`/api/credit-notes/${cn.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            title={t("downloadPdf")}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <Link
                            href={`/credit-notes/${cn.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition shadow-2xs"
                          >
                            <span>{locale === "ar" ? "التفاصيل" : "Détails"}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
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
