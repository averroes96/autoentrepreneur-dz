import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAnnualTaxSummary, generateTaxSummaryCsv } from "@/lib/taxSummary";

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
    const csvContent = generateTaxSummaryCsv(summary);

    const safeName = summary.seller.fullName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Livre_Recettes_IFU_${year}_${safeName}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Erreur génération CSV Livre des Recettes :", error);
    return new NextResponse(
      `Erreur lors de la génération du fichier CSV : ${error?.message || "Erreur interne"}`,
      { status: 500 }
    );
  }
}
