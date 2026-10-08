import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { CreditNoteDetailHeader } from "@/components/credit-notes/CreditNoteDetailHeader";
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
        {/* Localized Header & Notice Banners */}
        <CreditNoteDetailHeader creditNote={creditNote} />

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
