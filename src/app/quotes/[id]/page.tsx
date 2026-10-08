import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { QuoteDetailHeader } from "@/components/quotes/QuoteDetailHeader";
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Localized Header & Notice Banners */}
        <QuoteDetailHeader quote={quote} />

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
