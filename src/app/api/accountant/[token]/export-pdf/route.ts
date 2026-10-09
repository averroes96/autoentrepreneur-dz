import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  validateAccountantToken,
  getAccountantAuditData,
} from "@/lib/accountantAccess";
import { generateTaxSummaryPdfBuffer } from "@/lib/pdfGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const rawYear = searchParams.get("year");
    const year = rawYear ? parseInt(rawYear, 10) : undefined;

    const validation = await validateAccountantToken(token);
    if (!validation.valid || !validation.access) {
      return NextResponse.json(
        { error: "Accès non autorisé ou expiré." },
        { status: 401 }
      );
    }

    if (validation.access.pinHash) {
      const cookieStore = await cookies();
      const pinCookie = cookieStore.get(`accountant_pin_${token}`);
      if (pinCookie?.value !== "verified") {
        return NextResponse.json(
          { error: "Code PIN requis." },
          { status: 403 }
        );
      }
    }

    const auditData = await getAccountantAuditData(token, year);
    const pdfBuffer = await generateTaxSummaryPdfBuffer(auditData.taxSummary);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Bilan_Fiscal_G12_bis_${auditData.fiscalYear}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error generating tax summary pdf for accountant:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération du PDF." },
      { status: 500 }
    );
  }
}
