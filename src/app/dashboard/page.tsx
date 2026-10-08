import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import {
  calculateCeilingStatus,
  calculateIfu,
  evaluateThreeYearRule,
} from "@/lib/tax";
import Navbar from "@/components/layout/Navbar";
import { calculateProfileCompletion } from "@/lib/profile";
import { getStatutoryDeadlines } from "@/lib/statutoryCalendar";
import { DashboardView } from "@/components/dashboard/DashboardView";

interface DashboardProps {
  searchParams?: Promise<{ year?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
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

  // Fetch invoices for the active fiscal year (used for ceiling, IFU tax, and annual billing totals)
  const invoices = await db.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      fiscalYear: activeYear,
    },
    include: {
      client: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch recent invoices (latest across ALL fiscal years so new invoices appear immediately)
  const recentInvoices = await db.invoice.findMany({
    where: {
      tenantId: session.tenantId,
    },
    include: {
      client: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Fetch past recorded turnovers for 3-year rule
  const pastTurnovers = await db.pastTurnover.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { fiscalYear: "desc" },
  });

  // Fetch credit notes for the active fiscal year
  const creditNotes = await db.creditNote.findMany({
    where: {
      tenantId: session.tenantId,
      fiscalYear: activeYear,
      status: "ISSUED",
    },
  });

  // Calculate metrics for the active fiscal year
  const issuedInvoices = invoices.filter((i) => i.status === "ISSUED");
  const paidInvoices = issuedInvoices.filter((i) => i.paymentStatus === "PAID");
  const draftInvoices = invoices.filter((i) => i.status === "DRAFT");

  const refundedCreditNotes = creditNotes.filter((cn) => cn.refundStatus === "REFUNDED");
  const totalRefundedCreditDzd = refundedCreditNotes.reduce((acc, cn) => acc + cn.total, 0);

  const totalBilledDzd = issuedInvoices.reduce((acc, i) => acc + i.total, 0);
  const rawTotalPaidDzd = paidInvoices.reduce((acc, i) => acc + i.total, 0);

  // Net collected turnover deducting refunded credit notes
  const totalPaidDzd = Math.max(0, rawTotalPaidDzd - totalRefundedCreditDzd);
  const pendingPaymentDzd = Math.max(0, totalBilledDzd - rawTotalPaidDzd);

  // Legal turnover & tax calculations (based on net collected turnover as required by IFU regime)
  const ceiling = calculateCeilingStatus(totalPaidDzd);
  const ifu = calculateIfu(totalPaidDzd);
  const threeYearRule = evaluateThreeYearRule(activeYear, totalPaidDzd, pastTurnovers);

  // Statutory obligations deadlines for active fiscal year
  const deadlines = getStatutoryDeadlines(activeYear, tenant.profile);
  const ifuDeadline = deadlines.find((d) => d.id === "ifu-declaration");

  // Profile completion status
  const profileCompletion = calculateProfileCompletion(tenant.profile);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardView
          session={session}
          tenant={tenant}
          activeYear={activeYear}
          availableYears={availableYears}
          profileCompletion={profileCompletion}
          totalPaidDzd={totalPaidDzd}
          pendingPaymentDzd={pendingPaymentDzd}
          totalBilledDzd={totalBilledDzd}
          ceiling={ceiling}
          ifu={ifu}
          ifuDeadline={ifuDeadline}
          issuedInvoices={issuedInvoices}
          draftInvoices={draftInvoices}
          threeYearRule={threeYearRule}
          deadlines={deadlines}
          recentInvoices={recentInvoices}
        />
      </main>
    </div>
  );
}
