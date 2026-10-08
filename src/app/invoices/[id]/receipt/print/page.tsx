import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { BilingualPaymentReceiptPaper } from "@/components/receipts/BilingualPaymentReceiptPaper";

export const dynamic = "force-dynamic";

interface ReceiptPrintPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function InvoiceReceiptPrintPage({
  params,
  searchParams,
}: ReceiptPrintPageProps) {
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
    <div className="min-h-screen bg-white p-4 sm:p-8">
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
    </div>
  );
}
