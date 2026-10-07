import React from "react";
import Link from "next/link";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { formatDZD } from "@/lib/tax";
import {
  FileText,
  PlusCircle,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Ban,
  ArrowRight,
} from "lucide-react";
import InvoicesListClient from "@/components/invoices/InvoicesListClient";
import InvoicingTabs from "@/components/invoicing/InvoicingTabs";

export default async function InvoicesPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant) return <div>Non autorisé</div>;

  const [invoices, quotesCount, creditNotesCount] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId: session.tenantId },
      include: {
        client: true,
        lineItems: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.quote.count({ where: { tenantId: session.tenantId } }),
    db.creditNote.count({ where: { tenantId: session.tenantId } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation tabs between Factures, Devis, and Avoirs */}
        <InvoicingTabs
          counts={{
            invoices: invoices.length,
            quotes: quotesCount,
            creditNotes: creditNotesCount,
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
            <p className="text-sm text-slate-500">
              Gestion de votre facturation séquentielle et conforme au régime auto-entrepreneur.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer une facture</span>
          </Link>
        </div>

        <InvoicesListClient initialInvoices={invoices} />
      </main>
    </div>
  );
}
