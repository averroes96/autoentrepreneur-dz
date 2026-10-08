import { db } from "./db";
import { Prisma } from "@prisma/client";

export interface LineItemInput {
  description: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface CreateInvoiceInput {
  tenantId: string;
  clientId: string;
  issueDate: Date;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems: LineItemInput[];
}

/**
 * Creates a new Draft invoice.
 * No sequential invoice number is allocated while in Draft, preserving gapless numbering.
 */
export async function createDraftInvoice(data: CreateInvoiceInput) {
  const fiscalYear = data.issueDate.getFullYear();

  // Fetch tenant profile for default VAT exemption note and currency
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

  return db.invoice.create({
    data: {
      tenantId: data.tenantId,
      clientId: data.clientId,
      fiscalYear,
      issueDate: data.issueDate,
      status: "DRAFT",
      paymentStatus: "UNPAID",
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
 * Updates a Draft invoice. Only drafts can be modified.
 */
export async function updateDraftInvoice(
  tenantId: string,
  invoiceId: string,
  data: {
    clientId?: string;
    issueDate?: Date;
    notes?: string;
    showDetailedItems?: boolean;
    lineItems?: LineItemInput[];
  }
) {
  const existing = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!existing) {
    throw new Error("Facture introuvable.");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Une facture émise est immuable et ne peut pas être modifiée.");
  }

  return db.$transaction(async (tx) => {
    let newTotal = existing.total;
    let fiscalYear = existing.fiscalYear;

    if (data.issueDate) {
      fiscalYear = data.issueDate.getFullYear();
    }

    if (data.lineItems) {
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId },
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
          invoiceId,
          description: item.description,
          quantity: qty,
          unitPrice: unit,
          totalPrice: total,
          currency: existing.currency,
          position: index,
        };
      });

      newTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await tx.invoiceLineItem.createMany({
        data: normalizedItems,
      });
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.issueDate && { issueDate: data.issueDate, fiscalYear }),
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
 * Issues an invoice atomically:
 * - Allocates the next consecutive sequential invoice number (e.g. FAC-2026-0001)
 * - Captures snapshots of seller and client
 * - Locks the invoice into ISSUED status (immutable)
 */
export async function issueInvoice(tenantId: string, invoiceId: string) {
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { client: true, lineItems: true },
    });

    if (!invoice) {
      throw new Error("Facture introuvable.");
    }

    if (invoice.status !== "DRAFT") {
      throw new Error("Cette facture a déjà été émise ou annulée.");
    }

    if (invoice.lineItems.length === 0) {
      throw new Error("Une facture doit comporter au moins une ligne de prestation.");
    }

    const profile = await tx.autoEntrepreneurProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      throw new Error("Veuillez d'abord compléter votre profil auto-entrepreneur.");
    }

    // Atomic sequential number generation for this tenant and fiscal year
    const year = invoice.fiscalYear;
    let seqRecord = await tx.invoiceSequence.findUnique({
      where: {
        tenantId_fiscalYear: {
          tenantId,
          fiscalYear: year,
        },
      },
    });

    if (!seqRecord) {
      seqRecord = await tx.invoiceSequence.create({
        data: {
          tenantId,
          fiscalYear: year,
          lastSequence: 1,
        },
      });
    } else {
      seqRecord = await tx.invoiceSequence.update({
        where: { id: seqRecord.id },
        data: {
          lastSequence: { increment: 1 },
        },
      });
    }

    const nextSeq = seqRecord.lastSequence;
    const prefix = (profile.invoicePrefix || "FAC").trim().toUpperCase();
    const formattedSeq = String(nextSeq).padStart(4, "0");
    const invoiceNumber = `${prefix}-${year}-${formattedSeq}`;

    // Snapshots to ensure legal immutability regardless of future client/profile edits
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
      name: invoice.client.name,
      clientType: invoice.client.clientType,
      address: invoice.client.address,
      nif: invoice.client.nif,
      nis: invoice.client.nis,
      rc: invoice.client.rc,
      email: invoice.client.email,
      phone: invoice.client.phone,
    };

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "ISSUED",
        invoiceNumber,
        sequenceNumber: nextSeq,
        sellerSnapshot: JSON.stringify(sellerSnapshot),
        clientSnapshot: JSON.stringify(clientSnapshot),
        issuedAt: new Date(),
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

export interface PaymentDetailsInput {
  paidAt?: Date;
  paymentMethod?: string; // CASH, BANK_TRANSFER, CCP_BARIDIMOB, CHEQUE
  paymentReference?: string;
}

/**
 * Toggles payment status between PAID and UNPAID for an issued invoice.
 * Generates official Payment Receipt reference (REC-YYYY-XXXX) and records payment details.
 */
export async function toggleInvoicePayment(
  tenantId: string,
  invoiceId: string,
  paid: boolean,
  paymentDetails?: PaymentDetailsInput | Date
) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!invoice) throw new Error("Facture introuvable.");
  if (invoice.status === "DRAFT") throw new Error("Une facture brouillon ne peut pas être payée.");
  if (invoice.status === "CANCELLED") throw new Error("Une facture annulée ne peut pas être payée.");

  if (!paid) {
    return db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: "UNPAID",
        paidAt: null,
        paymentMethod: null,
        paymentReference: null,
        receiptNumber: null,
      },
    });
  }

  const isDate = paymentDetails instanceof Date;
  const paidAt = isDate ? paymentDetails : paymentDetails?.paidAt || new Date();
  const paymentMethod = isDate ? "BANK_TRANSFER" : paymentDetails?.paymentMethod || "BANK_TRANSFER";
  const paymentReference = isDate ? undefined : paymentDetails?.paymentReference;

  // Generate official receipt reference matching the sequential invoice (e.g. REC-2026-0042)
  const receiptNumber =
    invoice.receiptNumber ||
    (invoice.invoiceNumber
      ? invoice.invoiceNumber.replace(/^FAC-/, "REC-")
      : `REC-${invoice.fiscalYear}-${String(invoice.sequenceNumber || 1).padStart(4, "0")}`);

  return db.invoice.update({
    where: { id: invoiceId },
    data: {
      paymentStatus: "PAID",
      paidAt,
      paymentMethod,
      paymentReference: paymentReference?.trim() || null,
      receiptNumber,
    },
  });
}

/**
 * Cancels an issued invoice.
 * Preserves the record and sequential number in compliance with anti-tampering rules,
 * but zeroes its contribution to turnover and sets the cancellation reason.
 */
export async function cancelInvoice(
  tenantId: string,
  invoiceId: string,
  reason: string
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error("Un motif d'annulation est obligatoire.");
  }

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!invoice) throw new Error("Facture introuvable.");
  if (invoice.status === "CANCELLED") throw new Error("Cette facture est déjà annulée.");
  if (invoice.status === "DRAFT") {
    // Drafts can be deleted directly
    return db.invoice.delete({ where: { id: invoiceId } });
  }

  return db.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "CANCELLED",
      paymentStatus: "UNPAID",
      paidAt: null,
      cancellationReason: reason.trim(),
    },
  });
}

/**
 * Deletes a draft invoice.
 * Note: Only drafts can be deleted; issued invoices are permanent and can only be cancelled.
 */
export async function deleteDraftInvoice(tenantId: string, invoiceId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!invoice) throw new Error("Facture introuvable.");
  if (invoice.status !== "DRAFT") {
    throw new Error("Seules les factures en brouillon peuvent être supprimées. Pour une facture émise, utilisez l'annulation.");
  }

  return db.invoice.delete({
    where: { id: invoiceId },
  });
}
