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
import { BilingualCreditNotePaper } from "@/components/credit-notes/BilingualCreditNotePaper";

export const dynamic = "force-dynamic";

interface CreditNoteDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function CreditNoteDetailPage({
  params,
  searchParams,
}: CreditNoteDetailPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const defaultLanguage = resolvedParams?.lang === "ar" ? "ar" : "fr";

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

        {/* Bilingual Credit Note Paper (WYSIWYG layout conforming to JORADP & Loi 22-23) */}
        <BilingualCreditNotePaper
          creditNote={creditNote}
          seller={sellerData}
          client={clientData}
          defaultLanguage={defaultLanguage}
        />
      </main>
    </div>
  );
}
