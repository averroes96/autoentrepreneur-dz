import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateTenantAuditZipBuffer } from "@/lib/accountantAccess";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawYear = searchParams.get("year");
    const year = rawYear ? parseInt(rawYear, 10) : new Date().getFullYear();

    const tenant = await db.tenant.findUnique({
      where: { id: session.tenantId },
      include: { profile: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    const zipBuffer = await generateTenantAuditZipBuffer(session.tenantId, year);
    const sanitizedName = (tenant.profile?.fullName || tenant.name || "AutoEntrepreneur")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `Pack_Audit_Comptable_${year}_${sanitizedName}.zip`;

    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error generating tenant audit zip:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération de l'archive ZIP." },
      { status: 500 }
    );
  }
}
