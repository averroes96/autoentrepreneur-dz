import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { ExpenseListClient } from "@/components/expenses/ExpenseListClient";
import { getExpensesSummary, ExpenseData } from "@/lib/expenses";

export const dynamic = "force-dynamic";

interface ExpensesPageProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    return <div>Configuration requise...</div>;
  }

  const currentYear = new Date().getFullYear();
  const resolvedParams = searchParams ? await searchParams : undefined;

  // Discover all distinct fiscal years for this tenant from expenses and invoices
  const [expenseYears, invoiceYears] = await Promise.all([
    db.expense.findMany({
      where: { tenantId: session.tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
    db.invoice.findMany({
      where: { tenantId: session.tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
  ]);

  const availableYears = Array.from(
    new Set([
      currentYear,
      ...expenseYears.map((e) => e.fiscalYear),
      ...invoiceYears.map((i) => i.fiscalYear),
    ])
  ).sort((a, b) => b - a);

  const requestedYear = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const activeYear = requestedYear && !isNaN(requestedYear) ? requestedYear : currentYear;

  const [rawExpenses, summary] = await Promise.all([
    db.expense.findMany({
      where: {
        tenantId: session.tenantId,
        fiscalYear: activeYear,
      },
      orderBy: { date: "desc" },
    }),
    getExpensesSummary(session.tenantId, activeYear),
  ]);

  const expenses: ExpenseData[] = rawExpenses.map((e) => ({
    ...e,
    category: e.category as any,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={{ fullName: session.fullName, email: session.email }}
        tenantName={tenant.name}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseListClient
          initialExpenses={expenses}
          initialSummary={summary}
          availableYears={availableYears}
          selectedYear={activeYear}
        />
      </main>
    </div>
  );
}
