import React from "react";
import { notFound } from "next/navigation";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { BilingualInvoicePaper } from "@/components/invoices/BilingualInvoicePaper";

export const dynamic = "force-dynamic";

interface PrintInvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function PrintInvoicePage({
  params,
  searchParams,
}: PrintInvoicePageProps) {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);
  const { id } = await params;
  const resolvedParams = searchParams ? await searchParams : undefined;
  const lang = resolvedParams?.lang === "ar" ? "ar" : "fr";

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const invoice = await db.invoice.findFirst({
    where: {
      id,
      tenantId: session.tenantId,
    },
    include: {
      client: true,
      lineItems: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!invoice) notFound();

  const sellerData = invoice.sellerSnapshot
    ? JSON.parse(invoice.sellerSnapshot)
    : tenant.profile;

  const clientData = invoice.clientSnapshot
    ? JSON.parse(invoice.clientSnapshot)
    : invoice.client;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <BilingualInvoicePaper
          invoice={invoice}
          seller={sellerData}
          client={clientData}
          defaultLanguage={lang}
        />
      </div>
    </div>
  );
}
