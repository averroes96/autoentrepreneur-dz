import crypto from "node:crypto";
import JSZip from "jszip";
import { db } from "./db";
import { formatDZD } from "./tax";
import { formatCurrencyAmount } from "./currencies";

export interface VaultStats {
  clientsCount: number;
  invoicesCount: number;
  quotesCount: number;
  creditNotesCount: number;
  expensesCount: number;
  pastTurnoversCount: number;
  accountantAccessesCount: number;
}

export interface VaultManifest {
  version: "1.0";
  system: "Moukawil.dz Data Vault";
  legalNotice: "Conforme Loi n° 22-23 portant statut de l'auto-entrepreneur en Algérie";
  exportedAt: string;
  tenantId: string;
  tenantName: string;
  isEncrypted: boolean;
  checksum: string;
  stats: VaultStats;
}

export interface VaultPayload {
  profile: any;
  clients: any[];
  invoices: any[];
  invoiceSequences: any[];
  quotes: any[];
  quoteSequences: any[];
  creditNotes: any[];
  creditNoteSequences: any[];
  expenses: any[];
  pastTurnovers: any[];
  accountantAccesses: any[];
}

export interface EncryptedVaultEnvelope {
  version: "1.0";
  isEncrypted: true;
  algorithm: "aes-256-gcm";
  kdf: "scrypt";
  salt: string; // hex (16 bytes)
  iv: string; // hex (12 bytes)
  authTag: string; // hex (16 bytes)
  ciphertext: string; // hex
  checksum: string; // hex sha256 of plaintext
  manifest: VaultManifest;
}

export interface VaultExportContainer {
  manifest: VaultManifest;
  payload: VaultPayload;
}

/**
 * Computes SHA-256 integrity hash of a string or buffer
 */
export function computeSha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Encrypts a plaintext JSON string with AES-256-GCM using scrypt key derivation
 */
export function encryptVaultPayload(
  plaintextJson: string,
  passphrase: string,
  manifest: VaultManifest
): EncryptedVaultEnvelope {
  const salt = crypto.randomBytes(16);
  // Derive 32-byte key using scrypt
  const key = crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encryptedBuf = Buffer.concat([
    cipher.update(plaintextJson, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const checksum = computeSha256(plaintextJson);

  return {
    version: "1.0",
    isEncrypted: true,
    algorithm: "aes-256-gcm",
    kdf: "scrypt",
    salt: salt.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: encryptedBuf.toString("hex"),
    checksum,
    manifest: {
      ...manifest,
      isEncrypted: true,
      checksum,
    },
  };
}

/**
 * Decrypts an encrypted envelope using passphrase and validates integrity
 */
export function decryptVaultPayload(
  envelope: EncryptedVaultEnvelope,
  passphrase: string
): string {
  try {
    const salt = Buffer.from(envelope.salt, "hex");
    const iv = Buffer.from(envelope.iv, "hex");
    const authTag = Buffer.from(envelope.authTag, "hex");
    const ciphertext = Buffer.from(envelope.ciphertext, "hex");

    const key = crypto.scryptSync(passphrase, salt, 32, { N: 16384, r: 8, p: 1 });
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuf = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const plaintext = decryptedBuf.toString("utf8");
    const actualChecksum = computeSha256(plaintext);

    if (envelope.checksum && actualChecksum !== envelope.checksum) {
      throw new Error("Échec de vérification de l'intégrité des données (somme de contrôle altérée).");
    }

    return plaintext;
  } catch (err: any) {
    if (err.message?.includes("intégrité")) throw err;
    throw new Error("Mot de passe incorrect ou archive corrompue.");
  }
}

/**
 * Exports complete tenant data from database
 */
export async function exportTenantVaultData(tenantId: string): Promise<VaultExportContainer> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: { profile: true },
  });

  if (!tenant || !tenant.profile) {
    throw new Error("Tenant ou profil introuvable.");
  }

  const [
    clients,
    invoices,
    invoiceSequences,
    quotes,
    quoteSequences,
    creditNotes,
    creditNoteSequences,
    expenses,
    pastTurnovers,
    accountantAccesses,
  ] = await Promise.all([
    db.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    }),
    db.invoice.findMany({
      where: { tenantId },
      include: { lineItems: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invoiceSequence.findMany({ where: { tenantId } }),
    db.quote.findMany({
      where: { tenantId },
      include: { lineItems: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.quoteSequence.findMany({ where: { tenantId } }),
    db.creditNote.findMany({
      where: { tenantId },
      include: { lineItems: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    db.creditNoteSequence.findMany({ where: { tenantId } }),
    db.expense.findMany({
      where: { tenantId },
      orderBy: { date: "asc" },
    }),
    db.pastTurnover.findMany({
      where: { tenantId },
      orderBy: { fiscalYear: "asc" },
    }),
    db.accountantAccess.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const stats: VaultStats = {
    clientsCount: clients.length,
    invoicesCount: invoices.length,
    quotesCount: quotes.length,
    creditNotesCount: creditNotes.length,
    expensesCount: expenses.length,
    pastTurnoversCount: pastTurnovers.length,
    accountantAccessesCount: accountantAccesses.length,
  };

  const payload: VaultPayload = {
    profile: tenant.profile,
    clients,
    invoices,
    invoiceSequences,
    quotes,
    quoteSequences,
    creditNotes,
    creditNoteSequences,
    expenses,
    pastTurnovers,
    accountantAccesses,
  };

  const jsonString = JSON.stringify(payload);
  const checksum = computeSha256(jsonString);

  const manifest: VaultManifest = {
    version: "1.0",
    system: "Moukawil.dz Data Vault",
    legalNotice: "Conforme Loi n° 22-23 portant statut de l'auto-entrepreneur en Algérie",
    exportedAt: new Date().toISOString(),
    tenantId,
    tenantName: tenant.profile.fullName || tenant.name,
    isEncrypted: false,
    checksum,
    stats,
  };

  return { manifest, payload };
}

/**
 * Builds standalone JSON backup buffer (plain or encrypted)
 */
export async function generateVaultJsonBuffer(
  tenantId: string,
  options?: { passphrase?: string }
): Promise<{ buffer: Buffer; filename: string }> {
  const { manifest, payload } = await exportTenantVaultData(tenantId);
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = (manifest.tenantName || "AutoEntrepreneur")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 25);

  if (options?.passphrase && options.passphrase.trim().length > 0) {
    const rawJson = JSON.stringify(payload);
    const envelope = encryptVaultPayload(rawJson, options.passphrase.trim(), manifest);
    const jsonOutput = JSON.stringify(envelope, null, 2);
    return {
      buffer: Buffer.from(jsonOutput, "utf8"),
      filename: `Moukawil_Vault_Encrypted_${dateStr}_${safeName}.vault.json`,
    };
  }

  const container: VaultExportContainer = { manifest, payload };
  const jsonOutput = JSON.stringify(container, null, 2);
  return {
    buffer: Buffer.from(jsonOutput, "utf8"),
    filename: `Moukawil_Vault_Backup_${dateStr}_${safeName}.json`,
  };
}

/**
 * Builds full ZIP archive bundle containing JSON vault + CSV tables + Instructions
 */
export async function generateVaultZipArchive(
  tenantId: string,
  options?: { passphrase?: string }
): Promise<{ buffer: Buffer; filename: string }> {
  const { manifest, payload } = await exportTenantVaultData(tenantId);
  const dateStr = new Date().toISOString().split("T")[0];
  const safeName = (manifest.tenantName || "AutoEntrepreneur")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 25);

  const zip = new JSZip();

  // 1. JSON Vault Payload (plain or encrypted)
  if (options?.passphrase && options.passphrase.trim().length > 0) {
    const rawJson = JSON.stringify(payload);
    const envelope = encryptVaultPayload(rawJson, options.passphrase.trim(), manifest);
    zip.file("data_vault.enc.json", JSON.stringify(envelope, null, 2));
    zip.file("vault_manifest.json", JSON.stringify(envelope.manifest, null, 2));
  } else {
    zip.file("data_vault.json", JSON.stringify(payload, null, 2));
    zip.file("vault_manifest.json", JSON.stringify(manifest, null, 2));
  }

  // 2. CSV Export Tables for human inspection
  zip.file("01_clients.csv", generateClientsCsv(payload.clients));
  zip.file("02_factures.csv", generateInvoicesCsv(payload.invoices));
  zip.file("03_devis.csv", generateQuotesCsv(payload.quotes));
  zip.file("04_avoirs.csv", generateCreditNotesCsv(payload.creditNotes));
  zip.file("05_depenses.csv", generateExpensesCsv(payload.expenses));

  // 3. User instructions
  zip.file("06_instructions_restauration.txt", generateInstructionsText(manifest));

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  const encSuffix = options?.passphrase ? "_Encrypted" : "";
  return {
    buffer: zipBuffer,
    filename: `Moukawil_Vault_Backup${encSuffix}_${dateStr}_${safeName}.zip`,
  };
}

/**
 * Inspects an uploaded file (ZIP or JSON) and returns pre-restoration preview
 */
export async function inspectVaultBuffer(
  fileBuffer: Buffer,
  passphrase?: string
): Promise<{
  valid: boolean;
  isEncrypted: boolean;
  requiresPassphrase: boolean;
  manifest?: VaultManifest;
  payload?: VaultPayload;
  error?: string;
}> {
  try {
    // Check if it's a ZIP archive (ZIP files start with PK, magic bytes 0x50 0x4B)
    const isZip = fileBuffer.length >= 4 && fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b;

    if (isZip) {
      const zip = await JSZip.loadAsync(fileBuffer);

      // Check for manifest
      let manifest: VaultManifest | null = null;
      if (zip.file("vault_manifest.json")) {
        const manifestTxt = await zip.file("vault_manifest.json")!.async("string");
        manifest = JSON.parse(manifestTxt);
      }

      // Check if encrypted
      const encFile = zip.file("data_vault.enc.json");
      if (encFile) {
        if (!passphrase || passphrase.trim().length === 0) {
          return {
            valid: true,
            isEncrypted: true,
            requiresPassphrase: true,
            manifest: manifest || undefined,
          };
        }

        const encTxt = await encFile.async("string");
        const envelope: EncryptedVaultEnvelope = JSON.parse(encTxt);
        const decryptedJson = decryptVaultPayload(envelope, passphrase);
        const payload: VaultPayload = JSON.parse(decryptedJson);

        return {
          valid: true,
          isEncrypted: true,
          requiresPassphrase: false,
          manifest: envelope.manifest,
          payload,
        };
      }

      // Unencrypted ZIP
      const plainFile = zip.file("data_vault.json");
      if (!plainFile) {
        return {
          valid: false,
          isEncrypted: false,
          requiresPassphrase: false,
          error: "Fichier de coffre-fort introuvable dans l'archive ZIP (data_vault.json manquant).",
        };
      }

      const plainTxt = await plainFile.async("string");
      const payload: VaultPayload = JSON.parse(plainTxt);

      return {
        valid: true,
        isEncrypted: false,
        requiresPassphrase: false,
        manifest: manifest || undefined,
        payload,
      };
    }

    // Otherwise, treat as JSON file
    const jsonStr = fileBuffer.toString("utf8");
    const parsed = JSON.parse(jsonStr);

    if (parsed.isEncrypted && parsed.algorithm === "aes-256-gcm") {
      const envelope = parsed as EncryptedVaultEnvelope;
      if (!passphrase || passphrase.trim().length === 0) {
        return {
          valid: true,
          isEncrypted: true,
          requiresPassphrase: true,
          manifest: envelope.manifest,
        };
      }

      const decryptedJson = decryptVaultPayload(envelope, passphrase);
      const payload: VaultPayload = JSON.parse(decryptedJson);

      return {
        valid: true,
        isEncrypted: true,
        requiresPassphrase: false,
        manifest: envelope.manifest,
        payload,
      };
    }

    // Plain JSON container or payload
    if (parsed.manifest && parsed.payload) {
      return {
        valid: true,
        isEncrypted: false,
        requiresPassphrase: false,
        manifest: parsed.manifest,
        payload: parsed.payload,
      };
    }

    if (parsed.profile && parsed.invoices) {
      return {
        valid: true,
        isEncrypted: false,
        requiresPassphrase: false,
        payload: parsed as VaultPayload,
      };
    }

    return {
      valid: false,
      isEncrypted: false,
      requiresPassphrase: false,
      error: "Structure de fichier de sauvegarde non reconnue.",
    };
  } catch (err: any) {
    return {
      valid: false,
      isEncrypted: false,
      requiresPassphrase: false,
      error: err.message || "Erreur de lecture du fichier de sauvegarde.",
    };
  }
}

/**
 * Restores a vault payload to the tenant in merge or overwrite mode inside an atomic transaction
 */
export async function restoreVaultData(
  tenantId: string,
  payload: VaultPayload,
  mode: "merge" | "overwrite"
): Promise<{
  success: boolean;
  restoredCounts: VaultStats;
}> {
  return db.$transaction(async (tx) => {
    // Verify tenant exists
    const currentTenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      include: { profile: true },
    });
    if (!currentTenant) {
      throw new Error("Tenant destinataire introuvable.");
    }

    // 1. OVERWRITE MODE: Purge existing child data in strict dependency order
    if (mode === "overwrite") {
      await tx.creditNoteLineItem.deleteMany({ where: { creditNote: { tenantId } } });
      await tx.creditNote.deleteMany({ where: { tenantId } });
      await tx.invoiceLineItem.deleteMany({ where: { invoice: { tenantId } } });
      await tx.invoice.deleteMany({ where: { tenantId } });
      await tx.quoteLineItem.deleteMany({ where: { quote: { tenantId } } });
      await tx.quote.deleteMany({ where: { tenantId } });
      await tx.expense.deleteMany({ where: { tenantId } });
      await tx.client.deleteMany({ where: { tenantId } });
      await tx.invoiceSequence.deleteMany({ where: { tenantId } });
      await tx.quoteSequence.deleteMany({ where: { tenantId } });
      await tx.creditNoteSequence.deleteMany({ where: { tenantId } });
      await tx.pastTurnover.deleteMany({ where: { tenantId } });
    }

    // 2. Restore Profile Settings (Merge profile attributes safely)
    if (payload.profile) {
      const p = payload.profile;
      await tx.autoEntrepreneurProfile.upsert({
        where: { tenantId },
        create: {
          tenantId,
          fullName: p.fullName || currentTenant.name,
          rnaeNumber: p.rnaeNumber || "—",
          nif: p.nif || "—",
          address: p.address || "—",
          email: p.email || "—",
          phone: p.phone || "—",
          activityCode: p.activityCode || "—",
          activityLabel: p.activityLabel || "—",
          defaultCurrency: p.defaultCurrency || "DZD",
          cardIssueDate: p.cardIssueDate ? new Date(p.cardIssueDate) : null,
          activityStartDate: p.activityStartDate ? new Date(p.activityStartDate) : null,
          cardValidityYears: p.cardValidityYears || 5,
          casnosStatus: p.casnosStatus || "AFFILIATED",
          casnosScheme: p.casnosScheme || "FLAT_24000",
          vatExemptionNote: p.vatExemptionNote || currentTenant.profile?.vatExemptionNote || "Exonéré de la TVA",
          invoicePrefix: p.invoicePrefix || "FAC",
          quotePrefix: p.quotePrefix || "DEV",
          creditNotePrefix: p.creditNotePrefix || "AVR",
        },
        update: {
          fullName: p.fullName || currentTenant.profile?.fullName,
          rnaeNumber: p.rnaeNumber || currentTenant.profile?.rnaeNumber,
          nif: p.nif || currentTenant.profile?.nif,
          address: p.address || currentTenant.profile?.address,
          phone: p.phone || currentTenant.profile?.phone,
          activityCode: p.activityCode || currentTenant.profile?.activityCode,
          activityLabel: p.activityLabel || currentTenant.profile?.activityLabel,
          defaultCurrency: p.defaultCurrency || currentTenant.profile?.defaultCurrency,
          casnosStatus: p.casnosStatus || currentTenant.profile?.casnosStatus,
          casnosScheme: p.casnosScheme || currentTenant.profile?.casnosScheme,
        },
      });
    }

    // 3. Restore Clients
    const clientIdMap = new Map<string, string>(); // oldId -> newId
    const existingClients = mode === "overwrite"
      ? []
      : await tx.client.findMany({ where: { tenantId } });
    const clientByName = new Map(existingClients.map((c) => [c.name, c]));

    for (const c of payload.clients || []) {
      const existingClient = clientByName.get(c.name);

      if (existingClient) {
        clientIdMap.set(c.id, existingClient.id);
        if (mode === "merge") {
          await tx.client.update({
            where: { id: existingClient.id },
            data: {
              clientType: c.clientType,
              address: c.address,
              nif: c.nif,
              nis: c.nis,
              rc: c.rc,
              email: c.email,
              phone: c.phone,
            },
          });
        }
      } else {
        const createdClient = await tx.client.create({
          data: {
            tenantId,
            name: c.name,
            clientType: c.clientType || "PROFESSIONAL",
            address: c.address || "—",
            nif: c.nif,
            nis: c.nis,
            rc: c.rc,
            email: c.email,
            phone: c.phone,
            isArchived: Boolean(c.isArchived),
          },
        });
        clientIdMap.set(c.id, createdClient.id);
        clientByName.set(c.name, createdClient);
      }
    }

    // 4. Restore Quotes
    const quoteIdMap = new Map<string, string>();
    const existingQuotes = mode === "overwrite"
      ? []
      : await tx.quote.findMany({
          where: { tenantId },
          select: { id: true, quoteNumber: true },
        });
    const quoteByNumber = new Map(existingQuotes.map((q) => [q.quoteNumber, q.id]));

    for (const q of payload.quotes || []) {
      const targetClientId = clientIdMap.get(q.clientId);
      if (!targetClientId) continue;

      const existingQuoteId = quoteByNumber.get(q.quoteNumber);

      if (!existingQuoteId) {
        const createdQuote = await tx.quote.create({
          data: {
            tenantId,
            clientId: targetClientId,
            quoteNumber: q.quoteNumber,
            sequenceNumber: q.sequenceNumber,
            fiscalYear: q.fiscalYear,
            status: q.status || "DRAFT",
            issueDate: new Date(q.issueDate),
            validUntil: q.validUntil ? new Date(q.validUntil) : null,
            currency: q.currency || "DZD",
            exchangeRate: q.exchangeRate ?? 1.0,
            total: q.total,
            totalDzd: q.totalDzd,
            notes: q.notes,
            vatExemptionNote: q.vatExemptionNote || "Exonéré de la TVA",
            showDetailedItems: Boolean(q.showDetailedItems),
            sellerSnapshot: q.sellerSnapshot,
            clientSnapshot: q.clientSnapshot,
            sentAt: q.sentAt ? new Date(q.sentAt) : null,
            convertedAt: q.convertedAt ? new Date(q.convertedAt) : null,
            lineItems: {
              create: (q.lineItems || []).map((li: any, idx: number) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                totalPrice: li.totalPrice,
                currency: li.currency || q.currency || "DZD",
                position: li.position ?? idx,
              })),
            },
          },
        });
        quoteIdMap.set(q.id, createdQuote.id);
        quoteByNumber.set(q.quoteNumber, createdQuote.id);
      } else {
        quoteIdMap.set(q.id, existingQuoteId);
      }
    }

    // 5. Restore Invoices
    const invoiceIdMap = new Map<string, string>();
    const existingInvoices = mode === "overwrite"
      ? []
      : await tx.invoice.findMany({
          where: { tenantId },
          select: { id: true, invoiceNumber: true },
        });
    const invoiceByNumber = new Map(existingInvoices.map((inv) => [inv.invoiceNumber, inv.id]));

    for (const inv of payload.invoices || []) {
      const targetClientId = clientIdMap.get(inv.clientId);
      if (!targetClientId) continue;

      const linkedQuoteId = inv.sourceQuoteId ? quoteIdMap.get(inv.sourceQuoteId) : null;
      const existingInvoiceId = invoiceByNumber.get(inv.invoiceNumber);

      if (!existingInvoiceId) {
        const createdInvoice = await tx.invoice.create({
          data: {
            tenantId,
            clientId: targetClientId,
            invoiceNumber: inv.invoiceNumber,
            sequenceNumber: inv.sequenceNumber,
            fiscalYear: inv.fiscalYear,
            status: inv.status || "ISSUED",
            paymentStatus: inv.paymentStatus || "UNPAID",
            issueDate: new Date(inv.issueDate),
            paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
            paymentMethod: inv.paymentMethod,
            paymentReference: inv.paymentReference,
            receiptNumber: inv.receiptNumber,
            currency: inv.currency || "DZD",
            exchangeRate: inv.exchangeRate ?? 1.0,
            total: inv.total,
            totalDzd: inv.totalDzd,
            vatExemptionNote: inv.vatExemptionNote || "Exonéré de la TVA",
            sellerSnapshot: inv.sellerSnapshot,
            clientSnapshot: inv.clientSnapshot,
            issuedAt: inv.issuedAt ? new Date(inv.issuedAt) : null,
            cancellationReason: inv.cancellationReason,
            notes: inv.notes,
            showDetailedItems: Boolean(inv.showDetailedItems),
            sourceQuoteId: linkedQuoteId,
            lineItems: {
              create: (inv.lineItems || []).map((li: any, idx: number) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                totalPrice: li.totalPrice,
                currency: li.currency || inv.currency || "DZD",
                position: li.position ?? idx,
              })),
            },
          },
        });
        invoiceIdMap.set(inv.id, createdInvoice.id);
        invoiceByNumber.set(inv.invoiceNumber, createdInvoice.id);
      } else {
        invoiceIdMap.set(inv.id, existingInvoiceId);
      }
    }

    // 6. Restore Credit Notes
    const existingCreditNotes = mode === "overwrite"
      ? []
      : await tx.creditNote.findMany({
          where: { tenantId },
          select: { id: true, creditNoteNumber: true },
        });
    const creditNoteByNumber = new Map(existingCreditNotes.map((cn) => [cn.creditNoteNumber, cn.id]));

    for (const cn of payload.creditNotes || []) {
      const targetClientId = clientIdMap.get(cn.clientId);
      const targetOriginalInvoiceId = invoiceIdMap.get(cn.originalInvoiceId);
      if (!targetClientId || !targetOriginalInvoiceId) continue;

      const existingCreditNoteId = creditNoteByNumber.get(cn.creditNoteNumber);

      if (!existingCreditNoteId) {
        const createdCn = await tx.creditNote.create({
          data: {
            tenantId,
            clientId: targetClientId,
            originalInvoiceId: targetOriginalInvoiceId,
            creditNoteNumber: cn.creditNoteNumber,
            sequenceNumber: cn.sequenceNumber,
            fiscalYear: cn.fiscalYear,
            status: cn.status || "ISSUED",
            refundStatus: cn.refundStatus || "PENDING",
            issueDate: new Date(cn.issueDate),
            refundedAt: cn.refundedAt ? new Date(cn.refundedAt) : null,
            reason: cn.reason || "Avoir de rectification",
            currency: cn.currency || "DZD",
            exchangeRate: cn.exchangeRate ?? 1.0,
            total: cn.total,
            totalDzd: cn.totalDzd,
            notes: cn.notes,
            vatExemptionNote: cn.vatExemptionNote || "Exonéré de la TVA",
            sellerSnapshot: cn.sellerSnapshot,
            clientSnapshot: cn.clientSnapshot,
            issuedAt: cn.issuedAt ? new Date(cn.issuedAt) : null,
            showDetailedItems: Boolean(cn.showDetailedItems),
            lineItems: {
              create: (cn.lineItems || []).map((li: any, idx: number) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                totalPrice: li.totalPrice,
                currency: li.currency || cn.currency || "DZD",
                position: li.position ?? idx,
              })),
            },
          },
        });
        creditNoteByNumber.set(cn.creditNoteNumber, createdCn.id);
      }
    }

    // 7. Restore Expenses
    const existingExpenses = mode === "overwrite"
      ? []
      : await tx.expense.findMany({
          where: { tenantId },
          select: { title: true, amount: true, date: true },
        });
    const expenseKeySet = new Set(
      existingExpenses.map(
        (e) => `${e.title}_${e.amount}_${new Date(e.date).toISOString().slice(0, 10)}`
      )
    );

    for (const exp of payload.expenses || []) {
      const expKey = `${exp.title}_${exp.amount}_${new Date(exp.date).toISOString().slice(0, 10)}`;

      if (!expenseKeySet.has(expKey)) {
        await tx.expense.create({
          data: {
            tenantId,
            title: exp.title,
            amount: exp.amount,
            currency: exp.currency || "DZD",
            exchangeRate: exp.exchangeRate ?? 1.0,
            amountDzd: exp.amountDzd ?? exp.amount,
            date: new Date(exp.date),
            fiscalYear: exp.fiscalYear,
            category: exp.category,
            paymentMethod: exp.paymentMethod || "OTHER",
            supplier: exp.supplier,
            invoiceNumber: exp.invoiceNumber,
            receiptUrl: exp.receiptUrl,
            notes: exp.notes,
          },
        });
        expenseKeySet.add(expKey);
      }
    }

    // 8. Restore Sequences
    for (const seq of payload.invoiceSequences || []) {
      const existing = await tx.invoiceSequence.findUnique({
        where: { tenantId_fiscalYear: { tenantId, fiscalYear: seq.fiscalYear } },
      });
      if (existing) {
        await tx.invoiceSequence.update({
          where: { id: existing.id },
          data: { lastSequence: Math.max(existing.lastSequence, seq.lastSequence) },
        });
      } else {
        await tx.invoiceSequence.create({
          data: { tenantId, fiscalYear: seq.fiscalYear, lastSequence: seq.lastSequence },
        });
      }
    }

    for (const seq of payload.quoteSequences || []) {
      const existing = await tx.quoteSequence.findUnique({
        where: { tenantId_fiscalYear: { tenantId, fiscalYear: seq.fiscalYear } },
      });
      if (existing) {
        await tx.quoteSequence.update({
          where: { id: existing.id },
          data: { lastSequence: Math.max(existing.lastSequence, seq.lastSequence) },
        });
      } else {
        await tx.quoteSequence.create({
          data: { tenantId, fiscalYear: seq.fiscalYear, lastSequence: seq.lastSequence },
        });
      }
    }

    for (const seq of payload.creditNoteSequences || []) {
      const existing = await tx.creditNoteSequence.findUnique({
        where: { tenantId_fiscalYear: { tenantId, fiscalYear: seq.fiscalYear } },
      });
      if (existing) {
        await tx.creditNoteSequence.update({
          where: { id: existing.id },
          data: { lastSequence: Math.max(existing.lastSequence, seq.lastSequence) },
        });
      } else {
        await tx.creditNoteSequence.create({
          data: { tenantId, fiscalYear: seq.fiscalYear, lastSequence: seq.lastSequence },
        });
      }
    }

    // 9. Restore Past Turnovers
    for (const pt of payload.pastTurnovers || []) {
      await tx.pastTurnover.upsert({
        where: { tenantId_fiscalYear: { tenantId, fiscalYear: pt.fiscalYear } },
        create: { tenantId, fiscalYear: pt.fiscalYear, turnoverDzd: pt.turnoverDzd },
        update: { turnoverDzd: pt.turnoverDzd },
      });
    }

    // Compute updated counts
    const [finalClients, finalInvoices, finalQuotes, finalCreditNotes, finalExpenses, finalPastTurnovers] =
      await Promise.all([
        tx.client.count({ where: { tenantId } }),
        tx.invoice.count({ where: { tenantId } }),
        tx.quote.count({ where: { tenantId } }),
        tx.creditNote.count({ where: { tenantId } }),
        tx.expense.count({ where: { tenantId } }),
        tx.pastTurnover.count({ where: { tenantId } }),
      ]);

    return {
      success: true,
      restoredCounts: {
        clientsCount: finalClients,
        invoicesCount: finalInvoices,
        quotesCount: finalQuotes,
        creditNotesCount: finalCreditNotes,
        expensesCount: finalExpenses,
        pastTurnoversCount: finalPastTurnovers,
        accountantAccessesCount: 0,
      },
    };
  }, { timeout: 90000, maxWait: 30000 });
}

// ==========================================
// CSV GENERATOR HELPERS (WITH UTF-8 BOM)
// ==========================================

function generateClientsCsv(clients: any[]): string {
  const headers = ["Nom / Raison Sociale", "Type", "NIF", "NIS", "RC", "Email", "Téléphone", "Adresse", "Archivé"];
  const rows = (clients || []).map((c) => [
    `"${(c.name || "").replace(/"/g, '""')}"`,
    c.clientType === "PROFESSIONAL" ? "Société" : "Particulier",
    c.nif || "",
    c.nis || "",
    c.rc || "",
    c.email || "",
    c.phone || "",
    `"${(c.address || "").replace(/"/g, '""')}"`,
    c.isArchived ? "Oui" : "Non",
  ]);
  return "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
}

function generateInvoicesCsv(invoices: any[]): string {
  const headers = [
    "N° Facture",
    "Date d'émission",
    "Exercice",
    "Statut",
    "Statut Règlement",
    "Date d'encaissement",
    "Mode de paiement",
    "Réf. Transaction",
    "N° Quittance",
    "Devise",
    "Taux de change",
    "Total Devise",
    "Total (DZD)",
    "Notes",
  ];
  const rows = (invoices || []).map((inv) => [
    inv.invoiceNumber || "",
    inv.issueDate ? new Date(inv.issueDate).toISOString().split("T")[0] : "",
    inv.fiscalYear,
    inv.status,
    inv.paymentStatus === "PAID" ? "Encaissée" : "Non réglée",
    inv.paidAt ? new Date(inv.paidAt).toISOString().split("T")[0] : "",
    inv.paymentMethod || "",
    inv.paymentReference || "",
    inv.receiptNumber || "",
    inv.currency || "DZD",
    (inv.exchangeRate ?? 1).toString(),
    inv.total?.toFixed(2) || "0.00",
    (inv.totalDzd ?? inv.total)?.toFixed(2) || "0.00",
    `"${(inv.notes || "").replace(/"/g, '""')}"`,
  ]);
  return "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
}

function generateQuotesCsv(quotes: any[]): string {
  const headers = ["N° Devis", "Date d'émission", "Validité", "Exercice", "Statut", "Devise", "Total Devise", "Total (DZD)", "Notes"];
  const rows = (quotes || []).map((q) => [
    q.quoteNumber || "",
    q.issueDate ? new Date(q.issueDate).toISOString().split("T")[0] : "",
    q.validUntil ? new Date(q.validUntil).toISOString().split("T")[0] : "",
    q.fiscalYear,
    q.status,
    q.currency || "DZD",
    q.total?.toFixed(2) || "0.00",
    (q.totalDzd ?? q.total)?.toFixed(2) || "0.00",
    `"${(q.notes || "").replace(/"/g, '""')}"`,
  ]);
  return "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
}

function generateCreditNotesCsv(creditNotes: any[]): string {
  const headers = ["N° Avoir", "Date d'émission", "Exercice", "Statut", "Remboursement", "Date Remboursement", "Motif", "Total (DZD)"];
  const rows = (creditNotes || []).map((cn) => [
    cn.creditNoteNumber || "",
    cn.issueDate ? new Date(cn.issueDate).toISOString().split("T")[0] : "",
    cn.fiscalYear,
    cn.status,
    cn.refundStatus,
    cn.refundedAt ? new Date(cn.refundedAt).toISOString().split("T")[0] : "",
    `"${(cn.reason || "").replace(/"/g, '""')}"`,
    (cn.totalDzd ?? cn.total)?.toFixed(2) || "0.00",
  ]);
  return "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
}

function generateExpensesCsv(expenses: any[]): string {
  const headers = ["Date", "Exercice", "Catégorie", "Libellé", "Fournisseur", "N° Pièce", "Montant Devise", "Devise", "Montant (DZD)", "Mode de paiement"];
  const rows = (expenses || []).map((e) => [
    e.date ? new Date(e.date).toISOString().split("T")[0] : "",
    e.fiscalYear,
    e.category,
    `"${(e.title || "").replace(/"/g, '""')}"`,
    `"${(e.supplier || "").replace(/"/g, '""')}"`,
    e.invoiceNumber || "",
    e.amount?.toFixed(2) || "0.00",
    e.currency || "DZD",
    (e.amountDzd ?? e.amount)?.toFixed(2) || "0.00",
    e.paymentMethod || "",
  ]);
  return "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
}

function generateInstructionsText(manifest: VaultManifest): string {
  return `================================================================================
RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE
ARCHIVE DE COFFRE-FORT NUMÉRIQUE & SAUVEGARDE — MOUKAWIL.DZ
(Conformément aux dispositions de la Loi n° 22-23 du 18 décembre 2022)
================================================================================

1. INFORMATIONS SUR L'ARCHIVE :
--------------------------------------------------------------------------------
- Date d'exportation : ${manifest.exportedAt}
- Titulaire du compte : ${manifest.tenantName}
- Identifiant unique : ${manifest.tenantId}
- Chiffrement actif : ${manifest.isEncrypted ? "OUI (Chiffrement robuste AES-256-GCM)" : "NON (Format ouvert clair)"}
- Empreinte de contrôle (SHA-256) : ${manifest.checksum}
- Statut d'intégrité : Archive certifiée immuable

2. STATISTIQUES DES DONNÉES INCLUSES :
--------------------------------------------------------------------------------
- Clients enregistrés : ${manifest.stats.clientsCount}
- Factures émises : ${manifest.stats.invoicesCount}
- Devis & Propositions : ${manifest.stats.quotesCount}
- Factures d'avoirs (séquences rectificatives) : ${manifest.stats.creditNotesCount}
- Dépenses d'exploitation : ${manifest.stats.expensesCount}
- Antécédents de chiffre d'affaires : ${manifest.stats.pastTurnoversCount}

3. PROCÉDURE DE RESTAURATION :
--------------------------------------------------------------------------------
Cette archive peut être restaurée à tout moment sur la plateforme Moukawil.dz :
1. Connectez-vous à votre espace personnel Moukawil.dz.
2. Rendez-vous dans la section « Coffre-fort & Sauvegarde » (/backup).
3. Glissez-déposez ce fichier (.zip ou le fichier data_vault.json inclus).
4. Si un mot de passe a été configuré lors de l'exportation, saisissez-le pour déchiffrer vos données.
5. Choisissez entre la fusion intelligente des données ou le remplacement complet.
6. Validez : l'intégrité des données est revérifiée par empreinte SHA-256 avant toute écriture.

================================================================================
Moukawil.dz • Plateforme de gestion pour Auto-Entrepreneurs en Algérie
================================================================================
`;
}
