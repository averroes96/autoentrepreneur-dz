import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import InvoicingTabs from "@/components/invoicing/InvoicingTabs";
import QuotesListClient from "@/components/quotes/QuotesListClient";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const [quotes, invoicesCount, creditNotesCount] = await Promise.all([
    db.quote.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        client: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.count({ where: { tenantId: session.tenantId } }),
    db.creditNote.count({ where: { tenantId: session.tenantId } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation tabs between Factures, Devis, and Avoirs */}
        <InvoicingTabs
          counts={{
            invoices: invoicesCount,
            quotes: quotes.length,
            creditNotes: creditNotesCount,
          }}
        />

        <QuotesListClient initialQuotes={quotes as any} />
      </main>
    </div>
  );
}
