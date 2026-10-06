import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInvoicePdfBuffer } from "@/lib/pdfGenerator";

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

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoice,
      seller: {
        fullName: profile.fullName,
        rnaeNumber: profile.rnaeNumber,
        nif: profile.nif,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        activityCode: profile.activityCode,
        activityLabel: profile.activityLabel,
      },
      client: invoice.client,
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
