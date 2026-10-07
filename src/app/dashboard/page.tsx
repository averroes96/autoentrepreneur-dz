import React from "react";
import Link from "next/link";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import {
  calculateCeilingStatus,
  calculateIfu,
  evaluateThreeYearRule,
  formatDZD,
} from "@/lib/tax";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import Navbar from "@/components/layout/Navbar";
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Users,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
  ArrowRight,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profile";

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

  // Fetch count of active quotes
  const quotesCount = await db.quote.count({
    where: {
      tenantId: session.tenantId,
      fiscalYear: activeYear,
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

  // Profile completion status
  const profileCompletion = calculateProfileCompletion(tenant.profile);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Completion Progress Card (shown when profile is not 100% complete) */}
        {!profileCompletion.isFullyComplete && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-500/20 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-semibold">
                    Configuration du profil
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {profileCompletion.percentage}% complété
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  Complétez vos informations réglementaires
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Renseignez votre code d'activité ANAE, le libellé de votre métier et votre adresse pour que vos factures comportent l'ensemble des mentions légales obligatoires (Loi 22-23).
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-lg bg-white/10 rounded-full h-2.5 overflow-hidden mt-3">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>

                {/* Missing items pills */}
                {profileCompletion.missingItems.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-300">
                    <span className="text-slate-400 font-medium">À renseigner :</span>
                    {profileCompletion.missingItems.map((m) => (
                      <span
                        key={m.key}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 text-[10px] font-medium"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
              >
                <span>Finaliser mon profil</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Welcome & Quick Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Exercice Fiscal {activeYear}
              </span>
              {availableYears.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {availableYears.map((yr) => (
                    <Link
                      key={yr}
                      href={`/dashboard?year=${yr}`}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold transition ${
                        yr === activeYear
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                      }`}
                    >
                      {yr}
                    </Link>
                  ))}
                </div>
              )}
              <span className="text-xs text-slate-500">
                N° RNAE : {tenant.profile.rnaeNumber || "À renseigner"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bonjour, {tenant.profile.fullName || session.fullName}
            </h1>
            <p className="text-sm text-slate-500">
              Suivi de votre chiffre d'affaires et conformité fiscale auto-entrepreneur (Loi 22-23).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Créer une facture</span>
            </Link>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
              <span>Nouveau devis</span>
            </Link>
            <Link
              href="/credit-notes"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Avoirs</span>
            </Link>
            <Link
              href="/clients"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Clients</span>
            </Link>
          </div>
        </div>

        {/* Top 3 Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Chiffre d'Affaires Encaissé & Plafond */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Chiffre d'Affaires Encaissé
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${ceiling.badgeColor}`}
                >
                  {ceiling.statusLabel}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatDZD(totalPaidDzd)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Plafond légal annuel : {formatDZD(ceiling.ceilingLimitDzd)}
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600">Progression du plafond</span>
                <span className="text-slate-900 font-bold">{ceiling.percentage}%</span>
              </div>
              {/* Progress bar with warning states */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ceiling.status === "EXCEEDED" || ceiling.status === "CRITICAL"
                      ? "bg-rose-500"
                      : ceiling.status === "WARNING"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(ceiling.percentage, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-right">
                Reste disponible : {formatDZD(ceiling.remainingDzd)}
              </p>
            </div>
          </div>

          {/* Card 2: Live IFU Estimate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Estimation IFU (0.5%)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Taux libératoire
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatDZD(ifu.taxOwedDzd)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculé à {REGULATORY_CONFIG.ifu.rate * 100}% du CA encaissé
              </p>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Montant brut calculé :</span>
                <span className="font-semibold text-slate-900">{formatDZD(ifu.rawTaxDzd)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Minimum légal annuel :</span>
                <span className="font-semibold text-slate-900">
                  {formatDZD(ifu.minimumTaxDzd)}
                </span>
              </div>
              {ifu.isMinimumApplied && (
                <p className="text-[11px] text-amber-700 font-medium pt-1 border-t border-slate-200">
                  ℹ Le plancher légal de {formatDZD(ifu.minimumTaxDzd)} s'applique pour cette année.
                </p>
              )}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Déclaration annuelle due avant le{" "}
                <strong className="text-slate-600">
                  {REGULATORY_CONFIG.ifu.annualDeclarationDeadline.day} Janvier {activeYear + 1}
                </strong>
              </span>
            </div>
          </div>

          {/* Card 3: Invoicing Totals & Compliance Trackers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Activité de Facturation {activeYear}
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600">Total Facturé (Émis)</span>
                  <span className="text-sm font-bold text-slate-900">{formatDZD(totalBilledDzd)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600">En attente d'encaissement</span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatDZD(pendingPaymentDzd)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-600">Nombre de factures</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {issuedInvoices.length} émises / {draftInvoices.length} brouillons
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>CASNOS Forfaitaire :</span>
              </span>
              <span className="font-semibold text-slate-900">
                {formatDZD(REGULATORY_CONFIG.casnos.defaultAnnualContributionDzd)}/an
              </span>
            </div>
          </div>
        </div>

        {/* 3-Year Consecutive Years Compliance Alert / Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Règle Réglementaire des 3 Années Consécutives (Loi 22-23)
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-3xl">
                Selon l'article 2.1 du statut, déclarer un chiffre d'affaires nul/quasi-nul, ou dépasser le
                plafond de 5 000 000 DZD pendant <strong>3 années consécutives</strong> entraîne la radiation
                de l'ANAE ou le passage forcé en société (EURL/SARL).
              </p>
            </div>
            <Link
              href="/profile"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 shrink-0"
            >
              Gérer l'historique →
            </Link>
          </div>

          {threeYearRule.isAtRisk ? (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{threeYearRule.riskMessage}</span>
            </div>
          ) : (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Situation réglementaire normale : Aucun risque de radiation ou de dépassement consécutif détecté.
              </span>
            </div>
          )}

          {/* History Pills */}
          <div className="mt-4 flex flex-wrap gap-3">
            {threeYearRule.history.map((h) => (
              <div
                key={h.year}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
              >
                <span className="font-semibold text-slate-700">{h.year} :</span>
                <span className="font-bold text-slate-900">{formatDZD(h.turnoverDzd)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                    h.status === "EXCEEDED"
                      ? "bg-rose-100 text-rose-700"
                      : h.status === "NEAR_ZERO"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {h.status === "EXCEEDED"
                    ? "Dépassement"
                    : h.status === "NEAR_ZERO"
                    ? "Quasi-nul"
                    : "Conforme"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Factures Récentes</h2>
              <p className="text-xs text-slate-500">
                Dernières factures émises et brouillons en cours
              </p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1"
            >
              <span>Voir toutes les factures</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">Aucune facture émise pour le moment</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Créez votre première facture conforme au régime de l'auto-entrepreneur.
              </p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Créer une facture</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Numéro</th>
                    <th className="py-3 px-6">Client</th>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6 text-right">Montant Total</th>
                    <th className="py-3 px-6">Statut Facture</th>
                    <th className="py-3 px-6">Paiement</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {inv.invoiceNumber || (
                          <span className="text-slate-400 font-normal italic">Brouillon</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {inv.client.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {new Date(inv.issueDate).toLocaleDateString("fr-DZ")}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900">
                        {formatDZD(inv.total)}
                      </td>
                      <td className="py-4 px-6">
                        {inv.status === "ISSUED" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Émise (Immuable)
                          </span>
                        ) : inv.status === "DRAFT" ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Brouillon
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            Annulée
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {inv.status === "ISSUED" ? (
                          inv.paymentStatus === "PAID" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Payée
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              En attente
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-semibold text-emerald-600 hover:text-emerald-500 text-xs"
                        >
                          Détails →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
