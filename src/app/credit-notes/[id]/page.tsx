import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { formatDZD } from "@/lib/tax";
import {
  ArrowLeft,
  Building,
  User,
  RotateCcw,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { CreditNoteDetailControls } from "@/components/credit-notes/CreditNoteDetailControls";

export const dynamic = "force-dynamic";

export default async function CreditNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const creditNote = await db.creditNote.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      client: true,
      originalInvoice: true,
      lineItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!creditNote) notFound();

  // Parse frozen snapshots
  const sellerData = creditNote.sellerSnapshot
    ? JSON.parse(creditNote.sellerSnapshot)
    : tenant.profile;

  const clientData = creditNote.clientSnapshot
    ? JSON.parse(creditNote.clientSnapshot)
    : creditNote.client;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Controls Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <Link
              href="/credit-notes"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
              title="Retour aux avoirs"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {creditNote.creditNoteNumber || "Avoir Brouillon"}
                </h1>

                {/* Status Pill */}
                {creditNote.refundStatus === "REFUNDED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Remboursé / Déduit du C.A
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    En attente de compensation
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Client : <strong className="text-slate-700">{creditNote.client.name}</strong> • Date :{" "}
                {new Date(creditNote.issueDate).toLocaleDateString("fr-DZ")} • Réf :{" "}
                <strong className="text-slate-700">{creditNote.originalInvoice.invoiceNumber || "Facture"}</strong>
              </p>
            </div>
          </div>

          <CreditNoteDetailControls creditNote={creditNote} />
        </div>

        {/* Original Invoice & Legal Notice Banner */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <p>
                <strong>Facture d'origine rectifiée : </strong>
                <span className="font-mono font-bold text-rose-950">
                  {creditNote.originalInvoice.invoiceNumber || "Facture"}
                </span>
                {" "}• Motif légal : <em>« {creditNote.reason} »</em>
              </p>
            </div>
          </div>
          <Link
            href={`/invoices/${creditNote.originalInvoice.id}`}
            className="inline-flex items-center gap-1 font-bold text-rose-800 hover:text-rose-950 underline shrink-0"
          >
            Consulter la facture &rarr;
          </Link>
        </div>

        {/* Credit Note Paper Card */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
            <div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">FACTURE D'AVOIR</span>
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mt-1">
                Note de Crédit Comptable — Algérie (Loi 22-23 / Régime IFU)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400 font-medium">N° d'avoir : </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {creditNote.creditNoteNumber || "BROUILLON"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Facture d'origine : </span>
                <span className="font-bold text-slate-900 font-mono">
                  {creditNote.originalInvoice.invoiceNumber || "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date d'émission : </span>
                <span className="font-semibold text-slate-700">
                  {new Date(creditNote.issueDate).toLocaleDateString("fr-DZ")}
                </span>
              </div>
            </div>
          </div>

          {/* Seller & Client Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            {/* Émetteur */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <User className="w-3.5 h-3.5" />
                <span>Émetteur (Auto-Entrepreneur)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{sellerData.fullName}</h3>
              <div className="space-y-1 text-slate-600">
                <p>
                  RNAE N° : <strong className="text-slate-800">{sellerData.rnaeNumber || "—"}</strong>
                </p>
                <p>
                  NIF : <strong className="text-slate-800">{sellerData.nif || "—"}</strong>
                </p>
                <p>
                  Activité : {sellerData.activityLabel} ({sellerData.activityCode})
                </p>
                {sellerData.address && <p>Adresse : {sellerData.address}</p>}
                <p>
                  Contact : {sellerData.email} {sellerData.phone ? `• ${sellerData.phone}` : ""}
                </p>
              </div>
            </div>

            {/* Bénéficiaire */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <Building className="w-3.5 h-3.5" />
                <span>Bénéficiaire (Client)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{clientData.name}</h3>
              <div className="space-y-1 text-slate-600">
                <p>
                  Type : {clientData.clientType === "PROFESSIONAL" ? "Société / Professionnel" : "Particulier"}
                </p>
                {clientData.nif && (
                  <p>
                    NIF : <strong className="text-slate-800">{clientData.nif}</strong>
                    {clientData.nis && ` • NIS : ${clientData.nis}`}
                    {clientData.rc && ` • RC : ${clientData.rc}`}
                  </p>
                )}
                {clientData.address && <p>Adresse : {clientData.address}</p>}
                {(clientData.email || clientData.phone) && (
                  <p>
                    {clientData.email} {clientData.phone ? `• ${clientData.phone}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="pb-3 w-1/2">Lignes de prestations créditées / annulées</th>
                  <th className="pb-3 text-center w-20">Qté</th>
                  <th className="pb-3 text-right w-32">P.U (DZD)</th>
                  <th className="pb-3 text-right w-36">Crédit (DZD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNote.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3.5 pr-4 text-slate-800 font-medium whitespace-pre-wrap">
                      {item.description}
                    </td>
                    <td className="py-3.5 text-center text-slate-500 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 text-right text-slate-500 font-medium">
                      {formatDZD(item.unitPrice)}
                    </td>
                    <td className="py-3.5 text-right font-bold text-rose-600 font-mono">
                      - {formatDZD(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row items-end justify-between pt-4 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-400 italic max-w-sm">
              Arrêté la présente facture d'avoir à la somme créditrice de :{" "}
              <strong className="text-rose-600 not-italic">- {formatDZD(creditNote.total)}</strong>.
            </div>

            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Prestations Créditées :</span>
                <span className="font-semibold text-rose-600 font-mono">- {formatDZD(creditNote.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>TVA (Régime IFU) :</span>
                <span className="font-semibold text-emerald-600">Exonéré (0%)</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-3 border-t-2 border-slate-900">
                <span>TOTAL CRÉDIT NET :</span>
                <span className="text-lg text-rose-600 font-mono">- {formatDZD(creditNote.total)}</span>
              </div>
            </div>
          </div>

          {/* Mandatory Statutory Note */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold text-[10px] tracking-wider uppercase text-emerald-800">
              Mention légale d'exonération de TVA (Loi n° 22-23 / Régime IFU) :
            </p>
            <p className="italic text-emerald-950">{creditNote.vatExemptionNote}</p>
          </div>

          {/* Notes */}
          {creditNote.notes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                Remarques & Modalités de remboursement :
              </p>
              <p className="text-slate-700 whitespace-pre-wrap">{creditNote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>
              Facture d'avoir émise conformément aux règles comptables et fiscales de la Loi n° 22-23 du 18 décembre 2022.
            </p>
            <p>
              Titulaire immatriculé au RNAE (N° {sellerData.rnaeNumber || "—"}) — NIF : {sellerData.nif || "—"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
