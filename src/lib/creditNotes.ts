import { db } from "./db";

export interface CreditNoteLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface CreateCreditNoteInput {
  tenantId: string;
  originalInvoiceId: string;
  reason: string;
  issueDate?: Date;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems?: CreditNoteLineItemInput[];
}

/**
 * Creates and immediately issues an official Credit Note (Facture d'Avoir) for an issued invoice.
 * - Enforces Law 22-23 accounting trace: references original invoice
 * - Allocates atomic gapless sequential number (e.g. AVR-2026-0001)
 * - Freezes legal snapshots
 */
export async function createCreditNoteFromInvoice(data: CreateCreditNoteInput) {
  if (!data.reason || data.reason.trim().length === 0) {
    throw new Error("Le motif de l'avoir est obligatoire conformément aux règles comptables.");
  }

  const issueDate = data.issueDate || new Date();
  const fiscalYear = issueDate.getFullYear();

  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: data.originalInvoiceId, tenantId: data.tenantId },
      include: {
        client: true,
        lineItems: { orderBy: { position: "asc" } },
      },
    });

    if (!invoice) throw new Error("Facture d'origine introuvable.");
    if (invoice.status !== "ISSUED") {
      throw new Error("Un avoir ne peut être établi que pour une facture émise (validée).");
    }

    const profile = await tx.autoEntrepreneurProfile.findUnique({
      where: { tenantId: data.tenantId },
    });

    if (!profile) throw new Error("Profil introuvable.");

    // If custom line items were provided, use them; otherwise duplicate 100% of the invoice items
    const rawItems = data.lineItems && data.lineItems.length > 0
      ? data.lineItems
      : invoice.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }));

    const normalizedItems = rawItems.map((item, index) => {
      const qty = item.quantity > 0 ? item.quantity : 1;
      const unit = item.unitPrice >= 0 ? item.unitPrice : 0;
      const total = item.totalPrice !== undefined && item.totalPrice >= 0 ? item.totalPrice : qty * unit;

      return {
        description: item.description,
        quantity: qty,
        unitPrice: unit,
        totalPrice: total,
        currency: invoice.currency,
        position: index,
      };
    });

    const total = normalizedItems.reduce((sum, i) => sum + i.totalPrice, 0);

    if (total <= 0) {
      throw new Error("Le montant total de l'avoir doit être supérieur à 0 DZD.");
    }

    // Atomic sequential number generation for Credit Notes
    let seqRecord = await tx.creditNoteSequence.findUnique({
      where: {
        tenantId_fiscalYear: {
          tenantId: data.tenantId,
          fiscalYear,
        },
      },
    });

    if (!seqRecord) {
      seqRecord = await tx.creditNoteSequence.create({
        data: {
          tenantId: data.tenantId,
          fiscalYear,
          lastSequence: 1,
        },
      });
    } else {
      seqRecord = await tx.creditNoteSequence.update({
        where: { id: seqRecord.id },
        data: {
          lastSequence: { increment: 1 },
        },
      });
    }

    const nextSeq = seqRecord.lastSequence;
    const prefix = (profile.creditNotePrefix || "AVR").trim().toUpperCase();
    const formattedSeq = String(nextSeq).padStart(4, "0");
    const creditNoteNumber = `${prefix}-${fiscalYear}-${formattedSeq}`;

    // Snapshots
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

    const creditNote = await tx.creditNote.create({
      data: {
        tenantId: data.tenantId,
        clientId: invoice.clientId,
        originalInvoiceId: invoice.id,
        creditNoteNumber,
        sequenceNumber: nextSeq,
        fiscalYear,
        status: "ISSUED",
        refundStatus: "PENDING",
        issueDate,
        issuedAt: new Date(),
        reason: data.reason.trim(),
        currency: invoice.currency,
        total,
        notes: data.notes,
        vatExemptionNote: invoice.vatExemptionNote || profile.vatExemptionNote,
        sellerSnapshot: JSON.stringify(sellerSnapshot),
        clientSnapshot: JSON.stringify(clientSnapshot),
        showDetailedItems: data.showDetailedItems ?? invoice.showDetailedItems,
        lineItems: {
          create: normalizedItems,
        },
      },
      include: {
        client: true,
        originalInvoice: true,
        lineItems: {
          orderBy: { position: "asc" },
        },
      },
    });

    return creditNote;
  });
}

/**
 * Toggles whether this credit note has been paid back / refunded to client.
 */
export async function toggleCreditNoteRefundStatus(
  tenantId: string,
  creditNoteId: string,
  refunded: boolean
) {
  const creditNote = await db.creditNote.findFirst({
    where: { id: creditNoteId, tenantId },
  });

  if (!creditNote) throw new Error("Avoir introuvable.");

  return db.creditNote.update({
    where: { id: creditNoteId },
    data: {
      refundStatus: refunded ? "REFUNDED" : "PENDING",
      refundedAt: refunded ? new Date() : null,
    },
  });
}
