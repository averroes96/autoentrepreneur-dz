import { db } from "./db";
import { formatDZD } from "./tax";

export type LedgerEntryType = "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "QUOTE";

export interface LedgerEntry {
  id: string;
  date: Date;
  type: LedgerEntryType;
  reference: string;
  description: string;
  debit: number;   // Montant facturé (+)
  credit: number;  // Montant réglé ou avoir (-)
  runningBalance: number;
  status: string;
  documentId: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
}

export interface ClientLedgerData {
  client: {
    id: string;
    name: string;
    clientType: string;
    address: string;
    email: string | null;
    phone: string | null;
    nif: string | null;
    nis: string | null;
    rc: string | null;
  };
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    phone: string;
    email: string;
    activityCode: string;
    activityLabel: string;
  };
  metrics: {
    totalBilledDzd: number;
    totalPaidDzd: number;
    totalCreditNotesDzd: number;
    outstandingBalanceDzd: number;
    invoicesCount: number;
    paidInvoicesCount: number;
    quotesCount: number;
    creditNotesCount: number;
    isSettled: boolean;
  };
  entries: LedgerEntry[];
  quotes: Array<{
    id: string;
    quoteNumber: string | null;
    issueDate: Date;
    total: number;
    status: string;
  }>;
}

export function formatPaymentMethodLabel(method?: string | null, locale: "fr" | "ar" = "fr"): string {
  if (!method) return locale === "ar" ? "تسوية غير محددة" : "Non spécifié";
  switch (method) {
    case "BANK_TRANSFER":
      return locale === "ar" ? "تحويل بنكي" : "Virement bancaire";
    case "CCP_BARIDIMOB":
      return locale === "ar" ? "حساب بريدي / بريدي موب" : "Virement CCP / BaridiMob";
    case "CASH":
    case "ESPECES":
      return locale === "ar" ? "نقدًا (Espèces)" : "Espèces (Cash)";
    case "CHEQUE":
      return locale === "ar" ? "صك بنكي" : "Chèque bancaire";
    default:
      return method;
  }
}

/**
 * Computes the complete chronological financial ledger for a specific client.
 */
export async function getClientLedger(
  tenantId: string,
  clientId: string
): Promise<ClientLedgerData> {
  const [client, tenant, invoices, creditNotes, quotes] = await Promise.all([
    db.client.findFirst({
      where: { id: clientId, tenantId },
    }),
    db.tenant.findUnique({
      where: { id: tenantId },
      include: { profile: true },
    }),
    db.invoice.findMany({
      where: { tenantId, clientId },
      orderBy: { issueDate: "asc" },
    }),
    db.creditNote.findMany({
      where: { tenantId, clientId },
      orderBy: { issueDate: "asc" },
    }),
    db.quote.findMany({
      where: { tenantId, clientId },
      orderBy: { issueDate: "asc" },
    }),
  ]);

  if (!client) {
    throw new Error("Client introuvable.");
  }

  const profile = tenant?.profile;
  const seller = {
    fullName: profile?.fullName || tenant?.name || "Auto-Entrepreneur",
    rnaeNumber: profile?.rnaeNumber || "—",
    nif: profile?.nif || "—",
    address: profile?.address || "—",
    phone: profile?.phone || "—",
    email: profile?.email || "—",
    activityCode: profile?.activityCode || "—",
    activityLabel: profile?.activityLabel || "—",
  };

  // 1. Calculate Core Totals
  const issuedInvoices = invoices.filter((i) => i.status === "ISSUED");
  const paidInvoices = issuedInvoices.filter((i) => i.paymentStatus === "PAID");
  const refundedCreditNotes = creditNotes.filter(
    (cn) => cn.status === "ISSUED" && cn.refundStatus === "REFUNDED"
  );

  const totalBilledDzd = issuedInvoices.reduce((acc, i) => acc + i.total, 0);
  const totalPaidDzd = paidInvoices.reduce((acc, i) => acc + i.total, 0);
  const totalCreditNotesDzd = refundedCreditNotes.reduce((acc, cn) => acc + cn.total, 0);

  // Net outstanding balance = Total billed - Total paid - Total refunded credit notes
  const outstandingBalanceDzd = Math.max(0, totalBilledDzd - totalPaidDzd - totalCreditNotesDzd);
  const isSettled = outstandingBalanceDzd === 0;

  // 2. Build Chronological Ledger Entries
  const rawEntries: Array<{
    id: string;
    date: Date;
    type: LedgerEntryType;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    status: string;
    documentId: string;
    paymentMethod?: string | null;
    paymentReference?: string | null;
  }> = [];

  // Invoices
  for (const inv of issuedInvoices) {
    rawEntries.push({
      id: `inv-${inv.id}`,
      date: new Date(inv.issueDate),
      type: "INVOICE",
      reference: inv.invoiceNumber || "FAC-BROUILLON",
      description: `Facture de vente #${inv.invoiceNumber || ""}`,
      debit: inv.total,
      credit: 0,
      status: inv.status,
      documentId: inv.id,
    });

    // If paid, add receipt / payment entry
    if (inv.paymentStatus === "PAID") {
      const receiptRef =
        inv.receiptNumber ||
        (inv.invoiceNumber ? inv.invoiceNumber.replace(/^FAC-/, "REC-") : `REC-${inv.id}`);
      const methodLabel = formatPaymentMethodLabel(inv.paymentMethod, "fr");

      rawEntries.push({
        id: `pay-${inv.id}`,
        date: inv.paidAt ? new Date(inv.paidAt) : new Date(inv.issueDate),
        type: "PAYMENT",
        reference: receiptRef,
        description: `Règlement facture ${inv.invoiceNumber || ""} (${methodLabel})${
          inv.paymentReference ? ` - Réf: ${inv.paymentReference}` : ""
        }`,
        debit: 0,
        credit: inv.total,
        status: "PAID",
        documentId: inv.id,
        paymentMethod: inv.paymentMethod,
        paymentReference: inv.paymentReference,
      });
    }
  }

  // Credit Notes (Avoirs)
  for (const cn of creditNotes) {
    if (cn.status === "ISSUED") {
      rawEntries.push({
        id: `cn-${cn.id}`,
        date: new Date(cn.issueDate),
        type: "CREDIT_NOTE",
        reference: cn.creditNoteNumber || "AVR-BROUILLON",
        description: `Facture d'Avoir (Sujet: ${cn.reason})`,
        debit: 0,
        credit: cn.refundStatus === "REFUNDED" ? cn.total : 0, // only deducted if refunded/applied
        status: cn.refundStatus,
        documentId: cn.id,
      });
    }
  }

  // Sort chronologically ascending
  rawEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Compute progressive running balance
  let currentBalance = 0;
  const entries: LedgerEntry[] = rawEntries.map((entry) => {
    currentBalance += entry.debit - entry.credit;
    return {
      ...entry,
      runningBalance: Math.max(0, currentBalance),
    };
  });

  return {
    client: {
      id: client.id,
      name: client.name,
      clientType: client.clientType,
      address: client.address,
      email: client.email,
      phone: client.phone,
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
    },
    seller,
    metrics: {
      totalBilledDzd,
      totalPaidDzd,
      totalCreditNotesDzd,
      outstandingBalanceDzd,
      invoicesCount: invoices.length,
      paidInvoicesCount: paidInvoices.length,
      quotesCount: quotes.length,
      creditNotesCount: creditNotes.length,
      isSettled,
    },
    entries,
    quotes: quotes.map((q) => ({
      id: q.id,
      quoteNumber: q.quoteNumber,
      issueDate: q.issueDate,
      total: q.total,
      status: q.status,
    })),
  };
}

/**
 * Generates official Client Statement (Relevé de Compte Client) in CSV with UTF-8 BOM.
 */
export function generateClientStatementCsv(ledger: ClientLedgerData): string {
  const { client, seller, metrics, entries } = ledger;

  const lines: string[] = [
    `"RELEVÉ DE COMPTE & GRAND LIVRE CLIENT"`,
    `"Régime de l'Auto-Entrepreneur (Loi 22-23) - Exonéré de TVA"`,
    "",
    `"Créancier :","${seller.fullName}","N° RNAE :","${seller.rnaeNumber}","NIF :","${seller.nif}"`,
    `"Client :","${client.name}","Type :","${client.clientType === "PROFESSIONAL" ? "Professionnel" : "Particulier"}","NIF :","${client.nif || "—"}"`,
    `"Date d'édition :","${new Date().toLocaleDateString("fr-DZ")}"`,
    "",
    `"SYNTHÈSE FINANCIÈRE"`,
    `"Total Facturé Émis (DZD) :","${metrics.totalBilledDzd}"`,
    `"Total Règlements Reçus (DZD) :","${metrics.totalPaidDzd}"`,
    `"Total Avoirs Déduits (DZD) :","${metrics.totalCreditNotesDzd}"`,
    `"SOLDE RESTANT DÛ (DZD) :","${metrics.outstandingBalanceDzd}"`,
    `"Situation comptable :","${metrics.isSettled ? "Compte Soldé / À jour" : "Solde Débiteur en attente"}"`,
    "",
    `"Date","Type Document","N° Référence","Description / Motif","Débit Facturé (DZD)","Crédit Réglé (DZD)","Solde Progressif (DZD)","Statut"`,
  ];

  for (const e of entries) {
    const formattedDate = new Date(e.date).toLocaleDateString("fr-DZ");
    const typeLabel =
      e.type === "INVOICE"
        ? "Facture"
        : e.type === "PAYMENT"
        ? "Règlement / Reçu"
        : e.type === "CREDIT_NOTE"
        ? "Facture d'Avoir"
        : "Devis";

    lines.push(
      `"${formattedDate}","${typeLabel}","${e.reference}","${e.description.replace(/"/g, '""')}","${
        e.debit > 0 ? e.debit : ""
      }","${e.credit > 0 ? e.credit : ""}","${e.runningBalance}","${e.status}"`
    );
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows/Mac properly displays accents
  return "\uFEFF" + lines.join("\r\n");
}
