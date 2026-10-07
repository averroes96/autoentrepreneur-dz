import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { formatDZD } from "@/lib/tax";
import {
  ArrowLeft,
  Download,
  Building,
  User,
  ShieldCheck,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { InvoiceDetailControls } from "@/components/invoices/InvoiceDetailControls";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const invoice = await db.invoice.findFirst({
    where: {
      id,
      tenantId: session.tenantId, // Strict tenant isolation
    },
    include: {
      client: true,
      lineItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!invoice) notFound();

  // Parse frozen snapshots if issued
  const sellerData = invoice.sellerSnapshot
    ? JSON.parse(invoice.sellerSnapshot)
    : tenant.profile;

  const clientData = invoice.clientSnapshot
    ? JSON.parse(invoice.clientSnapshot)
    : invoice.client;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Controls Top Bar */}
        {/* Header with Title and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition shrink-0"
              title="Retour aux factures"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {invoice.invoiceNumber || "Facture Brouillon"}
                </h1>

                {/* Single Refined Status Pill */}
                {invoice.status === "DRAFT" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Brouillon
                  </span>
                ) : invoice.status === "CANCELLED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Annulée
                  </span>
                ) : invoice.paymentStatus === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Payée • Encaissée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    En attente de paiement
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Client : <strong className="text-slate-700">{invoice.client.name}</strong> • Date :{" "}
                {new Date(invoice.issueDate).toLocaleDateString("fr-DZ")}
              </p>
            </div>
          </div>

          <InvoiceDetailControls invoice={invoice} />
        </div>

        {/* Compact Notice Banners (without redundant action buttons) */}
        {invoice.status === "DRAFT" && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              <strong className="font-semibold">Projet de facture en mode Brouillon :</strong>{" "}
              Modifiable librement. Le numéro séquentiel officiel sera attribué lors de l'émission.
            </p>
          </div>
        )}

        {invoice.status === "ISSUED" && (
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>
              <strong className="font-semibold text-slate-800">Facture officielle validée (Immuable) :</strong>{" "}
              Scellée conformément à la Loi 22-23. Pour toute modification comptable, utilisez l'annulation.
            </p>
          </div>
        )}

        {invoice.status === "CANCELLED" && (
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs flex items-center gap-2.5">
            <Ban className="w-4 h-4 text-rose-600 shrink-0" />
            <p>
              <strong className="font-semibold">Facture Annulée :</strong>{" "}
              Motif : <em>{invoice.cancellationReason || "Non précisé"}</em>. Le numéro séquentiel reste réservé dans l'historique légal.
            </p>
          </div>
        )}

        {/* Invoice Paper Card (WYSIWYG layout conforming to Section 2.5) */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
            <div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">FACTURE</span>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">
                Régime de l'Auto-Entrepreneur — Algérie (Loi 22-23)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400 font-medium">N° de facture : </span>
                <span className="font-bold text-slate-900 text-sm">
                  {invoice.invoiceNumber || "BROUILLON"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date d'émission : </span>
                <span className="font-semibold text-slate-900">
                  {new Date(invoice.issueDate).toLocaleDateString("fr-DZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {invoice.issuedAt && (
                <div>
                  <span className="text-slate-400 font-medium">Horodatage officiel : </span>
                  <span className="text-slate-600">
                    {new Date(invoice.issuedAt).toLocaleTimeString("fr-DZ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller and Client Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Auto-entrepreneur (Seller) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Émetteur (Auto-Entrepreneur)
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {sellerData.fullName || "Auto-Entrepreneur"}
              </h2>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-700">N° RNAE :</strong> {sellerData.rnaeNumber || "—"}
                </p>
                <p>
                  <strong className="text-slate-700">NIF :</strong> {sellerData.nif || "—"}
                </p>
                <p>
                  <strong className="text-slate-700">Activité :</strong>{" "}
                  {sellerData.activityCode ? `[${sellerData.activityCode}] ` : ""}
                  {sellerData.activityLabel || "Prestations de services informatiques"}
                </p>
                <p>
                  <strong className="text-slate-700">Adresse :</strong> {sellerData.address || "—"}
                </p>
                {sellerData.phone && (
                  <p>
                    <strong className="text-slate-700">Tél :</strong> {sellerData.phone}
                  </p>
                )}
                {sellerData.email && (
                  <p>
                    <strong className="text-slate-700">Email :</strong> {sellerData.email}
                  </p>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Client (Destinataire)
              </span>
              <h2 className="text-base font-bold text-slate-900">{clientData.name}</h2>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-700">Type :</strong>{" "}
                  {clientData.clientType === "PROFESSIONAL"
                    ? "Professionnel / Entreprise"
                    : "Particulier"}
                </p>
                <p>
                  <strong className="text-slate-700">Adresse :</strong> {clientData.address || "—"}
                </p>
                {clientData.nif && (
                  <p>
                    <strong className="text-slate-700">NIF :</strong> {clientData.nif}
                  </p>
                )}
                {clientData.nis && (
                  <p>
                    <strong className="text-slate-700">NIS :</strong> {clientData.nis}
                  </p>
                )}
                {clientData.rc && (
                  <p>
                    <strong className="text-slate-700">RC :</strong> {clientData.rc}
                  </p>
                )}
                {clientData.email && (
                  <p>
                    <strong className="text-slate-700">Email :</strong> {clientData.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                {invoice.showDetailedItems ? (
                  <tr>
                    <th className="py-3 px-5">Désignation des prestations</th>
                    <th className="py-3 px-5 text-right">Quantité</th>
                    <th className="py-3 px-5 text-right">Prix Unitaire</th>
                    <th className="py-3 px-5 text-right">Montant Total</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3.5 px-6">Désignation de la prestation / tâche</th>
                    <th className="py-3.5 px-6 text-right">Montant</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    {invoice.showDetailedItems ? (
                      <>
                        <td className="py-3.5 px-5 font-medium text-slate-900">{item.description}</td>
                        <td className="py-3.5 px-5 text-right">{item.quantity}</td>
                        <td className="py-3.5 px-5 text-right">{formatDZD(item.unitPrice)}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-900">
                          {formatDZD(item.totalPrice)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 font-medium text-slate-900 text-sm">
                          {item.description}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm">
                          {formatDZD(item.totalPrice)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section (STRICTLY NO VAT, NO HT/TTC SPLIT) */}
          <div className="flex flex-col items-end">
            <div className="w-full sm:w-80 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Total des services :</span>
                <span className="font-semibold text-slate-800">{formatDZD(invoice.total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Taux de TVA :</span>
                <span className="font-semibold text-emerald-700">0% (Non applicable)</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Total Net à Payer :
                </span>
                <span className="text-lg font-extrabold text-emerald-700">
                  {formatDZD(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory VAT Exemption Note */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border-l-4 border-emerald-600 text-xs text-emerald-950 space-y-1">
            <span className="font-bold block text-emerald-900 uppercase tracking-wider text-[11px]">
              Mention légale d'exonération de TVA :
            </span>
            <p className="italic text-emerald-800">« {invoice.vatExemptionNote} »</p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
                Modalités de règlement & Remarques :
              </span>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Legal Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-0.5">
            <p>
              Facture établie conformément à la législation algérienne régissant le statut de l'auto-entrepreneur (Loi n° 22-23).
            </p>
            <p>
              Titulaire inscrit au Registre National de l'Auto-Entrepreneur sous le N° {sellerData.rnaeNumber || "—"}.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
