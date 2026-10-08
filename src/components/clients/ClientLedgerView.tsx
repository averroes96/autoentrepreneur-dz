"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ClientLedgerData, LedgerEntryType } from "@/lib/clientLedger";
import { formatPaymentMethodLabel } from "@/lib/clientLedger";
import {
  ArrowLeft,
  Building,
  User,
  FileText,
  CreditCard,
  RotateCcw,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  Search,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

export function ClientLedgerView({ ledger }: { ledger: ClientLedgerData }) {
  const { client, seller, metrics, entries } = ledger;
  const { t, locale, dir, formatAmount, formatDate } = useI18n();

  const [filterType, setFilterType] = useState<"ALL" | LedgerEntryType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEntries = entries.filter((entry) => {
    const matchesFilter = filterType === "ALL" || entry.type === filterType;
    const matchesSearch =
      searchTerm.trim() === "" ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.paymentReference &&
        entry.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const isPro = client.clientType === "PROFESSIONAL";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t("allClientsBack")}</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("clientLedgerTitle")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Create Invoice for this client */}
          <Link
            href={`/invoices/new?clientId=${client.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("newInvoiceQuick")}</span>
          </Link>

          {/* Quick Create Quote */}
          <Link
            href={`/quotes/new?clientId=${client.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("newQuoteQuick")}</span>
          </Link>

          {/* Export CSV */}
          <a
            href={`/api/clients/${client.id}/statement/csv`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
            title={locale === "ar" ? "تصدير السجل المالي إلى Excel / CSV" : "Exporter l'historique complet en fichier Excel / CSV"}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("btnExportCsv")}</span>
          </a>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("btnPrint")}</span>
          </button>

          {/* Download Official PDF Statement */}
          <a
            href={`/api/clients/${client.id}/statement/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("btnOfficialPdfStatement")}</span>
          </a>
        </div>
      </div>

      {/* Client Overview & Identifiers Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isPro
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}
            >
              {isPro ? <Building className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {client.name}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {isPro ? t("societyClient") : t("individualClient")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("clientLedgerSubtitle")}
              </p>
            </div>
          </div>

          {/* Account Status Pill */}
          <div>
            {metrics.isSettled ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("accountSettledBadge")}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{t("accountDebitBadge")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="space-y-1">
            <span className="font-semibold text-slate-400 text-[10px] uppercase block">
              {t("clientAddressLabel")}
            </span>
            <div className="flex items-start gap-1.5 text-slate-800 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{client.address || t("notSpecified")}</span>
            </div>
          </div>

          {client.email && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 text-[10px] uppercase block">
                {t("clientEmailLabel")}
              </span>
              <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            </div>
          )}

          {client.phone && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 text-[10px] uppercase block">
                {t("clientPhoneLabel")}
              </span>
              <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
            </div>
          )}

          {client.nif && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-400 text-[10px] uppercase block">
                {t("clientNifLabel")}
              </span>
              <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {client.nif}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Financial Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("totalBilled")}
            </span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatAmount(metrics.totalBilledDzd)}
          </div>
          <p className="text-[11px] text-slate-500">
            {t("invoicesIssuedCount", { count: metrics.invoicesCount, plural: metrics.invoicesCount > 1 ? "s" : "" })}
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("totalPaid")}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {formatAmount(metrics.totalPaidDzd)}
          </div>
          <p className="text-[11px] text-slate-500">
            {t("invoicesPaidCount", { count: metrics.paidInvoicesCount, plural: metrics.paidInvoicesCount > 1 ? "s" : "" })}
          </p>
        </div>

        {/* Total Credit Notes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("totalCreditNotes")}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 font-mono">
            {formatAmount(metrics.totalCreditNotesDzd)}
          </div>
          <p className="text-[11px] text-slate-500">
            {t("creditNotesAppliedCount", { count: metrics.creditNotesCount, plural: metrics.creditNotesCount > 1 ? "s" : "" })}
          </p>
        </div>

        {/* Pending Outstanding Balance */}
        <div
          className={`p-5 rounded-2xl border shadow-2xs space-y-2 ${
            metrics.isSettled
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-amber-50/50 border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t("pendingBalance")}
            </span>
            <div
              className={`p-2 rounded-xl border ${
                metrics.isSettled
                  ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                  : "bg-amber-100/80 text-amber-800 border-amber-300"
              }`}
            >
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              metrics.isSettled ? "text-emerald-700" : "text-amber-900"
            }`}
          >
            {formatAmount(metrics.outstandingBalanceDzd)}
          </div>
          <p
            className={`text-[11px] font-semibold ${
              metrics.isSettled ? "text-emerald-700" : "text-amber-800"
            }`}
          >
            {metrics.isSettled ? t("accountFullySettled") : t("pendingClientPayment")}
          </p>
        </div>
      </div>

      {/* Chronological Financial Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls (Filter & Search) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: t("allTransactions", { count: entries.length }) },
              { id: "INVOICE", label: t("tabInvoicesCount", { count: metrics.invoicesCount }) },
              { id: "PAYMENT", label: t("tabPaymentsCount", { count: metrics.paidInvoicesCount }) },
              { id: "CREDIT_NOTE", label: t("tabCreditNotesCount", { count: metrics.creditNotesCount }) },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterType === tab.id
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className={`w-4 h-4 text-slate-400 absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2`} />
            <input
              type="text"
              placeholder={t("ledgerSearchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${dir === "rtl" ? "pr-9 pl-3.5 text-right" : "pl-9 pr-3.5 text-left"} py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition`}
            />
          </div>
        </div>

        {/* Ledger Entries Table */}
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {t("noEntriesFound")}
            </p>
            <p className="text-xs text-slate-400">
              {searchTerm
                ? t("noLedgerEntriesSearchMatch")
                : t("noLedgerEntriesForClient")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">{t("colOperationDate")}</th>
                  <th className="py-3 px-4">{t("colOperationType")}</th>
                  <th className="py-3 px-4">{t("colOperationRef")}</th>
                  <th className="py-3 px-5">{t("colOperationDesc")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colDebit")}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t("colCredit")}</th>
                  <th className="py-3 px-5 text-right rtl:text-left">{t("colRunningBalance")}</th>
                  <th className="py-3 px-4 text-center no-print">{t("colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEntries.map((entry) => {
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                      {/* Date */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-900">
                        {formatDate(entry.date)}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {entry.type === "INVOICE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                            <FileText className="w-3 h-3" />
                            <span>{t("entryTypeInvoice")}</span>
                          </span>
                        )}
                        {entry.type === "PAYMENT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                            <Receipt className="w-3 h-3" />
                            <span>{t("entryTypePayment")}</span>
                          </span>
                        )}
                        {entry.type === "CREDIT_NOTE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                            <RotateCcw className="w-3 h-3" />
                            <span>{t("entryTypeCreditNote")}</span>
                          </span>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                        {entry.type === "INVOICE" && (
                          <Link
                            href={`/invoices/${entry.documentId}`}
                            className="hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <span>{entry.reference}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 no-print" />
                          </Link>
                        )}
                        {entry.type === "PAYMENT" && (
                          <Link
                            href={`/invoices/${entry.documentId}/receipt`}
                            className="hover:text-emerald-700 hover:underline flex items-center gap-1 text-emerald-800"
                          >
                            <span>{entry.reference}</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 no-print" />
                          </Link>
                        )}
                        {entry.type === "CREDIT_NOTE" && (
                          <Link
                            href={`/credit-notes/${entry.documentId}`}
                            className="hover:text-rose-700 hover:underline flex items-center gap-1 text-rose-800"
                          >
                            <span>{entry.reference}</span>
                            <ExternalLink className="w-3 h-3 text-rose-400 no-print" />
                          </Link>
                        )}
                      </td>

                      {/* Description & Method */}
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-slate-900 leading-tight">
                          {entry.description}
                        </div>
                        {entry.paymentMethod && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-600">
                              {formatPaymentMethodLabel(entry.paymentMethod)}
                            </span>
                            {entry.paymentReference && (
                              <span className="font-mono text-slate-400">
                                (Réf: {entry.paymentReference})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Debit (+) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right rtl:text-left font-mono font-bold text-slate-900">
                        {entry.debit > 0 ? (
                          <span>+ {formatAmount(entry.debit)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Credit (-) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right rtl:text-left font-mono font-bold text-emerald-700">
                        {entry.credit > 0 ? (
                          <span>- {formatAmount(entry.credit)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Progressive Running Balance */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-right rtl:text-left font-mono font-extrabold text-slate-900">
                        <span
                          className={
                            entry.runningBalance > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }
                        >
                          {formatAmount(entry.runningBalance)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap no-print">
                        {entry.type === "INVOICE" && (
                          <Link
                            href={`/invoices/${entry.documentId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <span>{t("detailsAction")}</span>
                          </Link>
                        )}
                        {entry.type === "PAYMENT" && (
                          <Link
                            href={`/invoices/${entry.documentId}/receipt`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            <span>{t("btnReceipt")}</span>
                          </Link>
                        )}
                        {entry.type === "CREDIT_NOTE" && (
                          <Link
                            href={`/credit-notes/${entry.documentId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            <span>{t("detailsAction")}</span>
                          </Link>
                        )}
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

export default ClientLedgerView;
