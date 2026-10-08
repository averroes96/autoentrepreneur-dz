import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import InvoicingTabs from "@/components/invoicing/InvoicingTabs";
import CreditNotesListClient from "@/components/credit-notes/CreditNotesListClient";

export const dynamic = "force-dynamic";

export default async function CreditNotesPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const [creditNotes, invoicesCount, quotesCount] = await Promise.all([
    db.creditNote.findMany({
      where: {
        tenantId: session.tenantId,
      },
      include: {
        client: true,
        originalInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.count({ where: { tenantId: session.tenantId } }),
    db.quote.count({ where: { tenantId: session.tenantId } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation tabs between Factures, Devis, and Avoirs */}
        <InvoicingTabs
          counts={{
            invoices: invoicesCount,
            quotes: quotesCount,
            creditNotes: creditNotes.length,
          }}
        />

        <CreditNotesListClient initialCreditNotes={creditNotes as any} />
      </main>
    </div>
  );
}
