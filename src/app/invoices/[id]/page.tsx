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
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import { InvoiceDetailControls } from "@/components/invoices/InvoiceDetailControls";
import { BilingualInvoicePaper } from "@/components/invoices/BilingualInvoicePaper";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: InvoiceDetailPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const defaultLanguage = resolvedParams?.lang === "ar" ? "ar" : "fr";

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
      creditNotes: true,
      sourceQuote: true,
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

        {/* Source Quote Banner */}
        {invoice.sourceQuote && (
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-900 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
              <p>
                <strong>Facture issue du devis :</strong> Cette facture a été générée à partir du devis commercial{" "}
                <strong className="font-mono">{invoice.sourceQuote.quoteNumber || "en brouillon"}</strong>.
              </p>
            </div>
            <Link
              href={`/quotes/${invoice.sourceQuote.id}`}
              className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 underline shrink-0"
            >
              Consulter le devis &rarr;
            </Link>
          </div>
        )}

        {/* Linked Credit Notes Banner */}
        {invoice.creditNotes && invoice.creditNotes.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
              <p>
                <strong>Facture rectifiée par Avoir :</strong> {invoice.creditNotes.length} facture(s) d'avoir officielle(s) rattachée(s) à ce document.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {invoice.creditNotes.map((cn) => (
                <Link
                  key={cn.id}
                  href={`/credit-notes/${cn.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{cn.creditNoteNumber || "Avoir"} ({formatDZD(cn.total)})</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bilingual Invoice Paper (WYSIWYG layout conforming to JORADP & Loi 22-23) */}
        <BilingualInvoicePaper
          invoice={invoice}
          seller={sellerData}
          client={clientData}
          defaultLanguage={defaultLanguage}
        />
      </main>
    </div>
  );
}
