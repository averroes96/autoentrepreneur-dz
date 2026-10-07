import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import QuoteForm from "@/components/quotes/QuoteForm";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant || !tenant.profile) notFound();

  const quote = await db.quote.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      lineItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!quote) notFound();

  // Only DRAFT quotes can be edited
  if (quote.status !== "DRAFT") {
    redirect(`/quotes/${quote.id}`);
  }

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
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 pb-1">
          <Link
            href={`/quotes/${quote.id}`}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 transition"
            title="Retour au devis"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Modifier le Devis (Mode Brouillon)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajustez vos prestations, quantités et conditions avant émission définitive.
            </p>
          </div>
        </div>

        <QuoteForm
          clients={clients}
          defaultCurrency={quote.currency}
          vatExemptionNote={quote.vatExemptionNote}
          existingQuote={quote}
        />
      </main>
    </div>
  );
}
