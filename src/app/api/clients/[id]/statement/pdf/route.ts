import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientLedger } from "@/lib/clientLedger";
import { generateClientStatementPdfBuffer } from "@/lib/pdfGenerator";

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
    const ledger = await getClientLedger(session.tenantId, id);

    const pdfBuffer = await generateClientStatementPdfBuffer(ledger);
    const sanitizedClientName = ledger.client.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Releve-Compte-${sanitizedClientName}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("Erreur génération PDF relevé de compte client :", err);
    return new NextResponse(
      err.message || "Erreur lors de la génération du relevé de compte",
      { status: 500 }
    );
  }
}
