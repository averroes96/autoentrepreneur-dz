import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewInvoicePage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const clients = await db.client.findMany({
    where: {
      tenantId: session.tenantId,
      isArchived: false,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nouvelle Facture</h1>
            <p className="text-sm text-slate-500">
              Préparez un projet de facture (Brouillon). Le numéro séquentiel définitif sera attribué lors de l'émission.
            </p>
          </div>
        </div>

        <InvoiceForm
          clients={clients}
          defaultCurrency={tenant.profile.defaultCurrency}
          vatExemptionNote={tenant.profile.vatExemptionNote}
        />
      </main>
    </div>
  );
}
