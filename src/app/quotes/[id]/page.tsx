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
  Clock,
  Sparkles,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  FileCheck2,
} from "lucide-react";
import { QuoteDetailControls } from "@/components/quotes/QuoteDetailControls";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const quote = await db.quote.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      client: true,
      lineItems: {
        orderBy: { position: "asc" },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      },
    },
  });

  if (!quote) notFound();

  // Parse frozen snapshots if sent/issued
  const sellerData = quote.sellerSnapshot
    ? JSON.parse(quote.sellerSnapshot)
    : tenant.profile;

  const clientData = quote.clientSnapshot
    ? JSON.parse(quote.clientSnapshot)
    : quote.client;

  const generatedInvoice = quote.invoices?.[0];
  const isExpired =
    quote.validUntil &&
    new Date(quote.validUntil) < new Date() &&
    quote.status !== "ACCEPTED" &&
    quote.status !== "CONVERTED";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Controls Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <Link
              href="/quotes"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
              title="Retour aux devis"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {quote.quoteNumber || "Devis Brouillon"}
                </h1>

                {/* Status Pill */}
                {quote.status === "DRAFT" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Brouillon
                  </span>
                ) : quote.status === "SENT" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    Envoyé au client
                  </span>
                ) : quote.status === "ACCEPTED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Accepté par le client
                  </span>
                ) : quote.status === "CONVERTED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Facturé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Refusé
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Client : <strong className="text-slate-700">{quote.client.name}</strong> • Date :{" "}
                {new Date(quote.issueDate).toLocaleDateString("fr-DZ")}
                {quote.validUntil && (
                  <span>
                    {" "}• Validité : {new Date(quote.validUntil).toLocaleDateString("fr-DZ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <QuoteDetailControls quote={quote} />
        </div>

        {/* Informative Banners */}
        {quote.status === "DRAFT" && (
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <p>
              <strong className="font-semibold text-slate-800">Projet de devis en mode Brouillon :</strong>{" "}
              Modifiable librement. Le numéro séquentiel officiel sera attribué lors de l'émission.
            </p>
          </div>
        )}

        {quote.status === "CONVERTED" && generatedInvoice && (
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-4 h-4 text-purple-600 shrink-0" />
              <p>
                <strong>Devis transformé en facture :</strong> Ce devis a été converti en facture officielle{" "}
                <strong className="font-mono">{generatedInvoice.invoiceNumber || "en brouillon"}</strong>.
              </p>
            </div>
            <Link
              href={`/invoices/${generatedInvoice.id}`}
              className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 underline shrink-0"
            >
              Consulter la facture &rarr;
            </Link>
          </div>
        )}

        {isExpired && quote.status === "SENT" && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              <strong>Date d'échéance dépassée :</strong> La date de validité de cette offre était fixée au{" "}
              {new Date(quote.validUntil!).toLocaleDateString("fr-DZ")}.
            </p>
          </div>
        )}

        {/* Quote Paper Card (WYSIWYG layout conforming to legal requirements) */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
            <div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">DEVIS</span>
              <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mt-1">
                Régime de l'Auto-Entrepreneur — Algérie (Loi 22-23 / Proforma)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400 font-medium">N° de devis : </span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {quote.quoteNumber || "BROUILLON"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date d'émission : </span>
                <span className="font-semibold text-slate-700">
                  {new Date(quote.issueDate).toLocaleDateString("fr-DZ")}
                </span>
              </div>
              {quote.validUntil && (
                <div>
                  <span className="text-slate-400 font-medium">Valable jusqu'au : </span>
                  <span className="font-semibold text-sky-700">
                    {new Date(quote.validUntil).toLocaleDateString("fr-DZ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller & Client Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            {/* Prestataire */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <User className="w-3.5 h-3.5" />
                <span>Prestataire (Auto-Entrepreneur)</span>
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

            {/* Client Destinataire */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <Building className="w-3.5 h-3.5" />
                <span>Client Destinataire</span>
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
                  <th className="pb-3 w-1/2">Description des prestations</th>
                  <th className="pb-3 text-center w-20">Qté</th>
                  <th className="pb-3 text-right w-32">P.U (DZD)</th>
                  <th className="pb-3 text-right w-36">Total (DZD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.lineItems.map((item) => (
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
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      {formatDZD(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row items-end justify-between pt-4 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-400 italic max-w-sm">
              Arrêté le présent devis à la somme estimative de :{" "}
              <strong className="text-slate-700 not-italic">{formatDZD(quote.total)}</strong>.
            </div>

            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Prestations :</span>
                <span className="font-semibold">{formatDZD(quote.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>TVA (Régime IFU) :</span>
                <span className="font-semibold text-emerald-600">Non applicable (0%)</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-3 border-t-2 border-slate-900">
                <span>TOTAL ESTIMÉ NET :</span>
                <span className="text-lg text-sky-700">{formatDZD(quote.total)}</span>
              </div>
            </div>
          </div>

          {/* Mandatory Statutory Note */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold text-[10px] tracking-wider uppercase text-emerald-800">
              Mention légale d'exonération de TVA (Loi n° 22-23 / Régime IFU) :
            </p>
            <p className="italic text-emerald-950">{quote.vatExemptionNote}</p>
          </div>

          {/* Notes & Client Signature Stamp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              {quote.notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Conditions & Modalités particulières :
                  </p>
                  <p className="text-slate-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
            </div>

            {/* Approval Box */}
            <div className="p-5 rounded-xl border border-slate-200 text-center space-y-2 bg-slate-50/40">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Bon pour accord et commande
              </p>
              <p className="text-[11px] text-slate-400">
                Date, signature et cachet du client précédés de la mention manuscrite :
              </p>
              <p className="text-xs font-semibold italic text-slate-600 pt-1">
                « Bon pour accord et exécution des prestations »
              </p>
              <div className="h-14 border border-dashed border-slate-200 rounded-lg mt-2" />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>
              Devis commercial établi conformément à la Loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur.
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
