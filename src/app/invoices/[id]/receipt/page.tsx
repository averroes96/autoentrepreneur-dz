import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { BilingualPaymentReceiptPaper } from "@/components/receipts/BilingualPaymentReceiptPaper";
import { ArrowLeft, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function InvoiceReceiptPage({
  params,
  searchParams,
}: ReceiptPageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const defaultLanguage = resolvedSearchParams?.lang === "ar" ? "ar" : "fr";

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const invoice = await db.invoice.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      client: true,
    },
  });

  if (!invoice) notFound();

  // If invoice is not paid, show informative prompt to record payment
  if (invoice.paymentStatus !== "PAID") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={session} tenantName={tenant.name} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Quittance de paiement non disponible
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              La facture <strong className="font-mono">{invoice.invoiceNumber || "en cours"}</strong> n&apos;a pas encore été marquée comme payée. La quittance officielle est générée dès l&apos;encaissement des fonds.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href={`/invoices/${invoice.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retourner à la facture pour enregistrer le paiement</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Parse frozen snapshots if available
  const sellerData = invoice.sellerSnapshot
    ? JSON.parse(invoice.sellerSnapshot)
    : tenant.profile;

  const clientData = invoice.clientSnapshot
    ? JSON.parse(invoice.clientSnapshot)
    : invoice.client;

  const receiptNumber =
    invoice.receiptNumber ||
    (invoice.invoiceNumber
      ? invoice.invoiceNumber.replace(/^FAC-/, "REC-")
      : `REC-${invoice.fiscalYear}-${String(invoice.sequenceNumber || 1).padStart(4, "0")}`);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Receipt Paper Component */}
        <BilingualPaymentReceiptPaper
          receipt={{
            receiptNumber,
            invoiceNumber: invoice.invoiceNumber || `FAC-${invoice.id.slice(0, 6)}`,
            invoiceId: invoice.id,
            invoiceIssueDate: invoice.issueDate,
            paymentDate: invoice.paidAt || invoice.issueDate,
            paymentMethod: invoice.paymentMethod,
            paymentReference: invoice.paymentReference,
            total: invoice.total,
            currency: invoice.currency || "DZD",
            notes: invoice.notes,
          }}
          seller={{
            fullName: sellerData.fullName || tenant.profile.fullName,
            rnaeNumber: sellerData.rnaeNumber || tenant.profile.rnaeNumber,
            nif: sellerData.nif || tenant.profile.nif,
            address: sellerData.address || tenant.profile.address,
            phone: sellerData.phone || tenant.profile.phone,
            email: sellerData.email || tenant.profile.email,
            activityCode: sellerData.activityCode || tenant.profile.activityCode,
            activityLabel: sellerData.activityLabel || tenant.profile.activityLabel,
          }}
          client={{
            name: clientData.name,
            clientType: clientData.clientType,
            address: clientData.address || "",
            nif: clientData.nif,
            nis: clientData.nis,
            rc: clientData.rc,
            email: clientData.email,
            phone: clientData.phone,
          }}
          defaultLanguage={defaultLanguage}
        />
      </main>
    </div>
  );
}
