import { db } from "./db";

export interface QuoteLineItemInput {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface CreateQuoteInput {
  tenantId: string;
  clientId: string;
  issueDate: Date;
  validUntil?: Date | null;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems: QuoteLineItemInput[];
}

/**
 * Creates a new Draft quote (Devis).
 * No sequential number is allocated while in Draft.
 */
export async function createDraftQuote(data: CreateQuoteInput) {
  const fiscalYear = data.issueDate.getFullYear();

  const profile = await db.autoEntrepreneurProfile.findUnique({
    where: { tenantId: data.tenantId },
  });

  const vatExemptionNote =
    profile?.vatExemptionNote ||
    "Exonéré de la TVA en vertu de la loi n° 22-23 relative au statut de l'auto-entrepreneur et du Code des Impôts Directs.";

  const normalizedItems = data.lineItems.map((item, index) => {
    const qty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
    let total = 0;
    let unit = 0;

    if (item.totalPrice !== undefined && item.totalPrice >= 0) {
      total = item.totalPrice;
      unit = item.unitPrice !== undefined && item.unitPrice >= 0 ? item.unitPrice : total / qty;
    } else if (item.unitPrice !== undefined) {
      unit = item.unitPrice;
      total = qty * unit;
    }

    return {
      description: item.description,
      quantity: qty,
      unitPrice: unit,
      totalPrice: total,
      currency: profile?.defaultCurrency || "DZD",
      position: index,
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  // Default validity date: 30 days after issueDate if not specified
  const validUntil =
    data.validUntil ||
    new Date(data.issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  return db.quote.create({
    data: {
      tenantId: data.tenantId,
      clientId: data.clientId,
      fiscalYear,
      issueDate: data.issueDate,
      validUntil,
      status: "DRAFT",
      currency: profile?.defaultCurrency || "DZD",
      total,
      vatExemptionNote,
      notes: data.notes,
      showDetailedItems: data.showDetailedItems ?? false,
      lineItems: {
        create: normalizedItems,
      },
    },
    include: {
      client: true,
      lineItems: true,
    },
  });
}

/**
 * Updates a Draft quote. Only drafts can be modified.
 */
export async function updateDraftQuote(
  tenantId: string,
  quoteId: string,
  data: {
    clientId?: string;
    issueDate?: Date;
    validUntil?: Date | null;
    notes?: string;
    showDetailedItems?: boolean;
    lineItems?: QuoteLineItemInput[];
  }
) {
  const existing = await db.quote.findFirst({
    where: { id: quoteId, tenantId },
  });

  if (!existing) {
    throw new Error("Devis introuvable.");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Seuls les devis en mode brouillon peuvent être modifiés.");
  }

  return db.$transaction(async (tx) => {
    let newTotal = existing.total;
    let fiscalYear = existing.fiscalYear;

    if (data.issueDate) {
      fiscalYear = data.issueDate.getFullYear();
    }

    if (data.lineItems) {
      await tx.quoteLineItem.deleteMany({
        where: { quoteId },
      });

      const normalizedItems = data.lineItems.map((item, index) => {
        const qty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
        let total = 0;
        let unit = 0;

        if (item.totalPrice !== undefined && item.totalPrice >= 0) {
          total = item.totalPrice;
          unit = item.unitPrice !== undefined && item.unitPrice >= 0 ? item.unitPrice : total / qty;
        } else if (item.unitPrice !== undefined) {
          unit = item.unitPrice;
          total = qty * unit;
        }

        return {
          quoteId,
          description: item.description,
          quantity: qty,
          unitPrice: unit,
          totalPrice: total,
          currency: existing.currency,
          position: index,
        };
      });

      newTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await tx.quoteLineItem.createMany({
        data: normalizedItems,
      });
    }

    return tx.quote.update({
      where: { id: quoteId },
      data: {
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.issueDate && { issueDate: data.issueDate, fiscalYear }),
        ...(data.validUntil !== undefined && { validUntil: data.validUntil }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.showDetailedItems !== undefined && { showDetailedItems: data.showDetailedItems }),
        total: newTotal,
      },
      include: {
        client: true,
        lineItems: true,
      },
    });
  });
}

/**
 * Validates and finalizes a quote:
 * - Allocates next consecutive sequential quote number (e.g. DEV-2026-0001)
 * - Captures snapshots of seller and client
 * - Sets status to SENT (Envoyé au client)
 */
export async function finalizeAndSendQuote(tenantId: string, quoteId: string) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { client: true, lineItems: true },
    });

    if (!quote) throw new Error("Devis introuvable.");
    if (quote.status !== "DRAFT") throw new Error("Ce devis a déjà été validé.");
    if (quote.lineItems.length === 0) throw new Error("Le devis doit comporter au moins une prestation.");

    const profile = await tx.autoEntrepreneurProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) throw new Error("Profil introuvable.");

    const year = quote.fiscalYear;
    let seqRecord = await tx.quoteSequence.findUnique({
      where: {
        tenantId_fiscalYear: {
          tenantId,
          fiscalYear: year,
        },
      },
    });

    if (!seqRecord) {
      seqRecord = await tx.quoteSequence.create({
        data: {
          tenantId,
          fiscalYear: year,
          lastSequence: 1,
        },
      });
    } else {
      seqRecord = await tx.quoteSequence.update({
        where: { id: seqRecord.id },
        data: {
          lastSequence: { increment: 1 },
        },
      });
    }

    const nextSeq = seqRecord.lastSequence;
    const prefix = (profile.quotePrefix || "DEV").trim().toUpperCase();
    const formattedSeq = String(nextSeq).padStart(4, "0");
    const quoteNumber = `${prefix}-${year}-${formattedSeq}`;

    const sellerSnapshot = {
      fullName: profile.fullName,
      rnaeNumber: profile.rnaeNumber,
      nif: profile.nif,
      address: profile.address,
      email: profile.email,
      phone: profile.phone,
      activityCode: profile.activityCode,
      activityLabel: profile.activityLabel,
    };

    const clientSnapshot = {
      name: quote.client.name,
      clientType: quote.client.clientType,
      address: quote.client.address,
      nif: quote.client.nif,
      nis: quote.client.nis,
      rc: quote.client.rc,
      email: quote.client.email,
      phone: quote.client.phone,
    };

    return tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "SENT",
        quoteNumber,
        sequenceNumber: nextSeq,
        sellerSnapshot: JSON.stringify(sellerSnapshot),
        clientSnapshot: JSON.stringify(clientSnapshot),
        sentAt: new Date(),
        vatExemptionNote: profile.vatExemptionNote,
      },
      include: {
        client: true,
        lineItems: {
          orderBy: { position: "asc" },
        },
      },
    });
  });
}

/**
 * Updates status of a finalized quote (e.g. ACCEPTED or REJECTED).
 */
export async function updateQuoteStatus(
  tenantId: string,
  quoteId: string,
  status: "ACCEPTED" | "REJECTED"
) {
  const quote = await db.quote.findFirst({
    where: { id: quoteId, tenantId },
  });

  if (!quote) throw new Error("Devis introuvable.");
  if (quote.status === "DRAFT") throw new Error("Veuillez d'abord valider ce devis.");
  if (quote.status === "CONVERTED") throw new Error("Ce devis a déjà été converti en facture.");

  return db.quote.update({
    where: { id: quoteId },
    data: { status },
  });
}

/**
 * ⚡ One-click Conversion of an accepted or sent quote into an official invoice draft!
 * Copies client, line items, currency, notes, and sets quote relation.
 */
export async function convertQuoteToInvoice(tenantId: string, quoteId: string) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, tenantId },
      include: { client: true, lineItems: { orderBy: { position: "asc" } } },
    });

    if (!quote) throw new Error("Devis introuvable.");
    if (quote.status === "CONVERTED") {
      throw new Error("Ce devis a déjà été converti en facture.");
    }

    const today = new Date();
    const fiscalYear = today.getFullYear();

    const profile = await tx.autoEntrepreneurProfile.findUnique({
      where: { tenantId },
    });

    // Create Draft Invoice from Quote line items
    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        clientId: quote.clientId,
        fiscalYear,
        issueDate: today,
        status: "DRAFT",
        paymentStatus: "UNPAID",
        currency: quote.currency,
        total: quote.total,
        vatExemptionNote:
          quote.vatExemptionNote ||
          profile?.vatExemptionNote ||
          "Exonéré de la TVA en vertu de la loi n° 22-23 relative au statut de l'auto-entrepreneur et du Code des Impôts Directs.",
        notes: quote.notes ? `${quote.notes}\n(Issu du Devis ${quote.quoteNumber || "N° " + quote.id.slice(0, 8)})` : `Issu du Devis ${quote.quoteNumber || "N° " + quote.id.slice(0, 8)}`,
        showDetailedItems: quote.showDetailedItems,
        sourceQuoteId: quote.id,
        lineItems: {
          create: quote.lineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            currency: item.currency,
            position: index,
          })),
        },
      },
      include: {
        client: true,
        lineItems: true,
      },
    });

    // Mark quote as CONVERTED
    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
      },
    });

    return invoice;
  });
}

/**
 * Deletes a draft quote.
 */
export async function deleteDraftQuote(tenantId: string, quoteId: string) {
  const quote = await db.quote.findFirst({
    where: { id: quoteId, tenantId },
  });

  if (!quote) throw new Error("Devis introuvable.");
  if (quote.status !== "DRAFT") {
    throw new Error("Seuls les devis en mode brouillon peuvent être supprimés.");
  }

  return db.quote.delete({
    where: { id: quoteId },
  });
}
