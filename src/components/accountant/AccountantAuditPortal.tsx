"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { logoutAccountantAction } from "@/app/actions";
import { formatDZD } from "@/lib/tax";
import { formatCurrencyAmount } from "@/lib/currencies";
import {
  ShieldCheck,
  Download,
  FileArchive,
  FileText,
  FileSpreadsheet,
  Users,
  Receipt,
  RotateCcw,
  Calendar,
  Lock,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Briefcase,
  HelpCircle,
  Clock,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";

interface AccountantAuditPortalProps {
  token: string;
  auditData: any;
  selectedYear: number;
}

export function AccountantAuditPortal({
  token,
  auditData,
  selectedYear,
}: AccountantAuditPortalProps) {
  const { t, dir } = useI18n();

  const [activeTab, setActiveTab] = useState<"ifu" | "recettes" | "depenses" | "clients">("ifu");
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const p = auditData.profile;
  const m = auditData.taxSummary.metrics;
  const access = auditData.access;
  const availableYears = auditData.availableYears as number[];

  const quarters = [
    { quarter: 1, label: "Jan — Mar", months: [0, 1, 2], deadline: `30 Avril ${selectedYear}` },
    { quarter: 2, label: "Avr — Juin", months: [3, 4, 5], deadline: `31 Juillet ${selectedYear}` },
    { quarter: 3, label: "Juil — Sept", months: [6, 7, 8], deadline: `31 Octobre ${selectedYear}` },
    { quarter: 4, label: "Oct — Déc", months: [9, 10, 11], deadline: `31 Janvier ${selectedYear + 1}` },
  ].map((q) => {
    const qInvoices = (auditData.taxSummary.paidInvoices || []).filter((inv: any) => {
      const d = new Date(inv.paidAt || inv.issueDate);
      return q.months.includes(d.getMonth());
    });
    const qCredits = (auditData.taxSummary.refundedCreditNotes || []).filter((cn: any) => {
      const d = new Date(cn.refundedAt || cn.issueDate);
      return q.months.includes(d.getMonth());
    });

    const rawCollected = qInvoices.reduce((acc: number, inv: any) => acc + (inv.total || 0), 0);
    const refundedCredit = qCredits.reduce((acc: number, cn: any) => acc + (cn.total || 0), 0);
    const netTaxable = Math.max(0, rawCollected - refundedCredit);
    const tax = netTaxable * 0.005;

    return {
      quarter: q.quarter,
      label: q.label,
      rawCollectedDzd: rawCollected,
      refundedCreditDzd: refundedCredit,
      netTaxableDzd: netTaxable,
      taxCalculatedDzd: tax,
      deadline: q.deadline,
    };
  });

  const handleYearChange = (newYear: number) => {
    window.location.href = `/portal/accountant/${token}?year=${newYear}`;
  };

  const handleDownloadZip = () => {
    setIsDownloadingZip(true);
    const link = document.createElement("a");
    link.href = `/api/accountant/${token}/export-zip?year=${selectedYear}`;
    link.download = `Pack_Audit_${selectedYear}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingZip(false), 2000);
  };

  const handleLogout = async () => {
    await logoutAccountantAction(token);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans" dir={dir}>
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
              {t("portalHeaderBadge")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auditeur :</span>
              <strong className="text-white">{access.name}</strong>
            </div>

            <div className="h-3 w-px bg-slate-700 hidden sm:block" />

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                type="button"
                onClick={handleLogout}
                title="Quitter la session d'audit"
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Identity & Status */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-sm shadow-emerald-600/30">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {p?.fullName || "Auto-Entrepreneur"}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    Statut Auto-Entrepreneur (Loi 22-23)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                  <span>
                    RNAE : <strong className="text-slate-900 font-mono">{p?.rnaeNumber || "—"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    NIF : <strong className="text-slate-900 font-mono">{p?.nif || "—"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Activité : <strong className="text-slate-900">{p?.activityLabel || "—"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Controls: Year & Download ZIP */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Fiscal Year Selector */}
              {access.lockedFiscalYear === null && availableYears.length > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Exercice {yr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {access.lockedFiscalYear !== null && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Exercice {selectedYear}</span>
                </div>
              )}

              {/* Download Audit Pack Button */}
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FileArchive className="w-4 h-4" />
                <span>
                  {isDownloadingZip ? "Téléchargement..." : "Pack d'Audit Complet (ZIP)"}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 border-t border-slate-100 mt-4 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("ifu")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "ifu"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Synthèse Fiscale IFU (G12 bis)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recettes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "recettes"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Livre des Recettes ({auditData.invoices.length + auditData.creditNotes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("depenses")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "depenses"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Registre des Dépenses ({auditData.expenses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === "clients"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Grand Livre Clients ({auditData.clients.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Read-Only Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 flex-1">
            <span className="font-bold">Espace de consultation certifié conforme :</span>{" "}
            {t("portalReadOnlyNotice")} Cet export contient le registre chronologique immuable pour
            l&apos;exercice fiscal <strong>{selectedYear}</strong>.
          </div>
        </div>

        {/* ================= TAB 1: SYNTHÈSE FISCALE IFU ================= */}
        {activeTab === "ifu" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CA Brut Facturé */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Chiffre d&apos;Affaires Brut Facturé
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
                  {formatDZD(m.grossBilledDzd)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Total factures émises ({auditData.invoices.length})
                </div>
              </div>

              {/* CA Net Encaissé (Assiette) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assiette IFU (CA Net Encaissé)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
                  {formatDZD(m.netTaxableTurnoverDzd)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Encaissé moins avoirs remboursés
                </div>
              </div>

              {/* Impôt IFU Dû */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Impôt IFU Dû (0,5%)
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 font-mono">
                  {formatDZD(m.finalTaxOwedDzd)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  {m.isMinimumApplied
                    ? "Minimum de 10 000 DZD appliqué"
                    : "0,5% calculé sur l'assiette"}
                </div>
              </div>

              {/* Plafond Légal 5M DZD */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Plafond Légal (5 000 000 DZD)
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {m.ceilingConsumedPercentage}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Reste : <strong className="font-mono">{formatDZD(m.remainingCeilingDzd)}</strong>
                </div>
              </div>
            </div>

            {/* Quarterly Breakdown & PDF Download */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Déclaration Annuelle Série G n° 12 bis — Exercice {selectedYear}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tableau récapitulatif des échéances et déclarations trimestrielles légales.
                  </p>
                </div>

                <a
                  href={`/api/accountant/${token}/export-pdf?year=${selectedYear}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le Bilan G12 bis (PDF)</span>
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="py-2.5 px-4">Période Trimestrielle</th>
                      <th className="py-2.5 px-4">Encaissements Bruts</th>
                      <th className="py-2.5 px-4">Avoirs Remboursés</th>
                      <th className="py-2.5 px-4">CA Net Déclarable</th>
                      <th className="py-2.5 px-4">Impôt Calculé (0,5%)</th>
                      <th className="py-2.5 px-4 text-right">Date Limite de Dépôt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quarters.map((q) => (
                      <tr key={q.quarter} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Trimestre {q.quarter} ({q.label})
                        </td>
                        <td className="py-3 px-4 font-mono">{formatDZD(q.rawCollectedDzd)}</td>
                        <td className="py-3 px-4 font-mono text-rose-600">
                          {q.refundedCreditDzd > 0 ? `-${formatDZD(q.refundedCreditDzd)}` : "0,00 DZD"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatDZD(q.netTaxableDzd)}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700">
                          {formatDZD(q.taxCalculatedDzd)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">
                          {q.deadline}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                      <td className="py-3 px-4 uppercase text-[11px]">Total Annuel</td>
                      <td className="py-3 px-4 font-mono">{formatDZD(m.rawCollectedDzd)}</td>
                      <td className="py-3 px-4 font-mono text-rose-600">
                        -{formatDZD(m.totalRefundedCreditDzd)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900">
                        {formatDZD(m.netTaxableTurnoverDzd)}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700">
                        {formatDZD(m.finalTaxOwedDzd)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-emerald-700 font-semibold">
                        G12 bis Récapitulatif
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVRE DES RECETTES ================= */}
        {activeTab === "recettes" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Livre des Recettes Chronologique — Exercice {selectedYear}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Journal officiel de facturation conforme aux exigences du décret exécutif n° 23-197.
                </p>
              </div>

              <a
                href={`/api/accountant/${token}/export-csv/recettes?year=${selectedYear}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
              >
                <Download className="w-4 h-4" />
                <span>Exporter CSV Recettes</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-4">Réf. Document</th>
                    <th className="py-3 px-4">Date d&apos;émission</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Devise</th>
                    <th className="py-3 px-4">Total (DZD)</th>
                    <th className="py-3 px-4">Statut d&apos;encaissement</th>
                    <th className="py-3 px-4">Règlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Invoices */}
                  {auditData.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {inv.client?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          FACTURE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {inv.currency !== "DZD" ? (
                          <span className="font-mono text-[11px] font-semibold text-emerald-700">
                            {formatCurrencyAmount(inv.total, inv.currency)}
                          </span>
                        ) : (
                          "DZD"
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatDZD(inv.totalDzd ?? inv.total)}
                      </td>
                      <td className="py-3 px-4">
                        {inv.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Encaissée</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {inv.paymentMethod || "—"}
                      </td>
                    </tr>
                  ))}

                  {/* Credit Notes */}
                  {auditData.creditNotes.map((cn: any) => (
                    <tr key={cn.id} className="hover:bg-rose-50/30 bg-rose-50/15">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        {cn.creditNoteNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(cn.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {cn.client?.name || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-semibold text-[10px]">
                          AVOIR
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {cn.currency !== "DZD" ? (
                          <span className="font-mono text-[11px] font-semibold text-rose-700">
                            -{formatCurrencyAmount(cn.total, cn.currency)}
                          </span>
                        ) : (
                          "DZD"
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-700">
                        -{formatDZD(cn.totalDzd ?? cn.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold">
                          {cn.refundStatus === "REFUNDED" ? "Remboursé (Déductible)" : "Compensé"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {cn.reason || "Rectification"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: REGISTRE DES DÉPENSES ================= */}
        {activeTab === "depenses" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Legal Notice about non-deductibility */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-semibold mb-0.5">
                  Précision comptable & fiscale (Loi n° 22-23) :
                </strong>
                Sous le régime de l&apos;auto-entrepreneur en Algérie, l&apos;IFU est assis
                exclusivement sur le chiffre d&apos;affaires brut encaissé. Ces dépenses ne sont pas
                déductibles fiscalement du barème IFU, mais ce registre est tenu pour la
                justification de rentabilité et le dossier comptable de fin d&apos;exercice.
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registre des Charges & Dépenses d&apos;Exploitation ({selectedYear})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {auditData.expenses.length} dépenses opérationnelles enregistrées.
                  </p>
                </div>

                <a
                  href={`/api/accountant/${token}/export-csv/depenses?year=${selectedYear}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter CSV Dépenses</span>
                </a>
              </div>

              {auditData.expenses.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Aucune dépense enregistrée pour l&apos;exercice fiscal {selectedYear}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Catégorie</th>
                        <th className="py-3 px-4">Libellé / Objet</th>
                        <th className="py-3 px-4">Fournisseur</th>
                        <th className="py-3 px-4">N° Facture / Pièce</th>
                        <th className="py-3 px-4">Montant (DZD)</th>
                        <th className="py-3 px-4">Mode de règlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditData.expenses.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(exp.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{exp.title}</td>
                          <td className="py-3 px-4 text-slate-600">{exp.supplier || "—"}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                            {exp.invoiceNumber || "—"}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatDZD(exp.amountDzd ?? exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {exp.paymentMethod || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200 text-slate-900">
                        <td colSpan={5} className="py-3 px-4 uppercase text-[11px]">
                          Total des Charges d&apos;Exploitation
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900">
                          {formatDZD(
                            auditData.expenses.reduce(
                              (acc: number, e: any) => acc + (e.amountDzd ?? e.amount ?? 0),
                              0
                            )
                          )}
                        </td>
                        <td className="py-3 px-4" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: GRAND LIVRE CLIENTS ================= */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Grand Livre Récapitulatif des Comptes Clients ({selectedYear})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  État des créances, encaissements et soldes résiduels par tiers.
                </p>
              </div>

              <a
                href={`/api/accountant/${token}/export-csv/clients?year=${selectedYear}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
              >
                <Download className="w-4 h-4" />
                <span>Exporter CSV Clients</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">NIF / Identifiants</th>
                    <th className="py-3 px-4">Total Facturé (DZD)</th>
                    <th className="py-3 px-4">Total Réglé (DZD)</th>
                    <th className="py-3 px-4">Avoirs (DZD)</th>
                    <th className="py-3 px-4">Solde Dû (DZD)</th>
                    <th className="py-3 px-4">Situation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditData.clients.map((c: any) => {
                    const totalBilled = c.invoices.reduce(
                      (acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0),
                      0
                    );
                    const totalPaid = c.invoices
                      .filter((inv: any) => inv.paymentStatus === "PAID")
                      .reduce((acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
                    const totalCredits = c.creditNotes.reduce(
                      (acc: number, cn: any) => acc + (cn.totalDzd ?? cn.total ?? 0),
                      0
                    );
                    const outstanding = Math.max(0, totalBilled - totalPaid - totalCredits);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.clientType === "PROFESSIONAL" ? "Société" : "Particulier"}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {c.nif || c.rc || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatDZD(totalBilled)}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-700">
                          {formatDZD(totalPaid)}
                        </td>
                        <td className="py-3 px-4 font-mono text-rose-600">
                          {totalCredits > 0 ? `-${formatDZD(totalCredits)}` : "0,00 DZD"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          {outstanding > 0 ? (
                            <span className="text-amber-700">{formatDZD(outstanding)}</span>
                          ) : (
                            <span className="text-slate-400">0,00 DZD</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {outstanding === 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                              Soldé
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                              En cours
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <p>
          Portail d&apos;audit externe certifié • Auto Entrepreneur DZ • Conforme aux dispositions de la Loi n°
          22-23 portant statut de l&apos;auto-entrepreneur.
        </p>
      </footer>
    </div>
  );
}
