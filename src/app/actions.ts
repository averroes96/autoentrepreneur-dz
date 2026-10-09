"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  createDraftInvoice,
  updateDraftInvoice,
  issueInvoice,
  toggleInvoicePayment,
  cancelInvoice,
  deleteDraftInvoice,
} from "@/lib/invoicing";
import {
  createDraftQuote,
  updateDraftQuote,
  finalizeAndSendQuote,
  updateQuoteStatus,
  convertQuoteToInvoice,
  deleteDraftQuote,
} from "@/lib/quotes";
import {
  createCreditNoteFromInvoice,
  toggleCreditNoteRefundStatus,
} from "@/lib/creditNotes";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import {
  generateInvoicePdfBuffer,
  generateQuotePdfBuffer,
  generateCreditNotePdfBuffer,
} from "@/lib/pdfGenerator";
import {
  sendInvoiceEmail,
  sendPaymentReceiptEmail,
  sendQuoteEmail,
  sendCreditNoteEmail,
} from "@/lib/email";
import { persistInvoicePdf } from "@/lib/storage";
import { captureException } from "@/lib/sentry";
import { validateAlgerianNif } from "@/lib/nifValidator";
import { calculateDzdEquivalent } from "@/lib/currencies";
import { cookies } from "next/headers";
import {
  createAccountantAccess,
  revokeAccountantAccess,
  deleteAccountantAccess,
  verifyAccountantPin,
} from "@/lib/accountantAccess";
import {
  inspectVaultBuffer,
  restoreVaultData,
} from "@/lib/vault";

/* =========================================================================
   AUTHENTICATION ACTIONS
========================================================================= */

export async function signupAction(formData: FormData) {
  try {
    const businessName = (formData.get("businessName") as string)?.trim();
    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const rnaeNumber = (formData.get("rnaeNumber") as string)?.trim() || "";
    const nif = (formData.get("nif") as string)?.trim() || "";

    if (!businessName || !fullName || !email || !password) {
      return { error: "Veuillez remplir tous les champs obligatoires." };
    }

    if (nif) {
      const nifCheck = validateAlgerianNif(nif);
      if (!nifCheck.isValid) {
        return { error: `Numéro d'Identification Fiscale (NIF) invalide : ${nifCheck.error}` };
      }
    }

    if (password.length < 6) {
      return { error: "Le mot de passe doit contenir au moins 6 caractères." };
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Un compte existe déjà avec cette adresse email." };
    }

    const passwordHash = await hashPassword(password);

    // Multi-tenant creation: 1 Tenant, 1 Admin User, 1 Profile
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          fullName,
          role: "ADMIN",
        },
      });

      const profile = await tx.autoEntrepreneurProfile.create({
        data: {
          tenantId: tenant.id,
          fullName,
          rnaeNumber,
          nif,
          address: "",
          email,
          phone: "",
          activityCode: "",
          activityLabel: "",
          defaultCurrency: "DZD",
          cardValidityYears: REGULATORY_CONFIG.card.validityYears,
          casnosStatus: "AFFILIATED",
          casnosScheme: "FLAT_24000",
          vatExemptionNote: REGULATORY_CONFIG.defaultVatExemptionNote,
          invoicePrefix: "FAC",
        },
      });

      return { tenant, user, profile };
    });

    await createSession({
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.user.role,
    });

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "signupAction" });
    return { error: err.message || "Erreur lors de la création du compte." };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email et mot de passe requis." };
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      return { error: "Identifiants invalides." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: "Identifiants invalides." };
    }

    await createSession({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "loginAction" });
    return { error: err.message || "Erreur de connexion." };
  }
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/* =========================================================================
   PROFILE ACTIONS
========================================================================= */

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  const fullName = (formData.get("fullName") as string)?.trim();
  const rnaeNumber = (formData.get("rnaeNumber") as string)?.trim();
  const nif = (formData.get("nif") as string)?.trim();
  if (nif) {
    const nifCheck = validateAlgerianNif(nif);
    if (!nifCheck.isValid) {
      return { error: `Numéro d'Identification Fiscale (NIF) invalide : ${nifCheck.error}` };
    }
  }
  const address = (formData.get("address") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim() || session.email;
  const activityCode = (formData.get("activityCode") as string)?.trim() || "";
  const activityLabel = (formData.get("activityLabel") as string)?.trim() || "";
  const invoicePrefix = (formData.get("invoicePrefix") as string)?.trim().toUpperCase() || "FAC";
  const quotePrefix = (formData.get("quotePrefix") as string)?.trim().toUpperCase() || "DEV";
  const creditNotePrefix = (formData.get("creditNotePrefix") as string)?.trim().toUpperCase() || "AVR";
  const vatExemptionNote = (formData.get("vatExemptionNote") as string)?.trim() || REGULATORY_CONFIG.defaultVatExemptionNote;
  const casnosStatus = (formData.get("casnosStatus") as string) || "AFFILIATED";
  const casnosScheme = (formData.get("casnosScheme") as string) || "FLAT_24000";

  const cardIssueDateRaw = formData.get("cardIssueDate") as string;
  const cardIssueDate = cardIssueDateRaw ? new Date(cardIssueDateRaw) : null;

  const activityStartDateRaw = formData.get("activityStartDate") as string;
  const activityStartDate = activityStartDateRaw ? new Date(activityStartDateRaw) : null;

  await db.autoEntrepreneurProfile.upsert({
    where: { tenantId: session.tenantId },
    update: {
      fullName,
      rnaeNumber,
      nif,
      address,
      phone,
      email,
      activityCode,
      activityLabel,
      invoicePrefix,
      quotePrefix,
      creditNotePrefix,
      vatExemptionNote,
      casnosStatus,
      casnosScheme,
      cardIssueDate,
      activityStartDate,
    },
    create: {
      tenantId: session.tenantId,
      fullName,
      rnaeNumber,
      nif,
      address,
      phone,
      email,
      activityCode,
      activityLabel,
      invoicePrefix,
      quotePrefix,
      creditNotePrefix,
      vatExemptionNote,
      casnosStatus,
      casnosScheme,
      cardIssueDate,
      activityStartDate,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/invoices");

  return { success: true };
}

export async function savePastTurnoverAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  const fiscalYear = parseInt(formData.get("fiscalYear") as string, 10);
  const turnoverDzd = parseFloat(formData.get("turnoverDzd") as string);

  if (isNaN(fiscalYear) || isNaN(turnoverDzd)) {
    return { error: "Données invalides." };
  }

  await db.pastTurnover.upsert({
    where: {
      tenantId_fiscalYear: {
        tenantId: session.tenantId,
        fiscalYear,
      },
    },
    update: {
      turnoverDzd,
    },
    create: {
      tenantId: session.tenantId,
      fiscalYear,
      turnoverDzd,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true };
}

/* =========================================================================
   CLIENT ACTIONS
========================================================================= */

export async function createClientAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  const name = (formData.get("name") as string)?.trim();
  const clientType = (formData.get("clientType") as string) || "PROFESSIONAL";
  const address = (formData.get("address") as string)?.trim() || "";
  const nif = (formData.get("nif") as string)?.trim() || null;
  const nis = (formData.get("nis") as string)?.trim() || null;
  const rc = (formData.get("rc") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name) {
    return { error: "Le nom du client est requis." };
  }

  const client = await db.client.create({
    data: {
      tenantId: session.tenantId,
      name,
      clientType,
      address,
      nif,
      nis,
      rc,
      email,
      phone,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { success: true, client };
}

export async function updateClientAction(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  const name = (formData.get("name") as string)?.trim();
  const clientType = (formData.get("clientType") as string) || "PROFESSIONAL";
  const address = (formData.get("address") as string)?.trim() || "";
  const nif = (formData.get("nif") as string)?.trim() || null;
  const nis = (formData.get("nis") as string)?.trim() || null;
  const rc = (formData.get("rc") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name) {
    return { error: "Le nom du client est requis." };
  }

  await db.client.update({
    where: { id, tenantId: session.tenantId },
    data: {
      name,
      clientType,
      address,
      nif,
      nis,
      rc,
      email,
      phone,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { success: true };
}

export async function toggleArchiveClientAction(id: string, isArchived: boolean) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  await db.client.update({
    where: { id, tenantId: session.tenantId },
    data: { isArchived },
  });

  revalidatePath("/", "layout");
  revalidatePath("/clients");
  revalidatePath("/invoices/new");
  return { success: true };
}

/* =========================================================================
   INVOICE ACTIONS
========================================================================= */

export async function createInvoiceAction(payload: {
  clientId: string;
  issueDate: string;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  if (!payload.clientId) return { error: "Veuillez sélectionner un client." };
  if (!payload.lineItems || payload.lineItems.length === 0) {
    return { error: "Veuillez ajouter au moins une prestation." };
  }

  try {
    const invoice = await createDraftInvoice({
      tenantId: session.tenantId,
      clientId: payload.clientId,
      issueDate: new Date(payload.issueDate || new Date()),
      currency: payload.currency,
      exchangeRate: payload.exchangeRate,
      notes: payload.notes,
      showDetailedItems: payload.showDetailedItems ?? false,
      lineItems: payload.lineItems,
    });

    revalidatePath("/", "layout");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, invoiceId: invoice.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  payload: {
    clientId: string;
    issueDate: string;
    currency?: string;
    exchangeRate?: number;
    notes?: string;
    showDetailedItems?: boolean;
    lineItems: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  }
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await updateDraftInvoice(session.tenantId, invoiceId, {
      clientId: payload.clientId,
      issueDate: new Date(payload.issueDate),
      currency: payload.currency,
      exchangeRate: payload.exchangeRate,
      notes: payload.notes,
      showDetailedItems: payload.showDetailedItems,
      lineItems: payload.lineItems,
    });

    revalidatePath("/", "layout");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function issueInvoiceAction(invoiceId: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const issued = await issueInvoice(session.tenantId, invoiceId);
    revalidatePath("/", "layout");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, invoiceNumber: issued.invoiceNumber };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleInvoicePaymentAction(
  invoiceId: string,
  paid: boolean,
  paymentDetails?: {
    paidAt?: string | Date;
    paymentMethod?: string;
    paymentReference?: string;
  }
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const details = paymentDetails
      ? {
          paidAt: paymentDetails.paidAt ? new Date(paymentDetails.paidAt) : new Date(),
          paymentMethod: paymentDetails.paymentMethod,
          paymentReference: paymentDetails.paymentReference,
        }
      : undefined;

    await toggleInvoicePayment(session.tenantId, invoiceId, paid, details);
    revalidatePath("/", "layout");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath("/clients");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function cancelInvoiceAction(invoiceId: string, reason: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await cancelInvoice(session.tenantId, invoiceId, reason);
    revalidatePath("/", "layout");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await deleteDraftInvoice(session.tenantId, invoiceId);
    revalidatePath("/", "layout");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function emailInvoiceAction(invoiceId: string, recipientEmail?: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, tenantId: session.tenantId },
      include: {
        client: true,
        lineItems: { orderBy: { position: "asc" } },
      },
    });

    if (!invoice) return { error: "Facture introuvable." };
    if (invoice.status === "DRAFT") {
      return { error: "Veuillez émettre la facture avant de l'envoyer par email." };
    }

    const targetEmail = recipientEmail?.trim() || invoice.client.email?.trim();
    if (!targetEmail) {
      return { error: "Veuillez renseigner l'adresse email du client." };
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) return { error: "Profil d'auto-entrepreneur introuvable." };

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoice,
      seller: {
        fullName: profile.fullName,
        rnaeNumber: profile.rnaeNumber,
        nif: profile.nif,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        activityCode: profile.activityCode,
        activityLabel: profile.activityLabel,
      },
      client: invoice.client,
    });

    // Backup to cloud storage (Cloudflare R2 or Supabase Storage) asynchronously
    persistInvoicePdf({
      tenantId: session.tenantId,
      invoiceNumber: invoice.invoiceNumber || invoice.id,
      pdfBuffer,
    }).catch((storageErr) => {
      captureException(storageErr, { context: "persistInvoicePdfBackground" });
    });

    // Send email with PDF attachment via Resend
    const result = await sendInvoiceEmail({
      to: targetEmail,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber || "BROUILLON",
      totalAmount: invoice.total,
      currency: invoice.currency,
      pdfBuffer,
      notes: invoice.notes,
      sellerName: profile.fullName,
      sellerEmail: profile.email,
    });

    if (!result.success) {
      return { error: result.error || "Erreur lors de l'envoi de l'email." };
    }

    return {
      success: true,
      recipient: targetEmail,
      mocked: (result as any).mocked,
    };
  } catch (err: any) {
    captureException(err, { action: "emailInvoiceAction", invoiceId });
    return { error: err.message || "Erreur interne lors de l'envoi." };
  }
}

/* =========================================================================
   QUOTE (DEVIS) ACTIONS
========================================================================= */

export async function createQuoteAction(payload: {
  clientId: string;
  issueDate: string;
  validUntil?: string | null;
  currency?: string;
  exchangeRate?: number;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  if (!payload.clientId) return { error: "Veuillez sélectionner un client." };
  if (!payload.lineItems || payload.lineItems.length === 0) {
    return { error: "Veuillez ajouter au moins une prestation." };
  }

  try {
    const quote = await createDraftQuote({
      tenantId: session.tenantId,
      clientId: payload.clientId,
      issueDate: new Date(payload.issueDate),
      validUntil: payload.validUntil ? new Date(payload.validUntil) : null,
      currency: payload.currency,
      exchangeRate: payload.exchangeRate,
      notes: payload.notes,
      showDetailedItems: payload.showDetailedItems,
      lineItems: payload.lineItems,
    });

    revalidatePath("/", "layout");
    revalidatePath("/quotes");
    revalidatePath("/dashboard");

    return { success: true, quoteId: quote.id };
  } catch (err: any) {
    captureException(err, { action: "createQuoteAction" });
    return { error: err.message || "Erreur lors de la création du devis." };
  }
}

export async function updateQuoteAction(
  quoteId: string,
  payload: {
    clientId?: string;
    issueDate?: string;
    validUntil?: string | null;
    currency?: string;
    exchangeRate?: number;
    notes?: string;
    showDetailedItems?: boolean;
    lineItems?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
    }>;
  }
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await updateDraftQuote(session.tenantId, quoteId, {
      clientId: payload.clientId,
      issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
      validUntil: payload.validUntil !== undefined ? (payload.validUntil ? new Date(payload.validUntil) : null) : undefined,
      currency: payload.currency,
      exchangeRate: payload.exchangeRate,
      notes: payload.notes,
      showDetailedItems: payload.showDetailedItems,
      lineItems: payload.lineItems,
    });

    revalidatePath("/", "layout");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "updateQuoteAction", quoteId });
    return { error: err.message || "Erreur lors de la modification du devis." };
  }
}

export async function finalizeAndSendQuoteAction(quoteId: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const quote = await finalizeAndSendQuote(session.tenantId, quoteId);

    revalidatePath("/", "layout");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/dashboard");

    return { success: true, quoteNumber: quote.quoteNumber };
  } catch (err: any) {
    captureException(err, { action: "finalizeAndSendQuoteAction", quoteId });
    return { error: err.message || "Erreur lors de la finalisation du devis." };
  }
}

export async function updateQuoteStatusAction(
  quoteId: string,
  status: "ACCEPTED" | "REJECTED"
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await updateQuoteStatus(session.tenantId, quoteId, status);

    revalidatePath("/", "layout");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "updateQuoteStatusAction", quoteId, status });
    return { error: err.message || "Erreur lors de la mise à jour du statut." };
  }
}

export async function convertQuoteToInvoiceAction(quoteId: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const invoice = await convertQuoteToInvoice(session.tenantId, quoteId);

    revalidatePath("/", "layout");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true, invoiceId: invoice.id };
  } catch (err: any) {
    captureException(err, { action: "convertQuoteToInvoiceAction", quoteId });
    return { error: err.message || "Erreur lors de la conversion en facture." };
  }
}

export async function deleteQuoteAction(quoteId: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await deleteDraftQuote(session.tenantId, quoteId);

    revalidatePath("/", "layout");
    revalidatePath("/quotes");

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "deleteQuoteAction", quoteId });
    return { error: err.message || "Erreur lors de la suppression." };
  }
}

export async function emailQuoteAction(quoteId: string, recipientEmail?: string) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const quote = await db.quote.findFirst({
      where: { id: quoteId, tenantId: session.tenantId },
      include: {
        client: true,
        lineItems: { orderBy: { position: "asc" } },
      },
    });

    if (!quote) return { error: "Devis introuvable." };

    const targetEmail = recipientEmail?.trim() || quote.client.email?.trim();
    if (!targetEmail) {
      return { error: "Veuillez renseigner l'adresse email du client." };
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) return { error: "Profil non configuré." };

    const pdfBuffer = await generateQuotePdfBuffer({
      quote,
      seller: {
        fullName: profile.fullName,
        rnaeNumber: profile.rnaeNumber,
        nif: profile.nif,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        activityCode: profile.activityCode,
        activityLabel: profile.activityLabel,
      },
      client: quote.client,
    });

    const result = await sendQuoteEmail({
      to: targetEmail,
      clientName: quote.client.name,
      quoteNumber: quote.quoteNumber || "BROUILLON",
      totalAmount: quote.total,
      currency: quote.currency,
      pdfBuffer,
      validUntil: quote.validUntil,
      notes: quote.notes,
      sellerName: profile.fullName,
      sellerEmail: profile.email,
    });

    if (!result.success) {
      return { error: result.error || "Erreur lors de l'envoi de l'email." };
    }

    return {
      success: true,
      recipient: targetEmail,
      mocked: (result as any).mocked,
    };
  } catch (err: any) {
    captureException(err, { action: "emailQuoteAction", quoteId });
    return { error: err.message || "Erreur interne lors de l'envoi." };
  }
}

/* =========================================================================
   CREDIT NOTE (AVOIR) ACTIONS
========================================================================= */

export async function createCreditNoteAction(payload: {
  originalInvoiceId: string;
  reason: string;
  issueDate?: string;
  notes?: string;
  showDetailedItems?: boolean;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
}) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  if (!payload.reason || payload.reason.trim().length === 0) {
    return { error: "Le motif de l'avoir est obligatoire." };
  }

  try {
    const creditNote = await createCreditNoteFromInvoice({
      tenantId: session.tenantId,
      originalInvoiceId: payload.originalInvoiceId,
      reason: payload.reason,
      issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
      notes: payload.notes,
      showDetailedItems: payload.showDetailedItems,
      lineItems: payload.lineItems,
    });

    revalidatePath("/", "layout");
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${payload.originalInvoiceId}`);
    revalidatePath("/credit-notes");
    revalidatePath("/dashboard");

    return { success: true, creditNoteId: creditNote.id, creditNoteNumber: creditNote.creditNoteNumber };
  } catch (err: any) {
    captureException(err, { action: "createCreditNoteAction" });
    return { error: err.message || "Erreur lors de la création de l'avoir." };
  }
}

export async function toggleCreditNoteRefundAction(
  creditNoteId: string,
  refunded: boolean
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    await toggleCreditNoteRefundStatus(session.tenantId, creditNoteId, refunded);

    revalidatePath("/", "layout");
    revalidatePath("/credit-notes");
    revalidatePath(`/credit-notes/${creditNoteId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "toggleCreditNoteRefundAction", creditNoteId });
    return { error: err.message || "Erreur lors de la mise à jour du statut." };
  }
}

export async function emailCreditNoteAction(
  creditNoteId: string,
  recipientEmail?: string
) {
  const session = await getSession();
  if (!session) return { error: "Non autorisé." };

  try {
    const creditNote = await db.creditNote.findFirst({
      where: { id: creditNoteId, tenantId: session.tenantId },
      include: {
        client: true,
        originalInvoice: true,
        lineItems: { orderBy: { position: "asc" } },
      },
    });

    if (!creditNote) return { error: "Avoir introuvable." };

    const targetEmail = recipientEmail?.trim() || creditNote.client.email?.trim();
    if (!targetEmail) {
      return { error: "Veuillez renseigner l'adresse email du client." };
    }

    const profile = await db.autoEntrepreneurProfile.findUnique({
      where: { tenantId: session.tenantId },
    });

    if (!profile) return { error: "Profil non configuré." };

    const pdfBuffer = await generateCreditNotePdfBuffer({
      creditNote: {
        ...creditNote,
        originalInvoiceNumber: creditNote.originalInvoice.invoiceNumber,
      },
      seller: {
        fullName: profile.fullName,
        rnaeNumber: profile.rnaeNumber,
        nif: profile.nif,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        activityCode: profile.activityCode,
        activityLabel: profile.activityLabel,
      },
      client: creditNote.client,
    });

    const result = await sendCreditNoteEmail({
      to: targetEmail,
      clientName: creditNote.client.name,
      creditNoteNumber: creditNote.creditNoteNumber || "BROUILLON",
      originalInvoiceNumber: creditNote.originalInvoice.invoiceNumber || "—",
      totalAmount: creditNote.total,
      currency: creditNote.currency,
      pdfBuffer,
      reason: creditNote.reason,
      notes: creditNote.notes,
      sellerName: profile.fullName,
      sellerEmail: profile.email,
    });

    if (!result.success) {
      return { error: result.error || "Erreur lors de l'envoi de l'email." };
    }

    return {
      success: true,
      recipient: targetEmail,
      mocked: (result as any).mocked,
    };
  } catch (err: any) {
    captureException(err, { action: "emailCreditNoteAction", creditNoteId });
    return { error: err.message || "Erreur interne lors de l'envoi." };
  }
}

/* =========================================================================
   EXPENSE ACTIONS (PHASE 3 - LIGHTWEIGHT EXPENSE & NET PROFIT TRACKING)
========================================================================= */

export async function createExpenseAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    const title = (formData.get("title") as string)?.trim();
    const rawAmount = formData.get("amount") as string;
    const rawDate = formData.get("date") as string;
    const category = (formData.get("category") as string)?.trim() || "OTHER";
    const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || "OTHER";
    const supplier = (formData.get("supplier") as string)?.trim() || null;
    const invoiceNumber = (formData.get("invoiceNumber") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const receiptUrl = (formData.get("receiptUrl") as string)?.trim() || null;
    const rawCurrency = (formData.get("currency") as string)?.trim() || "DZD";
    const rawExchangeRate = parseFloat((formData.get("exchangeRate") as string) || "1");

    if (!title) {
      return { error: "Le titre de la dépense est requis." };
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "Veuillez saisir un montant valide (supérieur à 0)." };
    }

    const currency = rawCurrency.toUpperCase();
    const exchangeRate = !isNaN(rawExchangeRate) && rawExchangeRate > 0 ? rawExchangeRate : 1.0;
    const amountDzd = calculateDzdEquivalent(amount, currency, exchangeRate);

    const date = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(date.getTime())) {
      return { error: "Date invalide." };
    }
    const fiscalYear = date.getFullYear();

    const expense = await db.expense.create({
      data: {
        tenantId: session.tenantId,
        title,
        amount,
        currency,
        exchangeRate,
        amountDzd,
        date,
        fiscalYear,
        category,
        paymentMethod,
        supplier,
        invoiceNumber,
        receiptUrl,
        notes,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true, expenseId: expense.id };
  } catch (err: any) {
    captureException(err, { action: "createExpenseAction" });
    return { error: err.message || "Erreur lors de l'enregistrement de la dépense." };
  }
}

export async function updateExpenseAction(id: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    const title = (formData.get("title") as string)?.trim();
    const rawAmount = formData.get("amount") as string;
    const rawDate = formData.get("date") as string;
    const category = (formData.get("category") as string)?.trim() || "OTHER";
    const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || "OTHER";
    const supplier = (formData.get("supplier") as string)?.trim() || null;
    const invoiceNumber = (formData.get("invoiceNumber") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const receiptUrl = (formData.get("receiptUrl") as string)?.trim() || null;

    if (!title) {
      return { error: "Le titre de la dépense est requis." };
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      return { error: "Veuillez saisir un montant valide (supérieur à 0)." };
    }

    const date = rawDate ? new Date(rawDate) : new Date();
    if (isNaN(date.getTime())) {
      return { error: "Date invalide." };
    }
    const fiscalYear = date.getFullYear();

    const existing = await db.expense.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) {
      return { error: "Dépense introuvable." };
    }

    const rawCurrency = (formData.get("currency") as string)?.trim() || existing.currency || "DZD";
    const rawExchangeRate = parseFloat((formData.get("exchangeRate") as string) || String(existing.exchangeRate || 1));
    const currency = rawCurrency.toUpperCase();
    const exchangeRate = !isNaN(rawExchangeRate) && rawExchangeRate > 0 ? rawExchangeRate : 1.0;
    const amountDzd = calculateDzdEquivalent(amount, currency, exchangeRate);

    await db.expense.update({
      where: { id },
      data: {
        title,
        amount,
        currency,
        exchangeRate,
        amountDzd,
        date,
        fiscalYear,
        category,
        paymentMethod,
        supplier,
        invoiceNumber,
        receiptUrl,
        notes,
      },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "updateExpenseAction", expenseId: id });
    return { error: err.message || "Erreur lors de la mise à jour de la dépense." };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    const existing = await db.expense.findFirst({
      where: { id, tenantId: session.tenantId },
    });
    if (!existing) {
      return { error: "Dépense introuvable." };
    }

    await db.expense.delete({
      where: { id },
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "deleteExpenseAction", expenseId: id });
    return { error: err.message || "Erreur lors de la suppression de la dépense." };
  }
}

/* =========================================================================
   ACCOUNTANT AUDIT ACCESS ACTIONS
========================================================================= */

export async function createAccountantAccessAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const rawFiscalYear = formData.get("fiscalYear") as string;
    const pin = (formData.get("pin") as string)?.trim() || null;
    const rawDuration = formData.get("durationDays") as string;
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!name) {
      return { error: "Le nom ou raison sociale de l'expert-comptable est requis." };
    }

    if (pin && (pin.length < 4 || pin.length > 12)) {
      return { error: "Le code PIN doit comporter entre 4 et 12 caractères." };
    }

    const fiscalYear = rawFiscalYear && rawFiscalYear !== "ALL" ? parseInt(rawFiscalYear, 10) : null;
    const expiresInDays = rawDuration && rawDuration !== "NEVER" ? parseInt(rawDuration, 10) : null;

    const access = await createAccountantAccess({
      tenantId: session.tenantId,
      name,
      email,
      fiscalYear,
      pin,
      expiresInDays,
      notes,
    });

    revalidatePath("/accountant");
    revalidatePath("/dashboard");
    return {
      success: true,
      accessId: access.id,
      token: access.token,
      rawPin: access.rawPin,
      access: {
        id: access.id,
        token: access.token,
        name: access.name,
        email: access.email,
        fiscalYear: access.fiscalYear,
        pinHash: access.pinHash,
        expiresAt: access.expiresAt,
        isRevoked: access.isRevoked,
        notes: access.notes,
      },
    };
  } catch (err: any) {
    captureException(err, { action: "createAccountantAccessAction" });
    return { error: err.message || "Erreur lors de la création de l'accès comptable." };
  }
}

export async function revokeAccountantAccessAction(accessId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    await revokeAccountantAccess(session.tenantId, accessId);

    revalidatePath("/accountant");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "revokeAccountantAccessAction" });
    return { error: err.message || "Erreur lors de la révocation de l'accès." };
  }
}

export async function deleteAccountantAccessAction(accessId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: "Non autorisé." };

    await deleteAccountantAccess(session.tenantId, accessId);

    revalidatePath("/accountant");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "deleteAccountantAccessAction" });
    return { error: err.message || "Erreur lors de la suppression." };
  }
}

export async function verifyAccountantPinAction(token: string, pin: string) {
  try {
    const isValid = await verifyAccountantPin(token, pin);
    if (!isValid) {
      return { error: "Code PIN incorrect. Veuillez réessayer." };
    }

    const cookieStore = await cookies();
    cookieStore.set(`accountant_pin_${token}`, "verified", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: `/`,
    });

    return { success: true };
  } catch (err: any) {
    captureException(err, { action: "verifyAccountantPinAction" });
    return { error: "Erreur lors de la vérification du code PIN." };
  }
}

export async function logoutAccountantAction(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`accountant_pin_${token}`);
    return { success: true };
  } catch (err: any) {
    return { error: "Erreur lors de la déconnexion." };
  }
}

/* =========================================================================
   VAULT BACKUP & RESTORE ACTIONS (MODULE 4)
========================================================================= */

export async function previewVaultRestoreAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return { error: "Non authentifié" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "Veuillez sélectionner un fichier de sauvegarde." };
    }

    const passphrase = (formData.get("passphrase") as string) || undefined;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const inspection = await inspectVaultBuffer(buffer, passphrase);
    if (!inspection.valid) {
      return {
        error: inspection.error || "Fichier de sauvegarde non valide.",
        isEncrypted: inspection.isEncrypted,
        requiresPassphrase: inspection.requiresPassphrase,
      };
    }

    return {
      success: true,
      isEncrypted: inspection.isEncrypted,
      requiresPassphrase: inspection.requiresPassphrase,
      manifest: inspection.manifest,
      stats: inspection.manifest?.stats || {
        clientsCount: inspection.payload?.clients?.length || 0,
        invoicesCount: inspection.payload?.invoices?.length || 0,
        quotesCount: inspection.payload?.quotes?.length || 0,
        creditNotesCount: inspection.payload?.creditNotes?.length || 0,
        expensesCount: inspection.payload?.expenses?.length || 0,
        pastTurnoversCount: inspection.payload?.pastTurnovers?.length || 0,
        accountantAccessesCount: 0,
      },
    };
  } catch (err: any) {
    captureException(err, { action: "previewVaultRestoreAction" });
    return { error: err.message || "Erreur lors de l'analyse du fichier de sauvegarde." };
  }
}

export async function executeVaultRestoreAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !session.tenantId) {
      return { error: "Non authentifié" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "Fichier de sauvegarde manquant." };
    }

    const passphrase = (formData.get("passphrase") as string) || undefined;
    const mode = (formData.get("mode") as "merge" | "overwrite") || "merge";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const inspection = await inspectVaultBuffer(buffer, passphrase);
    if (!inspection.valid || !inspection.payload) {
      return {
        error: inspection.error || "Impossible de déchiffrer ou lire la sauvegarde.",
      };
    }

    const restoreResult = await restoreVaultData(session.tenantId, inspection.payload, mode);

    revalidatePath("/dashboard");
    revalidatePath("/invoices");
    revalidatePath("/quotes");
    revalidatePath("/credit-notes");
    revalidatePath("/expenses");
    revalidatePath("/clients");
    revalidatePath("/tax-summary");
    revalidatePath("/accountant");
    revalidatePath("/profile");
    revalidatePath("/backup");

    return {
      success: true,
      restoredCounts: restoreResult.restoredCounts,
    };
  } catch (err: any) {
    captureException(err, { action: "executeVaultRestoreAction" });
    return { error: err.message || "Erreur lors de la restauration des données." };
  }
}



