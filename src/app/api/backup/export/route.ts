import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  generateVaultZipArchive,
  generateVaultJsonBuffer,
} from "@/lib/vault";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "zip";
    const passphrase = searchParams.get("passphrase") || undefined;

    if (format === "json") {
      const { buffer, filename } = await generateVaultJsonBuffer(session.tenantId, {
        passphrase,
      });

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Default to ZIP archive
    const { buffer, filename } = await generateVaultZipArchive(session.tenantId, {
      passphrase,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error generating vault backup:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération de la sauvegarde." },
      { status: 500 }
    );
  }
}
