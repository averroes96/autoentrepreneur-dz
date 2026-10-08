import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { EditInvoiceHeader } from "@/components/invoices/EditInvoiceHeader";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const invoice = await db.invoice.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      lineItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!invoice) notFound();

  // If already issued or cancelled, editing is strictly forbidden by law
  if (invoice.status !== "DRAFT") {
    redirect(`/invoices/${invoice.id}`);
  }

  const clients = await db.client.findMany({
    where: {
      tenantId: session.tenantId,
      isArchived: false,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <EditInvoiceHeader invoiceId={invoice.id} />

        <InvoiceForm
          clients={clients}
          defaultCurrency={tenant.profile.defaultCurrency}
          vatExemptionNote={tenant.profile.vatExemptionNote}
          existingInvoice={{
            id: invoice.id,
            clientId: invoice.clientId,
            issueDate: invoice.issueDate,
            notes: invoice.notes,
            showDetailedItems: invoice.showDetailedItems,
            lineItems: invoice.lineItems.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              totalPrice: li.totalPrice,
            })),
          }}
        />
      </main>
    </div>
  );
}
