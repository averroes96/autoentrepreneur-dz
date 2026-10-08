"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Download,
  CheckCircle,
  Clock,
  Ban,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface InvoiceItem {
  id: string;
  invoiceNumber: string | null;
  sequenceNumber: number | null;
  fiscalYear: number;
  status: string;
  paymentStatus: string;
  issueDate: Date | string;
  total: number;
  currency: string;
  client: {
    id: string;
    name: string;
  };
  lineItems: Array<any>;
}

export default function InvoicesListClient({
  initialInvoices,
}: {
  initialInvoices: InvoiceItem[];
}) {
  const { t, locale, dir, formatAmount, formatDate } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredInvoices = initialInvoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.client.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "DRAFT") return matchesSearch && inv.status === "DRAFT";
    if (statusFilter === "ISSUED") return matchesSearch && inv.status === "ISSUED";
    if (statusFilter === "PAID") return matchesSearch && inv.status === "ISSUED" && inv.paymentStatus === "PAID";
    if (statusFilter === "UNPAID") return matchesSearch && inv.status === "ISSUED" && inv.paymentStatus === "UNPAID";
    if (statusFilter === "CANCELLED") return matchesSearch && inv.status === "CANCELLED";
    return matchesSearch;
  });

  const filterTabs = [
    { id: "ALL", label: t("filterAll") },
    { id: "DRAFT", label: t("filterDrafts") },
    { id: "ISSUED", label: t("filterIssued") },
    { id: "PAID", label: t("filterPaid") },
    { id: "UNPAID", label: t("filterPending") },
    { id: "CANCELLED", label: t("filterCancelled") },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("tabInvoices")}</h1>
          <p className="text-sm text-slate-500">
            {locale === "ar"
              ? "إدارة الفواتير المتسلسلة والمطابقة قانوناً لنظام المقاول الذاتي (القانون 22-23)."
              : "Gestion de votre facturation séquentielle et conforme au régime auto-entrepreneur."}
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t("createInvoice")}</span>
        </Link>
      </div>
      {/* Search and Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-slate-400`} />
          <input
            type="text"
            placeholder={t("searchInvoicesPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${
              dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
            } py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">{t("noInvoicesFound")}</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {searchTerm
                ? locale === "ar"
                  ? "لا توجد أي وثيقة تطابق معايير البحث."
                  : "Aucun document ne correspond à vos filtres."
                : t("noInvoicesSubtitle")}
            </p>
            {!searchTerm && (
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
              >
                <span>{t("createInvoice")}</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">{t("colNumber")}</th>
                  <th className="py-3.5 px-6">{t("colClient")}</th>
                  <th className="py-3.5 px-6">{t("colDate")}</th>
                  <th className="py-3.5 px-6 text-right rtl:text-left">{t("colTotal")}</th>
                  <th className="py-3.5 px-6">{t("colInvoiceStatus")}</th>
                  <th className="py-3.5 px-6">{t("colPayment")}</th>
                  <th className="py-3.5 px-6 text-right rtl:text-left">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 font-mono">
                      {inv.invoiceNumber || (
                        <span className="text-slate-400 font-normal italic">{t("draftLabel")}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{t("issuedImmutableLabel")}</span>
                        </span>
                      ) : inv.status === "DRAFT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{t("draftLabel")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>{t("cancelledLabel")}</span>
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
                      <div className="flex items-center justify-end rtl:justify-start gap-2">
                        {inv.status === "ISSUED" && (
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t("downloadPdf")}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
                        >
                          <span>{locale === "ar" ? "عرض" : "Voir"}</span>
                          <ArrowRight className={`w-3.5 h-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
                        </Link>
                      </div>
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
