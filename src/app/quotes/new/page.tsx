import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import QuoteForm from "@/components/quotes/QuoteForm";
import { NewQuoteHeader } from "@/components/quotes/NewQuoteHeader";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) notFound();

  const clients = await db.client.findMany({
    where: {
      tenantId: session.tenantId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      clientType: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <NewQuoteHeader />

        <QuoteForm
          clients={clients}
          defaultCurrency={tenant.profile.defaultCurrency || "DZD"}
          vatExemptionNote={tenant.profile.vatExemptionNote}
        />
      </main>
    </div>
  );
}
