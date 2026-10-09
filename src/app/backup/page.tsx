import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { VaultBackupClient } from "@/components/backup/VaultBackupClient";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    return <div>Configuration requise...</div>;
  }

  // Count current tenant records
  const [
    invoicesCount,
    clientsCount,
    quotesCount,
    creditNotesCount,
    expensesCount,
  ] = await Promise.all([
    db.invoice.count({ where: { tenantId: session.tenantId } }),
    db.client.count({ where: { tenantId: session.tenantId } }),
    db.quote.count({ where: { tenantId: session.tenantId } }),
    db.creditNote.count({ where: { tenantId: session.tenantId } }),
    db.expense.count({ where: { tenantId: session.tenantId } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={{
          fullName: tenant.profile.fullName,
          email: session.email,
        }}
        tenantName={tenant.name}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VaultBackupClient
          tenantName={tenant.profile.fullName || tenant.name}
          currentStats={{
            invoicesCount,
            clientsCount,
            quotesCount,
            creditNotesCount,
            expensesCount,
          }}
        />
      </main>
    </div>
  );
}
