import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQuotePdfBuffer } from "@/lib/pdfGenerator";

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

    const quote = await db.quote.findFirst({
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

    if (!quote) {
      return new NextResponse("Devis introuvable", { status: 404 });
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) {
      return new NextResponse("Profil non configuré", { status: 400 });
    }

    const pdfBuffer = await generateQuotePdfBuffer({
      quote,
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
      client: quote.client,
    });

    const filename = `Devis-${quote.quoteNumber || "BROUILLON"}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Quote PDF generation error:", error);
    return new NextResponse(`Erreur génération PDF: ${error.message}`, { status: 500 });
  }
}
