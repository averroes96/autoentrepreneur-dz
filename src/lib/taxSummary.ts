import { db } from "./db";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import { calculateIfu, calculateCeilingStatus, formatDZD } from "./tax";

export interface PaidInvoiceLedgerItem {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  paidAt: Date | null;
  clientName: string;
  clientType: string;
  clientNif?: string | null;
  paymentMethod: string;
  total: number;
}

export interface RefundedCreditNoteLedgerItem {
  id: string;
  creditNoteNumber: string;
  issueDate: Date;
  refundedAt: Date | null;
  originalInvoiceNumber: string;
  clientName: string;
  reason: string;
  total: number;
}

export interface AnnualTaxSummary {
  fiscalYear: number;
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    email: string;
    phone: string;
    activityCode: string;
    activityLabel: string;
    casnosStatus: string;
    casnosScheme: string;
  };
  metrics: {
    grossBilledDzd: number;
    rawCollectedDzd: number;
    totalRefundedCreditDzd: number;
    netTaxableTurnoverDzd: number;
    ifuRate: number;
    rawIfuTaxDzd: number;
    minimumTaxDzd: number;
    finalTaxOwedDzd: number;
    isMinimumApplied: boolean;
    ceilingLimitDzd: number;
    ceilingConsumedPercentage: number;
    remainingCeilingDzd: number;
    totalPaidInvoicesCount: number;
    totalRefundedNotesCount: number;
  };
  paidInvoices: PaidInvoiceLedgerItem[];
  refundedCreditNotes: RefundedCreditNoteLedgerItem[];
  generatedAt: Date;
}

/**
 * Récupère et certifie l'ensemble des données fiscales annuelles (Bordereau Récapitulatif IFU / G12 bis).
 */
export async function getAnnualTaxSummary(
  tenantId: string,
  fiscalYear: number
): Promise<AnnualTaxSummary> {
  const profile = await db.autoEntrepreneurProfile.findUnique({
    where: { tenantId },
  });

  if (!profile) {
    throw new Error("Profil d'auto-entrepreneur introuvable pour ce compte.");
  }

  // 1. Factures de l'exercice
  const invoices = await db.invoice.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
    },
    include: {
      client: true,
    },
    orderBy: { paidAt: "asc" },
  });

  const paidInvoices = invoices.filter((i) => i.paymentStatus === "PAID");

  // 2. Avoirs remboursés de l'exercice
  const creditNotes = await db.creditNote.findMany({
    where: {
      tenantId,
      fiscalYear,
      status: "ISSUED",
      refundStatus: "REFUNDED",
    },
    include: {
      client: true,
      originalInvoice: {
        select: {
          invoiceNumber: true,
        },
      },
    },
    orderBy: { refundedAt: "asc" },
  });

  // Calculs financiers
  const grossBilledDzd = invoices.reduce((acc, i) => acc + i.total, 0);
  const rawCollectedDzd = paidInvoices.reduce((acc, i) => acc + i.total, 0);
  const totalRefundedCreditDzd = creditNotes.reduce((acc, cn) => acc + cn.total, 0);

  // Chiffre d'affaires net imposable (déduction des avoirs officiellement remboursés)
  const netTaxableTurnoverDzd = Math.max(0, rawCollectedDzd - totalRefundedCreditDzd);

  // Calcul IFU & Plafond
  const ifuCalc = calculateIfu(netTaxableTurnoverDzd);
  const ceilingCalc = calculateCeilingStatus(netTaxableTurnoverDzd);

  const formattedPaidInvoices: PaidInvoiceLedgerItem[] = paidInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "FAC-INCONNUE",
    issueDate: inv.issueDate,
    paidAt: inv.paidAt || inv.issueDate,
    clientName: inv.client.name,
    clientType: inv.client.clientType === "PROFESSIONAL" ? "Société" : "Particulier",
    clientNif: inv.client.nif,
    paymentMethod: "Virement / Versement",
    total: inv.total,
  }));

  const formattedCreditNotes: RefundedCreditNoteLedgerItem[] = creditNotes.map((cn) => ({
    id: cn.id,
    creditNoteNumber: cn.creditNoteNumber || "AVR-INCONNU",
    issueDate: cn.issueDate,
    refundedAt: cn.refundedAt || cn.issueDate,
    originalInvoiceNumber: cn.originalInvoice.invoiceNumber || "—",
    clientName: cn.client.name,
    reason: cn.reason,
    total: cn.total,
  }));

  return {
    fiscalYear,
    seller: {
      fullName: profile.fullName,
      rnaeNumber: profile.rnaeNumber,
      nif: profile.nif,
      address: profile.address,
      email: profile.email,
      phone: profile.phone,
      activityCode: profile.activityCode,
      activityLabel: profile.activityLabel,
      casnosStatus: profile.casnosStatus,
      casnosScheme: profile.casnosScheme,
    },
    metrics: {
      grossBilledDzd,
      rawCollectedDzd,
      totalRefundedCreditDzd,
      netTaxableTurnoverDzd,
      ifuRate: ifuCalc.rate,
      rawIfuTaxDzd: ifuCalc.rawTaxDzd,
      minimumTaxDzd: ifuCalc.minimumTaxDzd,
      finalTaxOwedDzd: ifuCalc.taxOwedDzd,
      isMinimumApplied: ifuCalc.isMinimumApplied,
      ceilingLimitDzd: ceilingCalc.ceilingLimitDzd,
      ceilingConsumedPercentage: ceilingCalc.percentage,
      remainingCeilingDzd: ceilingCalc.remainingDzd,
      totalPaidInvoicesCount: paidInvoices.length,
      totalRefundedNotesCount: creditNotes.length,
    },
    paidInvoices: formattedPaidInvoices,
    refundedCreditNotes: formattedCreditNotes,
    generatedAt: new Date(),
  };
}

/**
 * Génère le fichier CSV (Livre-Journal des Recettes) aux normes tableur (Excel / LibreOffice).
 * Utilise l'encodage UTF-8 avec BOM pour une ouverture parfaite des accents et caractères arabes.
 */
export function generateTaxSummaryCsv(summary: AnnualTaxSummary): string {
  const lines: string[] = [];

  // UTF-8 BOM
  const bom = "\uFEFF";

  lines.push("BORDEREAU RÉCAPITULATIF FISCAL & LIVRE DES RECETTES ENCAISSÉES");
  lines.push(`RÉGIME AUTO-ENTREPRENEUR (LOI 22-23) — EXERCICE FISCAL ${summary.fiscalYear}`);
  lines.push("");

  // Section Contribuable
  lines.push("INFORMATIONS DU CONTRIBUABLE");
  lines.push(`Nom & Prénom;${summary.seller.fullName}`);
  lines.push(`N° RNAE (Carte Auto-Entrepreneur);${summary.seller.rnaeNumber}`);
  lines.push(`NIF (Numéro d'Identification Fiscale);${summary.seller.nif}`);
  lines.push(`Activité ANAE;${summary.seller.activityCode} - ${summary.seller.activityLabel}`);
  lines.push(`Adresse fiscale;${summary.seller.address}`);
  lines.push("");

  // Section Synthèse Fiscale
  lines.push("SYNTHÈSE DE LA DÉCLARATION IFU (SÉRIE G N° 12 BIS)");
  lines.push(`Chiffre d'Affaires Brut Facturé;${summary.metrics.grossBilledDzd} DZD`);
  lines.push(`Total Encaissements Effectifs;${summary.metrics.rawCollectedDzd} DZD`);
  lines.push(`Déductions pour Factures d'Avoir / Remboursements;-${summary.metrics.totalRefundedCreditDzd} DZD`);
  lines.push(`CHIFFRE D'AFFAIRES NET IMPOSABLE;${summary.metrics.netTaxableTurnoverDzd} DZD`);
  lines.push(`Taux d'Imposition IFU;0.5%`);
  lines.push(`Montant IFU Calculé;${summary.metrics.rawIfuTaxDzd} DZD`);
  lines.push(`Plancher Minimum Légal;${summary.metrics.minimumTaxDzd} DZD`);
  lines.push(`MONTANT TOTAL DE L'IMPÔT DÛ AU TRÉSOR PUBLIC;${summary.metrics.finalTaxOwedDzd} DZD`);
  lines.push(`Plafond Consommé (sur 5 000 000 DZD);${summary.metrics.ceilingConsumedPercentage}%`);
  lines.push("");

  // Section Livre des Recettes (Paid Invoices)
  lines.push("LIVRE-JOURNAL DES ENCAISSEMENTS (FACTURES PAYÉES)");
  lines.push("N° Facture;Date d'Émission;Date d'Encaissement;Client;Type Client;NIF Client;Montant Encaissé (DZD)");

  summary.paidInvoices.forEach((inv) => {
    const issueDateStr = new Date(inv.issueDate).toLocaleDateString("fr-DZ");
    const paidDateStr = inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("fr-DZ") : issueDateStr;
    lines.push(
      `"${inv.invoiceNumber}";"${issueDateStr}";"${paidDateStr}";"${inv.clientName.replace(/"/g, '""')}";"${inv.clientType}";"${inv.clientNif || "—"}";${inv.total}`
    );
  });

  // Section Avoirs
  if (summary.refundedCreditNotes.length > 0) {
    lines.push("");
    lines.push("AVOIRS ET NOTES DE CRÉDIT REMBOURSÉES (DÉDUCTIONS)");
    lines.push("N° Avoir;Date d'Émission;Date Remboursement;Réf Facture;Client;Motif;Montant Déduit (DZD)");
    summary.refundedCreditNotes.forEach((cn) => {
      const issueDateStr = new Date(cn.issueDate).toLocaleDateString("fr-DZ");
      const refDateStr = cn.refundedAt ? new Date(cn.refundedAt).toLocaleDateString("fr-DZ") : issueDateStr;
      lines.push(
        `"${cn.creditNoteNumber}";"${issueDateStr}";"${refDateStr}";"${cn.originalInvoiceNumber}";"${cn.clientName.replace(/"/g, '""')}";"${cn.reason.replace(/"/g, '""')}";-${cn.total}`
      );
    });
  }

  lines.push("");
  lines.push(`Généré le ${new Date().toLocaleDateString("fr-DZ")} par Moukawil.dz — Conforme Loi 22-23`);

  return bom + lines.join("\r\n");
}
