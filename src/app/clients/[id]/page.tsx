import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { getClientLedger } from "@/lib/clientLedger";
import { ClientLedgerView } from "@/components/clients/ClientLedgerView";

export const dynamic = "force-dynamic";

interface ClientLedgerPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientLedgerPage({ params }: ClientLedgerPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant) return <div>Non autorisé</div>;

  try {
    const ledger = await getClientLedger(session.tenantId, id);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={session} tenantName={tenant.name} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ClientLedgerView ledger={ledger} />
        </main>
      </div>
    );
  } catch (err: any) {
    console.error("Client introuvable ou erreur relevé :", err);
    notFound();
  }
}
