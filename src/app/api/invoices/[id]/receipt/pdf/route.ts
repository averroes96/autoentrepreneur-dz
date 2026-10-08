import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePaymentReceiptPdfBuffer } from "@/lib/pdfGenerator";

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
        tenantId: session.tenantId,
      },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Facture introuvable", { status: 404 });
    }

    if (invoice.paymentStatus !== "PAID") {
      return new NextResponse(
        "Cette facture n'est pas marquée comme payée. Aucun reçu disponible.",
        { status: 400 }
      );
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) {
      return new NextResponse("Profil non configuré", { status: 400 });
    }

    const sellerData = invoice.sellerSnapshot
      ? JSON.parse(invoice.sellerSnapshot)
      : profile;

    const clientData = invoice.clientSnapshot
      ? JSON.parse(invoice.clientSnapshot)
      : invoice.client;

    const receiptNumber =
      invoice.receiptNumber ||
      (invoice.invoiceNumber
        ? invoice.invoiceNumber.replace(/^FAC-/, "REC-")
        : `REC-${invoice.fiscalYear}-${String(invoice.sequenceNumber || 1).padStart(4, "0")}`);

    const pdfBuffer = await generatePaymentReceiptPdfBuffer({
      receiptNumber,
      invoiceNumber: invoice.invoiceNumber || `FAC-${invoice.id.slice(0, 6)}`,
      paymentDate: invoice.paidAt || invoice.issueDate,
      paymentMethod: invoice.paymentMethod,
      paymentReference: invoice.paymentReference,
      total: invoice.total,
      currency: invoice.currency || "DZD",
      notes: invoice.notes,
      seller: {
        fullName: sellerData.fullName || profile.fullName,
        rnaeNumber: sellerData.rnaeNumber || profile.rnaeNumber,
        nif: sellerData.nif || profile.nif,
        address: sellerData.address || profile.address,
        email: sellerData.email || profile.email,
        phone: sellerData.phone || profile.phone,
        activityCode: sellerData.activityCode || profile.activityCode,
        activityLabel: sellerData.activityLabel || profile.activityLabel,
      },
      client: {
        name: clientData.name,
        clientType: clientData.clientType,
        address: clientData.address || "",
        nif: clientData.nif,
        nis: clientData.nis,
        rc: clientData.rc,
        email: clientData.email,
        phone: clientData.phone,
      },
    });

    const filename = `Quittance-${receiptNumber}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Erreur génération PDF reçu :", err);
    return new NextResponse("Erreur interne lors de la génération du reçu", {
      status: 500,
    });
  }
}
