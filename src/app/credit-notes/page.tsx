import React from "react";
import Link from "next/link";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { formatDZD } from "@/lib/tax";
import {
  RotateCcw,
  Search,
  Download,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import InvoicingTabs from "@/components/invoicing/InvoicingTabs";

export const dynamic = "force-dynamic";

export default async function CreditNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const resolvedParams = await searchParams;

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const statusFilter = resolvedParams?.status;
  const searchFilter = resolvedParams?.search?.toLowerCase();

  const [creditNotes, invoicesCount, quotesCount] = await Promise.all([
    db.creditNote.findMany({
      where: {
        tenantId: session.tenantId,
        ...(statusFilter && statusFilter !== "ALL" ? { refundStatus: statusFilter } : {}),
      },
      include: {
        client: true,
        originalInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.count({ where: { tenantId: session.tenantId } }),
    db.quote.count({ where: { tenantId: session.tenantId } }),
  ]);

  const filteredCreditNotes = searchFilter
    ? creditNotes.filter(
        (cn) =>
          cn.creditNoteNumber?.toLowerCase().includes(searchFilter) ||
          cn.client.name.toLowerCase().includes(searchFilter) ||
          cn.originalInvoice.invoiceNumber?.toLowerCase().includes(searchFilter)
      )
    : creditNotes;

  // Metrics
  const totalCount = creditNotes.length;
  const totalCreditedDzd = creditNotes.reduce((acc, cn) => acc + cn.total, 0);
  const refundedList = creditNotes.filter((cn) => cn.refundStatus === "REFUNDED");
  const refundedDzd = refundedList.reduce((acc, cn) => acc + cn.total, 0);
  const pendingCount = creditNotes.filter((cn) => cn.refundStatus === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation tabs between Factures, Devis, and Avoirs */}
        <InvoicingTabs
          counts={{
            invoices: invoicesCount,
            quotes: quotesCount,
            creditNotes: totalCount,
          }}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Factures d'Avoir (Notes de Crédit)
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rectification comptable officielle • Déduction du chiffre d'affaires et de l'IFU
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Un avoir se génère depuis une facture émise sur l'onglet Factures.</span>
          </div>
        </div>

        {/* Legal Regulatory Compliance Card */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-rose-950 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-rose-900">Règle comptable sous le régime de l'IFU (Loi 22-23) :</h4>
            <p className="text-rose-800 leading-relaxed">
              Une facture officielle émise est immuable. Lorsqu'une prestation est annulée ou remboursée, l'émission d'un avoir numéroté (AVR-YYYY-XXXX) certifie la restitution des fonds et permet de déduire ce montant du chiffre d'affaires imposable afin de ne pas payer d'impôt indu.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Avoirs Émis</span>
              <RotateCcw className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Numérotation séquentielle AVR</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Crédit Annulé</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-700">- {formatDZD(totalCreditedDzd)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Montant brut rectifié</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Avoirs Remboursés / Déduits</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">{formatDZD(refundedDzd)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{refundedList.length} avoirs compensés</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">En attente de compensation</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">En attente de virement/remboursement</p>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "Tous", count: creditNotes.length },
              { id: "PENDING", label: "En attente", count: creditNotes.filter((cn) => cn.refundStatus === "PENDING").length },
              { id: "REFUNDED", label: "Remboursés / Déduits", count: creditNotes.filter((cn) => cn.refundStatus === "REFUNDED").length },
            ].map((tab) => {
              const active =
                (!statusFilter && tab.id === "ALL") || statusFilter === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.id === "ALL" ? "/credit-notes" : `/credit-notes?status=${tab.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
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
                </Link>
              );
            })}
          </div>

          <form method="GET" className="relative min-w-[240px]">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={resolvedParams?.search || ""}
              placeholder="Rechercher par N° avoir, facture..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </form>
        </div>

        {/* Credit Notes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredCreditNotes.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Aucun avoir émis</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pour créer un avoir, ouvrez une facture émise depuis la liste des factures et cliquez sur "Créer un Avoir".
              </p>
              <Link
                href="/invoices"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                <span>Accéder aux Factures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">N° Avoir</th>
                    <th className="py-3 px-4">Facture d'Origine</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Motif</th>
                    <th className="py-3 px-4 text-right">Montant Crédité</th>
                    <th className="py-3 px-4 text-center">Remboursement</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCreditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          href={`/credit-notes/${cn.id}`}
                          className="hover:text-rose-600 transition flex items-center gap-1.5"
                        >
                          <span>{cn.creditNoteNumber || "BROUILLON"}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <Link
                          href={`/invoices/${cn.originalInvoice.id}`}
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 underline font-semibold"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{cn.originalInvoice.invoiceNumber || "Facture"}</span>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{cn.client.name}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(cn.issueDate).toLocaleDateString("fr-DZ")}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={cn.reason}>
                        {cn.reason}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 font-mono">
                        - {formatDZD(cn.total)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {cn.refundStatus === "REFUNDED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Remboursé / Déduit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            En attente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/credit-notes/${cn.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Télécharger PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <Link
                            href={`/credit-notes/${cn.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition shadow-2xs"
                          >
                            <span>Détails</span>
                            <ArrowRight className="w-3 h-3" />
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
      </main>
    </div>
  );
}
