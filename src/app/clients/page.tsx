import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { ClientListClient } from "@/components/clients/ClientListClient";

export default async function ClientsPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant) return <div>Non autorisé</div>;

  const clients = await db.client.findMany({
    where: { tenantId: session.tenantId },
    include: {
      invoices: {
        select: { id: true, total: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ClientListClient initialClients={clients} />
      </main>
    </div>
  );
}
