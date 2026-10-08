import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { getAnnualTaxSummary } from "@/lib/taxSummary";
import { getStatutoryDeadlines } from "@/lib/statutoryCalendar";
import { TaxSummaryView } from "@/components/tax/TaxSummaryView";

export const dynamic = "force-dynamic";

interface TaxSummaryPageProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function TaxSummaryPage({ searchParams }: TaxSummaryPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    return <div>Configuration requise...</div>;
  }

  const currentYear = new Date().getFullYear();
  const resolvedParams = searchParams ? await searchParams : undefined;

  // Discover all distinct fiscal years for this tenant from invoices
  const distinctYears = await db.invoice.findMany({
    where: { tenantId: session.tenantId },
    select: { fiscalYear: true },
    distinct: ["fiscalYear"],
  });

  const availableYears = Array.from(
    new Set([currentYear, ...distinctYears.map((i) => i.fiscalYear)])
  ).sort((a, b) => b - a);

  const requestedYear = resolvedParams?.year ? parseInt(resolvedParams.year, 10) : undefined;
  const activeYear = requestedYear && !isNaN(requestedYear) ? requestedYear : currentYear;

  // Fetch certified annual summary & statutory deadlines
  const summary = await getAnnualTaxSummary(session.tenantId, activeYear);
  const deadlines = getStatutoryDeadlines(activeYear, tenant.profile);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <TaxSummaryView
          activeYear={activeYear}
          availableYears={availableYears}
          summary={summary}
          deadlines={deadlines}
          profile={tenant.profile}
        />
      </main>
    </div>
  );
}
