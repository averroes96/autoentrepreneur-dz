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
import { BilingualQuotePaper } from "@/components/quotes/BilingualQuotePaper";

export const dynamic = "force-dynamic";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: QuoteDetailPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const defaultLanguage = resolvedParams?.lang === "ar" ? "ar" : "fr";

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

        {/* Bilingual Quote Paper (WYSIWYG layout conforming to JORADP & Loi 22-23) */}
        <BilingualQuotePaper
          quote={quote}
          seller={sellerData}
          client={clientData}
          defaultLanguage={defaultLanguage}
        />
      </main>
    </div>
  );
}
