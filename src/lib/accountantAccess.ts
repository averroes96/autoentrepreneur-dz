import crypto from "node:crypto";
import JSZip from "jszip";
import { db } from "./db";
import { hashPassword, verifyPassword } from "./auth";
import {
  getAnnualTaxSummary,
  generateTaxSummaryCsv,
  AnnualTaxSummary,
} from "./taxSummary";
import { generateTaxSummaryPdfBuffer } from "./pdfGenerator";
import { generateExpensesCsv } from "./expenses";
import { formatDZD } from "./tax";
import { formatCurrencyAmount } from "./currencies";

export interface CreateAccountantAccessInput {
  tenantId: string;
  name: string;
  email?: string | null;
  fiscalYear?: number | null;
  pin?: string | null;
  expiresInDays?: number | null;
  notes?: string | null;
}

export interface AccountantAccessValidationResult {
  valid: boolean;
  reason?: "NOT_FOUND" | "REVOKED" | "EXPIRED";
  access?: any;
}

/**
 * Creates a cryptographically secure guest token for an external accountant
 */
export async function createAccountantAccess(input: CreateAccountantAccessInput) {
  const token = crypto.randomBytes(24).toString("hex");

  let pinHash: string | null = null;
  if (input.pin && input.pin.trim().length > 0) {
    pinHash = await hashPassword(input.pin.trim());
  }

  let expiresAt: Date | null = null;
  if (input.expiresInDays && input.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
  }

  const access = await db.accountantAccess.create({
    data: {
      tenantId: input.tenantId,
      token,
      pinHash,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      fiscalYear: input.fiscalYear || null,
      expiresAt,
      notes: input.notes?.trim() || null,
    },
  });

  return {
    ...access,
    rawPin: input.pin ? input.pin.trim() : null,
  };
}

/**
 * Validates whether an accountant token is active and not expired or revoked
 */
export async function validateAccountantToken(
  token: string
): Promise<AccountantAccessValidationResult> {
  const access = await db.accountantAccess.findUnique({
    where: { token },
    include: {
      tenant: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (!access) {
    return { valid: false, reason: "NOT_FOUND" };
  }

  if (access.isRevoked) {
    return { valid: false, reason: "REVOKED", access };
  }

  if (access.expiresAt && access.expiresAt < new Date()) {
    return { valid: false, reason: "EXPIRED", access };
  }

  // Update audit tracking metrics and return fresh access record
  const updatedAccess = await db.accountantAccess.update({
    where: { id: access.id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
    include: {
      tenant: {
        include: {
          profile: true,
        },
      },
    },
  });

  return { valid: true, access: updatedAccess };
}

/**
 * Verifies if the provided PIN matches the stored hash
 */
export async function verifyAccountantPin(token: string, pin: string): Promise<boolean> {
  const access = await db.accountantAccess.findUnique({
    where: { token },
  });

  if (!access) return false;
  if (!access.pinHash) return true; // No PIN required
  if (!pin) return false;

  return verifyPassword(pin.trim(), access.pinHash);
}

/**
 * Revokes an accountant access token immediately
 */
export async function revokeAccountantAccess(tenantId: string, accessId: string) {
  return db.accountantAccess.updateMany({
    where: { id: accessId, tenantId },
    data: { isRevoked: true },
  });
}

/**
 * Deletes an accountant access link
 */
export async function deleteAccountantAccess(tenantId: string, accessId: string) {
  return db.accountantAccess.deleteMany({
    where: { id: accessId, tenantId },
  });
}

/**
 * Lists all accountant access invitations for a tenant
 */
export async function listAccountantAccesses(tenantId: string) {
  return db.accountantAccess.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves the comprehensive read-only audit dataset for an authorized accountant
 */
export async function getAccountantAuditData(token: string, selectedYear?: number) {
  const validation = await validateAccountantToken(token);
  if (!validation.valid || !validation.access) {
    throw new Error(`Accès non autorisé ou expiré (${validation.reason || "INVALID"})`);
  }

  const access = validation.access;
  const tenantId = access.tenantId;
  const profile = access.tenant.profile;

  // Determine active fiscal year (restricted if the access is locked to a year)
  const currentYear = new Date().getFullYear();
  const fiscalYear =
    access.fiscalYear !== null
      ? access.fiscalYear
      : selectedYear || currentYear;

  // 1. Annual Tax Summary (IFU G12 bis metrics)
  const taxSummary = await getAnnualTaxSummary(tenantId, fiscalYear);

  // 2. Complete Invoices (Issued)
  const invoices = await db.invoice.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
    },
    include: {
      client: true,
      lineItems: { orderBy: { position: "asc" } },
    },
    orderBy: { issueDate: "desc" },
  });

  // 3. Complete Credit Notes (Issued)
  const creditNotes = await db.creditNote.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
    },
    include: {
      client: true,
      originalInvoice: true,
      lineItems: { orderBy: { position: "asc" } },
    },
    orderBy: { issueDate: "desc" },
  });

  // 4. Operating Expenses
  const expenses = await db.expense.findMany({
    where: {
      tenantId,
      fiscalYear,
    },
    orderBy: { date: "desc" },
  });

  // 5. Clients list with balances
  const clients = await db.client.findMany({
    where: { tenantId },
    include: {
      invoices: {
        where: { fiscalYear, status: "ISSUED" },
        select: { total: true, totalDzd: true, paymentStatus: true },
      },
      creditNotes: {
        where: { fiscalYear, status: "ISSUED" },
        select: { total: true, totalDzd: true, refundStatus: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 6. Available fiscal years for navigation
  const [invoiceYears, expenseYears] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
    db.expense.findMany({
      where: { tenantId },
      select: { fiscalYear: true },
      distinct: ["fiscalYear"],
    }),
  ]);

  const yearsSet = new Set<number>([currentYear, fiscalYear]);
  invoiceYears.forEach((i) => yearsSet.add(i.fiscalYear));
  expenseYears.forEach((e) => yearsSet.add(e.fiscalYear));
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  return {
    access: {
      id: access.id,
      name: access.name,
      email: access.email,
      lockedFiscalYear: access.fiscalYear,
      expiresAt: access.expiresAt,
      isPinProtected: Boolean(access.pinHash),
      notes: access.notes,
    },
    profile,
    fiscalYear,
    availableYears,
    taxSummary,
    invoices,
    creditNotes,
    expenses,
    clients,
  };
}

/**
 * Builds a certified, complete ZIP audit package containing:
 * - 01_Bilan_Fiscal_IFU_G12_bis_{year}.pdf
 * - 02_Livre_des_Recettes_{year}.csv
 * - 03_Registre_des_Depenses_{year}.csv
 * - 04_Grand_Livre_Clients_{year}.csv
 * - 05_Attestation_Conformite_Loi_22-23.txt
 */
export async function generateAccountantAuditZipBuffer(
  token: string,
  targetYear?: number
): Promise<Buffer> {
  const auditData = await getAccountantAuditData(token, targetYear);
  const year = auditData.fiscalYear;
  const profile = auditData.profile;

  const zip = new JSZip();

  // 1. Official PDF: Bilan Fiscal Série G n° 12 bis
  const pdfBuffer = await generateTaxSummaryPdfBuffer(auditData.taxSummary);
  zip.file(`01_Bilan_Fiscal_IFU_G12_bis_${year}.pdf`, pdfBuffer);

  // 2. CSV: Livre des Recettes (Factures & Avoirs)
  const recettesCsv = generateTaxSummaryCsv(auditData.taxSummary);
  zip.file(`02_Livre_des_Recettes_${year}.csv`, recettesCsv);

  // 3. CSV: Registre des Dépenses d'Exploitation
  const depensesCsv = generateExpensesCsv(auditData.expenses as any, year);
  zip.file(`03_Registre_des_Depenses_${year}.csv`, depensesCsv);

  // 4. CSV: Grand Livre Récapitulatif Clients
  const clientsCsv = generateClientsAuditCsv(auditData.clients, year);
  zip.file(`04_Grand_Livre_Clients_${year}.csv`, clientsCsv);

  // 5. Attestation textuelle de conformité réglementaire & empreinte de contrôle
  const manifest = generateAuditManifestText(auditData);
  zip.file(`05_Attestation_Audit_Loi_22-23_${year}.txt`, manifest);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return zipBuffer;
}

/**
 * Helper to generate Clients audit CSV
 */
function generateClientsAuditCsv(clients: any[], fiscalYear: number): string {
  const headers = [
    "Nom du Client",
    "Type",
    "NIF",
    "NIS",
    "RC",
    "Total Facturé (DZD)",
    "Total Réglé (DZD)",
    "Avoirs Déduits (DZD)",
    "Solde Restant Dû (DZD)",
    "Situation",
  ];

  const rows = clients.map((c) => {
    const totalBilled = c.invoices.reduce((acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
    const totalPaid = c.invoices
      .filter((inv: any) => inv.paymentStatus === "PAID")
      .reduce((acc: number, inv: any) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
    const totalCredits = c.creditNotes.reduce((acc: number, cn: any) => acc + (cn.totalDzd ?? cn.total ?? 0), 0);
    const outstanding = Math.max(0, totalBilled - totalPaid - totalCredits);

    return [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      c.clientType === "PROFESSIONAL" ? "Société" : "Particulier",
      c.nif || "—",
      c.nis || "—",
      c.rc || "—",
      totalBilled.toFixed(2),
      totalPaid.toFixed(2),
      totalCredits.toFixed(2),
      outstanding.toFixed(2),
      outstanding === 0 ? "Soldé" : "En cours",
    ].join(";");
  });

  return "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
}

/**
 * Helper to generate legal audit manifest
 */
function generateAuditManifestText(auditData: any): string {
  const p = auditData.profile;
  const m = auditData.taxSummary.metrics;
  const dateStr = new Date().toISOString();

  return `================================================================================
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
DOSSIER D'AUDIT COMPTABLE & FISCAL — STATUT DE L'AUTO-ENTREPRENEUR
(Conformément aux dispositions de la Loi n° 22-23 du 18 décembre 2022)
================================================================================

1. IDENTIFICATION DU TITULAIRE :
--------------------------------------------------------------------------------
- Nom & Prénom : ${p?.fullName || "—"}
- Registre National (RNAE) : N° ${p?.rnaeNumber || "—"}
- Numéro d'Identification Fiscale (NIF) : ${p?.nif || "—"}
- Activité Réglementée : ${p?.activityLabel || "—"} (Code ANAE : ${p?.activityCode || "—"})
- Adresse d'exercice : ${p?.address || "—"}
- Régime Social CASNOS : ${p?.casnosScheme === "STANDARD_15" ? "Régime Proportionnel (15%)" : "Forfait Annuel (24 000 DZD)"}
- Statut d'Affiliation : ${p?.casnosStatus || "AFFILIATED"}

2. SYNTHÈSE FISCALE DE L'EXERCICE ${auditData.fiscalYear} (IFU SÉRIE G N° 12 BIS) :
--------------------------------------------------------------------------------
- Chiffre d'Affaires Brut Facturé : ${formatDZD(m.grossBilledDzd)}
- Chiffre d'Affaires Réellement Encaissé : ${formatDZD(m.rawCollectedDzd)}
- Déductions pour Factures d'Avoirs Remboursées : - ${formatDZD(m.totalRefundedCreditDzd)}
- CHIFFRE D'AFFAIRES NET IMPOSABLE (Assiette IFU) : ${formatDZD(m.netTaxableTurnoverDzd)}
- Taux légal IFU : 0,5% (Loi 22-23)
- Montant de l'Impôt Forfaitaire Unique (IFU) Dû : ${formatDZD(m.finalTaxOwedDzd)}
  (${m.isMinimumApplied ? "Minimum de perception de 10 000 DZD appliqué" : "0,5% du CA net encaissé"})
- Plafond Annuel Légal : 5 000 000,00 DZD
- Consommation du Seuil : ${m.ceilingConsumedPercentage}%
- Solde avant dépassement : ${formatDZD(m.remainingCeilingDzd)}

3. CHARGES & DÉPENSES D'EXPLOITATION (INDICATIF COMPTABLE) :
--------------------------------------------------------------------------------
- Total des dépenses opérationnelles enregistrées : ${auditData.expenses.length} écritures
- Montant total des dépenses : ${formatDZD(
    auditData.expenses.reduce((acc: number, e: any) => acc + (e.amountDzd || e.amount || 0), 0)
  )}
- Remarque : En vertu de la Loi 22-23, le régime fiscal IFU s'applique sur le chiffre d'affaires
  brut encaissé sans déduction des charges professionnelles au niveau fiscal.

4. CERTIFICATION DU PACK D'ARCHIVAGE NUMÉRIQUE :
--------------------------------------------------------------------------------
- Date de génération de l'archive : ${dateStr}
- Destinataire de l'audit : ${auditData.access?.name || "Titulaire du compte (Auto-Entrepreneur)"} ${auditData.access?.email ? `(${auditData.access.email})` : ""}
- Intégrité : Tous les fichiers inclus dans cette archive ont été exportés depuis le registre
  immuable horodaté de la plateforme Auto Entrepreneur DZ.
================================================================================
`;
}

/**
 * Retrieves the comprehensive read-only audit dataset for an authenticated tenant
 */
export async function getTenantAuditData(tenantId: string, fiscalYear: number) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { profile: true },
  });
  if (!tenant || !tenant.profile) {
    throw new Error("Tenant ou profil introuvable.");
  }
  const profile = tenant.profile;
  const taxSummary = await getAnnualTaxSummary(tenantId, fiscalYear);

  const invoices = await db.invoice.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
    },
    include: {
      client: true,
      lineItems: { orderBy: { position: "asc" } },
    },
    orderBy: { issueDate: "desc" },
  });

  const creditNotes = await db.creditNote.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
    },
    include: {
      client: true,
      originalInvoice: true,
      lineItems: { orderBy: { position: "asc" } },
    },
    orderBy: { issueDate: "desc" },
  });

  const expenses = await db.expense.findMany({
    where: {
      tenantId,
      fiscalYear,
    },
    orderBy: { date: "desc" },
  });

  const clients = await db.client.findMany({
    where: { tenantId },
    include: {
      invoices: {
        where: { fiscalYear, status: "ISSUED" },
      },
      creditNotes: {
        where: { fiscalYear, status: "ISSUED" },
      },
    },
    orderBy: { name: "asc" },
  });

  return {
    access: null,
    profile,
    fiscalYear,
    taxSummary,
    invoices,
    creditNotes,
    expenses,
    clients,
  };
}

/**
 * Generates an audit zip buffer directly for an authenticated tenant
 */
export async function generateTenantAuditZipBuffer(
  tenantId: string,
  targetYear: number
): Promise<Buffer> {
  const auditData = await getTenantAuditData(tenantId, targetYear);
  const year = auditData.fiscalYear;

  const zip = new JSZip();

  const pdfBuffer = await generateTaxSummaryPdfBuffer(auditData.taxSummary);
  zip.file(`01_Bilan_Fiscal_IFU_G12_bis_${year}.pdf`, pdfBuffer);

  const recettesCsv = generateTaxSummaryCsv(auditData.taxSummary);
  zip.file(`02_Livre_des_Recettes_${year}.csv`, recettesCsv);

  const depensesCsv = generateExpensesCsv(auditData.expenses as any, year);
  zip.file(`03_Registre_des_Depenses_${year}.csv`, depensesCsv);

  const clientsCsv = generateClientsAuditCsv(auditData.clients, year);
  zip.file(`04_Grand_Livre_Clients_${year}.csv`, clientsCsv);

  const manifest = generateAuditManifestText(auditData);
  zip.file(`05_Attestation_Audit_Loi_22-23_${year}.txt`, manifest);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return zipBuffer;
}

