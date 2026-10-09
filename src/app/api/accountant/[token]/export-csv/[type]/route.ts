import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  validateAccountantToken,
  getAccountantAuditData,
} from "@/lib/accountantAccess";
import { generateTaxSummaryCsv } from "@/lib/taxSummary";
import { generateExpensesCsv } from "@/lib/expenses";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; type: string }> }
) {
  try {
    const { token, type } = await params;
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
    const fYear = auditData.fiscalYear;

    let csvContent = "";
    let filename = "";

    if (type === "recettes") {
      csvContent = generateTaxSummaryCsv(auditData.taxSummary);
      filename = `Livre_des_Recettes_${fYear}.csv`;
    } else if (type === "depenses") {
      csvContent = generateExpensesCsv(auditData.expenses as any, fYear);
      filename = `Registre_des_Depenses_${fYear}.csv`;
    } else if (type === "clients") {
      const headers = [
        "Nom du Client",
        "Type",
        "NIF",
        "NIS",
        "RC",
        "Total Facturé (DZD)",
        "Total Réglé (DZD)",
        "Solde Dû (DZD)",
      ];
      const rows = auditData.clients.map((c: any) => {
        const totalBilled = c.invoices.reduce((acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
        const totalPaid = c.invoices
          .filter((inv: any) => inv.paymentStatus === "PAID")
          .reduce((acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
        const outstanding = Math.max(0, totalBilled - totalPaid);
        return [
          `"${(c.name || "").replace(/"/g, '""')}"`,
          c.clientType === "PROFESSIONAL" ? "Société" : "Particulier",
          c.nif || "—",
          c.nis || "—",
          c.rc || "—",
          totalBilled.toFixed(2),
          totalPaid.toFixed(2),
          outstanding.toFixed(2),
        ].join(";");
      });
      csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
      filename = `Grand_Livre_Clients_${fYear}.csv`;
    } else {
      return NextResponse.json({ error: "Type d'export invalide." }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error exporting CSV for accountant:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'export CSV." },
      { status: 500 }
    );
  }
}
