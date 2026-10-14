import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdfBuffer } from "@/lib/pdfGenerator";
import { resolveDocumentSeller } from "@/lib/invoiceDesign";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: {
        id,
        tenantId: session.tenantId, // Strict tenant isolation
      },
      include: {
        client: true,
        lineItems: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!invoice) {
      return new NextResponse("Facture introuvable", { status: 404 });
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) {
      return new NextResponse("Profil non configuré", { status: 400 });
    }

    const sellerData = resolveDocumentSeller(profile, invoice.sellerSnapshot);

    const clientData = invoice.clientSnapshot
      ? JSON.parse(invoice.clientSnapshot)
      : invoice.client;

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoice,
      seller: sellerData as any,
      client: clientData,
    });

    const filename = `Facture-${invoice.invoiceNumber || "BROUILLON"}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse(`Erreur génération PDF: ${error.message}`, { status: 500 });
  }
}
