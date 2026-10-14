import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateInvoicePdfBuffer,
  generateQuotePdfBuffer,
  generateCreditNotePdfBuffer,
  generatePaymentReceiptPdfBuffer,
} from "@/lib/pdfGenerator";
import { resolveDocumentSeller } from "@/lib/invoiceDesign";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) {
      return new NextResponse("Profil non configuré", { status: 400 });
    }

    const body = await request.json();
    const { docType = "INVOICE", lang = "fr", seller: customSeller } = body;

    const seller = resolveDocumentSeller(
      {
        ...profile,
        ...(customSeller || {}),
      },
      null
    );

    const client = {
      name: "SARL Algiers Tech Innovations",
      clientType: "PROFESSIONAL",
      address: "15 Boulevard Zighoud Youcef, Alger Centre",
      nif: "001916012345678",
      nis: "001916012345678",
      rc: "16/00-1234567B22",
      email: "direction@algiers-tech.dz",
      phone: "021 73 00 00",
    };

    let pdfBuffer: Buffer;
    let filename: string;

    if (docType === "QUOTE") {
      pdfBuffer = await generateQuotePdfBuffer({
        quote: {
          quoteNumber: "DEV-2026-0018",
          issueDate: new Date(),
          validUntil: new Date(Date.now() + 30 * 86400000),
          paymentTerms: seller.paymentTerms || "UPON_RECEIPT",
          total: 240000,
          currency: "DZD",
          vatExemptionNote: "Devis exonéré de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
          notes: "Délai de réalisation : 4 semaines à compter de la validation du devis.",
          lineItems: [
            {
              description: "Conception & développement d'une plateforme web moderne et sécurisée",
              quantity: 1,
              unitPrice: 180000,
              totalPrice: 180000,
            },
            {
              description: "Configuration de l'infrastructure cloud & intégration CI/CD",
              quantity: 1,
              unitPrice: 60000,
              totalPrice: 60000,
            },
          ],
        },
        seller: seller as any,
        client,
      });
      filename = "Specimen-Devis-Studio.pdf";
    } else if (docType === "CREDIT_NOTE") {
      pdfBuffer = await generateCreditNotePdfBuffer({
        creditNote: {
          creditNoteNumber: "AVR-2026-0003",
          issueDate: new Date(),
          originalInvoiceNumber: "FAC-2026-0040",
          reason: "Remise commerciale exceptionnelle suite à révision de périmètre",
          total: 35000,
          currency: "DZD",
          vatExemptionNote: "Facture d'avoir exonérée de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
          notes: "Avoir déductible de la prochaine situation comptable.",
          lineItems: [
            {
              description: "Avoir commercial sur prestation d'audit logiciel",
              quantity: 1,
              unitPrice: 35000,
              totalPrice: 35000,
            },
          ],
        },
        seller: seller as any,
        client,
      });
      filename = "Specimen-Avoir-Studio.pdf";
    } else if (docType === "RECEIPT") {
      pdfBuffer = await generatePaymentReceiptPdfBuffer({
        receiptNumber: "REC-2026-0042",
        invoiceNumber: "FAC-2026-0042",
        paymentDate: new Date(),
        paymentMethod: "BARIDIMOB",
        paymentReference: "TRX-BM-99887766",
        total: 180000,
        currency: "DZD",
        notes: "Règlement intégral reçu sans réserve.",
        seller: seller as any,
        client,
      });
      filename = "Specimen-Quittance-Studio.pdf";
    } else {
      // Default: INVOICE
      pdfBuffer = await generateInvoicePdfBuffer({
        invoice: {
          invoiceNumber: "FAC-2026-0042",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 86400000),
          paymentTerms: seller.paymentTerms || "UPON_RECEIPT",
          total: 180000,
          currency: "DZD",
          vatExemptionNote: "Facture exonérée de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
          notes: "Paiement attendu selon les coordonnées bancaires / BaridiMob mentionnées ci-dessous.",
          lineItems: [
            {
              description: "Audit d'architecture logicielle & refonte de l'infrastructure Cloud",
              quantity: 1,
              unitPrice: 120000,
              totalPrice: 120000,
            },
            {
              description: "Optimisation des performances API et sécurisation des bases de données",
              quantity: 1,
              unitPrice: 60000,
              totalPrice: 60000,
            },
          ],
        },
        seller: seller as any,
        client,
      });
      filename = "Specimen-Facture-Studio.pdf";
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Studio specimen PDF generation error:", error);
    return new NextResponse(`Erreur génération spécimen PDF: ${error.message}`, {
      status: 500,
    });
  }
}
