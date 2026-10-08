import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { InvoiceDetailHeader } from "@/components/invoices/InvoiceDetailHeader";
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
        {/* Localized Header & Notice Banners */}
        <InvoiceDetailHeader invoice={invoice} />

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
