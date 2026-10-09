import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  validateAccountantToken,
  generateAccountantAuditZipBuffer,
} from "@/lib/accountantAccess";

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

    // Check PIN protection
    if (validation.access.pinHash) {
      const cookieStore = await cookies();
      const pinCookie = cookieStore.get(`accountant_pin_${token}`);
      if (pinCookie?.value !== "verified") {
        return NextResponse.json(
          { error: "Code PIN requis pour télécharger cette archive." },
          { status: 403 }
        );
      }
    }

    const zipBuffer = await generateAccountantAuditZipBuffer(token, year);
    const targetYear =
      year || validation.access.fiscalYear || new Date().getFullYear();
    const sanitizedName = (validation.access.tenant?.name || "AutoEntrepreneur")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `Pack_Audit_Comptable_${targetYear}_${sanitizedName}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error generating accountant audit zip:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération de l'archive." },
      { status: 500 }
    );
  }
}
