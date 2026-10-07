import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAnnualTaxSummary } from "@/lib/taxSummary";
import { generateTaxSummaryPdfBuffer } from "@/lib/pdfGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { year: yearParam } = await params;
    const year = parseInt(yearParam, 10);

    if (isNaN(year) || year < 2020 || year > 2100) {
      return new NextResponse("Année fiscale invalide", { status: 400 });
    }

    const summary = await getAnnualTaxSummary(session.tenantId, year);
    const pdfBuffer = await generateTaxSummaryPdfBuffer(summary);

    const safeName = summary.seller.fullName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Bordereau_IFU_${year}_${safeName}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Erreur génération PDF Bordereau Récapitulatif :", error);
    return new NextResponse(
      `Erreur lors de la génération du bordereau fiscal : ${error?.message || "Erreur interne"}`,
      { status: 500 }
    );
  }
}
