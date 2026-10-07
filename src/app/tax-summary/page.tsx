import React from "react";
import Link from "next/link";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { formatDZD } from "@/lib/tax";
import { getAnnualTaxSummary } from "@/lib/taxSummary";
import { getStatutoryDeadlines } from "@/lib/statutoryCalendar";
import { StatutoryDeadlinesWidget } from "@/components/tax/StatutoryDeadlinesWidget";
import { AnnualTaxSummaryCard } from "@/components/tax/AnnualTaxSummaryCard";
import {
  Calendar,
  FileText,
  Printer,
  Download,
  ExternalLink,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface TaxSummaryPageProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function TaxSummaryPage({ searchParams }: TaxSummaryPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    return <div>Configuration requise...</div>;
  }

  const currentYear = new Date().getFullYear();
  const resolvedParams = searchParams ? await searchParams : undefined;

  // Discover all distinct fiscal years for this tenant from invoices
  const distinctYears = await db.invoice.findMany({
    where: { tenantId: session.tenantId },
    select: { fiscalYear: true },
    distinct: ["fiscalYear"],
  });

  const availableYears = Array.from(
    new Set([currentYear, ...distinctYears.map((i) => i.fiscalYear)])
  ).sort((a, b) => b - a);

  const requestedYear = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const activeYear = requestedYear && !isNaN(requestedYear) ? requestedYear : currentYear;

  // Fetch certified annual summary & statutory deadlines
  const summary = await getAnnualTaxSummary(session.tenantId, activeYear);
  const deadlines = getStatutoryDeadlines(activeYear, tenant.profile);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Conformité Fiscale DGI & CASNOS
              </span>
              <span className="text-xs text-slate-400">
                Décret 23-197 & Loi 22-23
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Échéances Statutaires & Bordereau Fiscal IFU
            </h1>
            <p className="text-xs text-slate-500">
              Préparez sereinement votre déclaration annuelle (Série G n° 12 bis) pour l'Inspection des Impôts ou Jibayatic.
            </p>
          </div>

          {/* Fiscal Year Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start md:self-auto">
            <span className="text-[11px] font-semibold text-slate-400 px-2">Exercice :</span>
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
          profile={tenant.profile}
          deadlines={deadlines}
        />

        {/* 2. Annual Tax Summary Card with 1-Click Exports */}
        <AnnualTaxSummaryCard summary={summary} />

        {/* 3. Paid Invoice Ledger Table (Livre-Journal des Recettes) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Livre-Journal des Recettes Encaissées — Exercice {activeYear}
              </h3>
              <p className="text-xs text-slate-500">
                Liste exhaustive des paiements effectifs constituant le chiffre d'affaires imposable.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/tax-summary/${activeYear}/csv`}
                download
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">N° Facture</th>
                  <th className="py-3 px-4">Date d'Émission</th>
                  <th className="py-3 px-4">Date d'Encaissement</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Montant Encaissé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {summary.paidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Aucune facture encaissée pour l'exercice {activeYear}.
                    </td>
                  </tr>
                ) : (
                  summary.paidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.issueDate).toLocaleDateString("fr-DZ")}
                      </td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("fr-DZ") : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {inv.clientName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {inv.clientType}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatDZD(inv.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Refunded Credit Notes Subsection if any */}
          {summary.refundedCreditNotes.length > 0 && (
            <div className="border-t border-slate-200">
              <div className="p-4 bg-rose-50/40 border-b border-rose-100">
                <h4 className="text-xs font-bold text-rose-900">
                  Avoirs et Notes de Crédit Remboursées (Déductions de CA)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50/20 text-rose-700 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">N° d'Avoir</th>
                      <th className="py-2.5 px-4">Date de Remboursement</th>
                      <th className="py-2.5 px-4">Facture Rattachée</th>
                      <th className="py-2.5 px-4">Client</th>
                      <th className="py-2.5 px-4">Motif Comptable</th>
                      <th className="py-2.5 px-4 text-right">Montant Déduit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100/50">
                    {summary.refundedCreditNotes.map((cn) => (
                      <tr key={cn.id} className="hover:bg-rose-50/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-rose-700">
                          {cn.creditNoteNumber}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {cn.refundedAt ? new Date(cn.refundedAt).toLocaleDateString("fr-DZ") : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {cn.originalInvoiceNumber}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {cn.clientName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 italic">
                          {cn.reason}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                          - {formatDZD(cn.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
