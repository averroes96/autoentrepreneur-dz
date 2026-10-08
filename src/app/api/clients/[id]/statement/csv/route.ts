import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientLedger, generateClientStatementCsv } from "@/lib/clientLedger";

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

    const csvContent = generateClientStatementCsv(ledger);
    const sanitizedClientName = ledger.client.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Releve-Compte-${sanitizedClientName}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Erreur génération CSV relevé client :", err);
    return new NextResponse(
      err.message || "Erreur lors de la génération du CSV du relevé",
      { status: 500 }
    );
  }
}
