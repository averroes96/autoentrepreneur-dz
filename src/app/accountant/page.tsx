import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { listAccountantAccesses } from "@/lib/accountantAccess";
import { AccountantManagementClient } from "@/components/accountant/AccountantManagementClient";

export const dynamic = "force-dynamic";

export default async function AccountantPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    return <div>Configuration requise...</div>;
  }

  const currentYear = new Date().getFullYear();

  // Distinct fiscal years available
  const [invoiceYears, expenseYears] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: session.tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
    db.expense.findMany({
      where: { tenantId: session.tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
  ]);

  const availableYears = Array.from(
    new Set([
      currentYear,
      ...invoiceYears.map((i) => i.fiscalYear),
      ...expenseYears.map((e) => e.fiscalYear),
    ])
  ).sort((a, b) => b - a);

  const accesses = await listAccountantAccesses(session.tenantId);

  // Serialize accesses for client component (Date -> ISO string)
  const serializedAccesses = accesses.map((acc) => ({
    id: acc.id,
    token: acc.token,
    name: acc.name,
    email: acc.email,
    fiscalYear: acc.fiscalYear,
    hasPin: !!acc.pinHash,
    expiresAt: acc.expiresAt ? acc.expiresAt.toISOString() : null,
    isRevoked: acc.isRevoked,
    lastAccessedAt: acc.lastAccessedAt ? acc.lastAccessedAt.toISOString() : null,
    accessCount: acc.accessCount,
    notes: acc.notes,
    createdAt: acc.createdAt.toISOString(),
  }));

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
        <AccountantManagementClient
          initialAccesses={serializedAccesses}
          availableYears={availableYears}
          currentYear={currentYear}
          tenantName={tenant.name}
        />
      </main>
    </div>
  );
}
