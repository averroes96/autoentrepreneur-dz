"use client";

import React from "react";
import Link from "next/link";
import { formatDZD } from "@/lib/tax";
import { AnnualTaxSummary } from "@/lib/taxSummary";
import {
  FileText,
  Download,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Info,
  Clock,
  Printer,
} from "lucide-react";

interface AnnualTaxSummaryCardProps {
  summary: AnnualTaxSummary;
}

export function AnnualTaxSummaryCard({ summary }: AnnualTaxSummaryCardProps) {
  const { metrics, fiscalYear, seller } = summary;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Série G n° 12 bis • Loi 22-23
            </span>
            <span className="text-xs text-slate-400">
              Exercice Fiscal {fiscalYear}
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Bordereau Récapitulatif Fiscal & Déclaration IFU
          </h2>
          <p className="text-xs text-slate-300">
            Document officiel certifié pour soumission physique à l'Inspection des Impôts ou télédéclaration sur Jibayatic.
          </p>
        </div>

        {/* 1-Click Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/tax-summary/${fiscalYear}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Bordereau PDF Officiel</span>
          </a>

          <a
            href={`/api/tax-summary/${fiscalYear}/csv`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Livre Recettes (CSV)</span>
          </a>

          <a
            href="https://jibayatic.mfdgi.gov.dz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition"
          >
            <span>Jibayatic ↗</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              1. Total Facturé Émis
            </span>
            <div className="text-lg font-extrabold text-slate-900 mt-1">
              {formatDZD(metrics.grossBilledDzd)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Toutes factures de l'exercice
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              2. Encaissements Effectifs
            </span>
            <div className="text-lg font-extrabold text-slate-900 mt-1">
              {formatDZD(metrics.rawCollectedDzd)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {metrics.totalPaidInvoicesCount} factures payées
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              3. Avoirs Déduits
            </span>
            <div className="text-lg font-extrabold text-rose-700 mt-1">
              - {formatDZD(metrics.totalRefundedCreditDzd)}
            </div>
            <p className="text-[11px] text-rose-600/80 mt-0.5">
              {metrics.totalRefundedNotesCount} avoirs remboursés
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              4. CA Net Imposable
            </span>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {formatDZD(metrics.netTaxableTurnoverDzd)}
            </div>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Base officielle de calcul IFU
            </p>
          </div>
        </div>

        {/* Tax Settlement Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Liquidation Fiscale : Impôt Forfaitaire Unique (IFU) à 0,5%
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              En vertu de l'article 13 de la loi n° 22-23 et de la Loi de Finances 2024, le taux unifié
              de 0,5% remplace l'IRG, la TVA et la TAP. L'impôt est exigible auprès du Trésor Public
              au plus tard le <strong>31 Janvier {fiscalYear + 1}</strong>.
            </p>
            {metrics.isMinimumApplied && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Le montant brut calculé ({formatDZD(metrics.rawIfuTaxDzd)}) étant inférieur au seuil
                  légal, le <strong>plancher forfaitaire minimum de {formatDZD(metrics.minimumTaxDzd)}</strong> s'applique.
                </span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0 p-4 rounded-xl bg-white border border-emerald-300/80 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Montant Total Dû au Trésor
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {formatDZD(metrics.finalTaxOwedDzd)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Quittance libératoire
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnualTaxSummaryCard;
