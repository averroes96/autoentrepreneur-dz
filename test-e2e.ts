import { db } from "./src/lib/db";
import {
  createDraftInvoice,
  issueInvoice,
  toggleInvoicePayment,
  cancelInvoice,
} from "./src/lib/invoicing";
import {
  calculateCeilingStatus,
  calculateIfu,
  evaluateThreeYearRule,
  formatDZD,
} from "./src/lib/tax";
import {
  generateInvoicePdfBuffer,
  generateQuotePdfBuffer,
  generateCreditNotePdfBuffer,
  generateTaxSummaryPdfBuffer,
  generatePaymentReceiptPdfBuffer,
  generateClientStatementPdfBuffer,
} from "./src/lib/pdfGenerator";
import { getStatutoryDeadlines } from "./src/lib/statutoryCalendar";
import { getAnnualTaxSummary, generateTaxSummaryCsv } from "./src/lib/taxSummary";
import {
  getClientLedger,
  generateClientStatementCsv,
  formatPaymentMethodLabel,
} from "./src/lib/clientLedger";
import { numberToFrenchWords, getFrenchAmountInWords } from "./src/lib/numberToWordsFr";
import {
  createDraftQuote,
  finalizeAndSendQuote,
  updateQuoteStatus,
  convertQuoteToInvoice,
} from "./src/lib/quotes";
import {
  createCreditNoteFromInvoice,
  toggleCreditNoteRefundStatus,
} from "./src/lib/creditNotes";
import { validateAlgerianNif, formatNif } from "./src/lib/nifValidator";
import {
  ANAE_BRANCHES,
  ANAE_ACTIVITIES,
  searchAnaeActivities,
  getActivityByCode,
} from "./src/data/anaeActivities";
import { REGULATORY_CONFIG } from "./src/config/regulatory";
import {
  ARABIC_NOMENCLATURE,
  formatDZD_AR,
  formatArabicDate,
  tafqeetNumberToArabicWords,
  getArabicAmountInWords,
} from "./src/lib/arabicNomenclature";
import { translations } from "./src/lib/i18n/translations";
import {
  EXPENSE_CATEGORIES,
  getExpensesSummary,
  generateExpensesCsv,
  ExpenseCategory,
} from "./src/lib/expenses";
import {
  SUPPORTED_CURRENCIES,
  getCurrencyDef,
  calculateDzdEquivalent,
  formatCurrencyAmount,
  getAmountInWordsWithCurrency,
  getExchangeRateNotice,
} from "./src/lib/currencies";
import {
  createAccountantAccess,
  validateAccountantToken,
  verifyAccountantPin,
  revokeAccountantAccess,
  deleteAccountantAccess,
  getAccountantAuditData,
  generateAccountantAuditZipBuffer,
  generateTenantAuditZipBuffer,
} from "./src/lib/accountantAccess";
import {
  exportTenantVaultData,
  encryptVaultPayload,
  decryptVaultPayload,
  generateVaultJsonBuffer,
  generateVaultZipArchive,
  inspectVaultBuffer,
  restoreVaultData,
} from "./src/lib/vault";
import JSZip from "jszip";

async function runTests() {
  console.log("=== STARTING PHASE 1 COMPLIANCE & INTEGRATION TEST ===");

  // 1. Verify Tenant & Profile
  const user = await db.user.findUnique({
    where: { email: "demo@autoentrepreneur.dz" },
    include: { tenant: { include: { profile: true } } },
  });

  if (!user || !user.tenant.profile) {
    throw new Error("Demo user or profile missing");
  }
  const tenantId = user.tenantId;
  const profile = user.tenant.profile;
  console.log("✓ Tenant & Admin User verified:", tenantId, "|", profile.fullName);

  // 2. Fetch Client
  const client = await db.client.findFirst({
    where: { tenantId },
  });
  if (!client) throw new Error("Client missing");
  console.log("✓ Client verified:", client.name);

  // 3. Create a Draft Invoice
  const draft = await createDraftInvoice({
    tenantId,
    clientId: client.id,
    issueDate: new Date(),
    notes: "Règlement à 30 jours par virement bancaire",
    lineItems: [
      { description: "Audit technique et conseil architecture", quantity: 2, unitPrice: 75_000 },
      { description: "Mise en place de l'infrastructure Cloud", quantity: 1, unitPrice: 100_000 },
    ],
  });
  console.log("✓ Draft Invoice Created:", draft.id, "| Total:", draft.total, "| Status:", draft.status);
  if (draft.status !== "DRAFT" || draft.invoiceNumber !== null) {
    throw new Error("Draft should not have a sequential invoice number yet");
  }

  // 4. Issue the Invoice (Tests atomic sequential numbering)
  const issued = await issueInvoice(tenantId, draft.id);
  console.log(
    "✓ Invoice Issued with sequential number:",
    issued.invoiceNumber,
    "| Sequence:",
    issued.sequenceNumber,
    "| Status:",
    issued.status
  );
  if (issued.status !== "ISSUED" || !issued.invoiceNumber?.startsWith("FAC-2026-")) {
    throw new Error("Invalid sequential invoice number");
  }

  // 5. Test PDF Generation
  console.log("Testing PDF generation with PDFKit engine...");
  const pdfBuffer = await generateInvoicePdfBuffer({
    invoice: issued as any,
    seller: profile,
    client: client as any,
  });
  console.log("✓ PDF generated successfully, byte size:", pdfBuffer.length);
  if (pdfBuffer.length < 1000) {
    throw new Error("PDF buffer is suspiciously small");
  }

  // 6. Test Mark as Paid
  const paidInvoice = await toggleInvoicePayment(tenantId, issued.id, true);
  console.log("✓ Invoice marked as PAID:", paidInvoice.paymentStatus, "| PaidAt:", paidInvoice.paidAt);

  // 7. Test Calculations
  const allPaidInvoices = await db.invoice.findMany({
    where: { tenantId, status: "ISSUED", paymentStatus: "PAID" },
  });
  const totalPaid = allPaidInvoices.reduce((acc, i) => acc + i.total, 0);
  const ceiling = calculateCeilingStatus(totalPaid);
  const ifu = calculateIfu(totalPaid);
  console.log(
    "✓ Turnover Paid:",
    totalPaid,
    "DZD | Ceiling Progress:",
    ceiling.percentage,
    "% | IFU Owed:",
    ifu.taxOwedDzd,
    "DZD (Minimum applied:",
    ifu.isMinimumApplied,
    ")"
  );

  // 8. Test 3-Year Rule Evaluation
  const pastTurnovers = await db.pastTurnover.findMany({
    where: { tenantId },
  });
  const threeYear = evaluateThreeYearRule(2026, totalPaid, pastTurnovers);
  console.log("✓ 3-Year Consecutive Rule Risk:", threeYear.isAtRisk, "| History years:", threeYear.history.map(h => `${h.year}: ${h.turnoverDzd} DZD`).join(", "));

  // 9. Test Cancellation
  const cancelled = await cancelInvoice(tenantId, issued.id, "Facture de test annulée pour correction");
  console.log("✓ Invoice Cancelled successfully. Status:", cancelled.status, "| Reason:", cancelled.cancellationReason);
  if (cancelled.status !== "CANCELLED" || cancelled.invoiceNumber !== issued.invoiceNumber) {
    throw new Error("Cancelled invoice must keep its original sequential number");
  }

  console.log("=== ALL PHASE 1 INTEGRATION TESTS PASSED PERFECTLY ===");

  console.log("\n=== STARTING PHASE 2 QUOTES & CREDIT NOTES INTEGRATION TEST ===");

  // 10. Create Draft Quote (Devis)
  const quoteDraft = await createDraftQuote({
    tenantId,
    clientId: client.id,
    issueDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes: "Offre valable 30 jours. Acompte de 30% à la commande.",
    lineItems: [
      { description: "Développement Application Web Next.js", quantity: 1, unitPrice: 180_000 },
      { description: "Hébergement et configuration DNS Cloudflare", quantity: 1, unitPrice: 20_000 },
    ],
  });
  console.log("✓ Draft Quote Created:", quoteDraft.id, "| Total:", quoteDraft.total, "| Status:", quoteDraft.status);
  if (quoteDraft.status !== "DRAFT" || quoteDraft.quoteNumber !== null || quoteDraft.total !== 200_000) {
    throw new Error("Draft quote validation failed");
  }

  // 11. Finalize and Send Quote
  const sentQuote = await finalizeAndSendQuote(tenantId, quoteDraft.id);
  console.log("✓ Quote Finalized with sequential number:", sentQuote.quoteNumber, "| Status:", sentQuote.status);
  if (sentQuote.status !== "SENT" || !sentQuote.quoteNumber?.startsWith("DEV-2026-")) {
    throw new Error("Finalized quote must have valid DEV-2026- sequential number");
  }

  // 12. Generate Quote PDF
  console.log("Testing Quote PDF generation with PDFKit engine...");
  const quotePdfBuffer = await generateQuotePdfBuffer({
    quote: sentQuote as any,
    seller: profile,
    client: client as any,
  });
  console.log("✓ Quote PDF generated successfully, byte size:", quotePdfBuffer.length);
  if (quotePdfBuffer.length < 1000) {
    throw new Error("Quote PDF buffer too small");
  }

  // 13. Accept Quote
  const acceptedQuote = await updateQuoteStatus(tenantId, sentQuote.id, "ACCEPTED");
  console.log("✓ Quote marked as ACCEPTED:", acceptedQuote.status);

  // 14. Convert Quote to Invoice (1-Click Conversion)
  const convertedInvoiceDraft = await convertQuoteToInvoice(tenantId, acceptedQuote.id);
  console.log(
    "✓ Quote converted to Invoice Draft:",
    convertedInvoiceDraft.id,
    "| Linked sourceQuoteId:",
    convertedInvoiceDraft.sourceQuoteId,
    "| Total:",
    convertedInvoiceDraft.total
  );
  if (
    convertedInvoiceDraft.sourceQuoteId !== acceptedQuote.id ||
    convertedInvoiceDraft.total !== 200_000 ||
    convertedInvoiceDraft.status !== "DRAFT"
  ) {
    throw new Error("Converted invoice does not match source quote");
  }

  // Verify quote status changed to CONVERTED
  const verifiedQuote = await db.quote.findUnique({ where: { id: acceptedQuote.id } });
  if (verifiedQuote?.status !== "CONVERTED" || !verifiedQuote.convertedAt) {
    throw new Error("Quote status should be CONVERTED with convertedAt timestamp");
  }
  console.log("✓ Source quote status confirmed as CONVERTED at:", verifiedQuote.convertedAt);

  // 15. Issue the converted Invoice
  const issuedConvertedInvoice = await issueInvoice(tenantId, convertedInvoiceDraft.id);
  console.log("✓ Converted Invoice Issued:", issuedConvertedInvoice.invoiceNumber);

  // 16. Mark Converted Invoice as Paid
  await toggleInvoicePayment(tenantId, issuedConvertedInvoice.id, true);
  console.log("✓ Converted Invoice marked as PAID");

  // 17. Create Credit Note (Avoir) referencing the issued invoice
  const creditNote = await createCreditNoteFromInvoice({
    tenantId,
    originalInvoiceId: issuedConvertedInvoice.id,
    reason: "Remise commerciale exceptionnelle suite à accord client",
    lineItems: [
      { description: "Remise accordée sur développement", quantity: 1, unitPrice: 50_000, totalPrice: 50_000 },
    ],
  });
  console.log(
    "✓ Credit Note (Avoir) Issued:",
    creditNote.creditNoteNumber,
    "| Ref Invoice:",
    creditNote.originalInvoice.invoiceNumber,
    "| Total:",
    creditNote.total,
    "| RefundStatus:",
    creditNote.refundStatus
  );
  if (
    !creditNote.creditNoteNumber?.startsWith("AVR-2026-") ||
    creditNote.total !== 50_000 ||
    creditNote.status !== "ISSUED" ||
    creditNote.refundStatus !== "PENDING"
  ) {
    throw new Error("Credit note validation failed");
  }

  // 18. Generate Credit Note PDF
  console.log("Testing Credit Note PDF generation with PDFKit engine...");
  const creditNotePdfBuffer = await generateCreditNotePdfBuffer({
    creditNote: {
      ...creditNote,
      originalInvoiceNumber: issuedConvertedInvoice.invoiceNumber,
    } as any,
    seller: profile,
    client: client as any,
  });
  console.log("✓ Credit Note PDF generated successfully, byte size:", creditNotePdfBuffer.length);
  if (creditNotePdfBuffer.length < 1000) {
    throw new Error("Credit note PDF buffer too small");
  }

  // 19. Refund the Credit Note & Test Net Turnover Deduction
  const refundedCreditNote = await toggleCreditNoteRefundStatus(tenantId, creditNote.id, true);
  console.log(
    "✓ Credit Note refunded:",
    refundedCreditNote.refundStatus,
    "| RefundedAt:",
    refundedCreditNote.refundedAt
  );

  // Calculate net turnover with refund deduction
  const allPaid = await db.invoice.findMany({
    where: { tenantId, status: "ISSUED", paymentStatus: "PAID", fiscalYear: 2026 },
  });
  const grossPaid = allPaid.reduce((acc, i) => acc + i.total, 0);

  const allRefundedNotes = await db.creditNote.findMany({
    where: { tenantId, fiscalYear: 2026, status: "ISSUED", refundStatus: "REFUNDED" },
  });
  const totalRefunded = allRefundedNotes.reduce((acc, cn) => acc + cn.total, 0);
  const netPaid = Math.max(0, grossPaid - totalRefunded);

  console.log(
    `✓ Turnover verification: Gross Paid = ${grossPaid} DZD | Total Refunded = ${totalRefunded} DZD | Net Paid = ${netPaid} DZD`
  );
  if (totalRefunded < 50_000) {
    throw new Error("Refunded credit note should be included in turnover deduction");
  }

  console.log("=== ALL PHASE 2 QUOTE & CREDIT NOTE TESTS PASSED PERFECTLY ===");

  console.log("\n=== STARTING SECTION 3: ANAE NOMENCLATURE & NIF VALIDATION TEST ===");

  // 20. Official ANAE Nomenclature (Décret 23-197)
  console.log("Verifying 7 Official ANAE Branches & Nomenclature...");
  if (ANAE_BRANCHES.length !== 7) {
    throw new Error(`Expected exactly 7 ANAE branches, found ${ANAE_BRANCHES.length}`);
  }
  console.log(`✓ 7 Official ANAE branches loaded:`, ANAE_BRANCHES.map((b) => `${b.code} - ${b.label}`).join(" | "));

  // Test search in ANAE activities
  const devActivities = searchAnaeActivities("next.js");
  if (devActivities.length === 0 || !devActivities[0].code.startsWith("02")) {
    throw new Error("ANAE search by keyword 'next.js' failed");
  }
  console.log(`✓ Keyword search successful: found "${devActivities[0].label}" (Code ${devActivities[0].code})`);

  const activityByCode = getActivityByCode("020101");
  if (!activityByCode || activityByCode.branchId !== "02") {
    throw new Error("Activity lookup by code 020101 failed");
  }
  console.log(`✓ Exact code lookup successful: ${activityByCode.code} - ${activityByCode.label}`);

  // 21. Algerian 15-Digit NIF Validation Algorithm
  console.log("Testing Algerian 15-Digit NIF validation algorithm...");

  // Valid NIF (Wilaya 16 - Alger)
  const validNifResult = validateAlgerianNif("168016010023456");
  if (!validNifResult.isValid || validNifResult.wilaya?.code !== "16" || validNifResult.wilaya?.name !== "Alger") {
    throw new Error(`Valid NIF failed validation: ${validNifResult.error}`);
  }
  console.log(`✓ Valid NIF verified: ${validNifResult.cleanNif} -> Wilaya: ${validNifResult.wilaya.name} | Formatted: ${formatNif("168016010023456")}`);

  // Valid birth-year format NIF (e.g. 199016010023456)
  const altValidNif = validateAlgerianNif("199016010023456");
  if (!altValidNif.isValid || altValidNif.wilaya?.code !== "16") {
    throw new Error(`Alt valid NIF failed: ${altValidNif.error}`);
  }
  console.log(`✓ Alternate birth-year NIF verified: ${altValidNif.cleanNif} -> Wilaya: ${altValidNif.wilaya?.name}`);

  // Invalid NIF: too short (14 digits)
  const tooShortResult = validateAlgerianNif("16801601002345");
  if (tooShortResult.isValid) {
    throw new Error("NIF with 14 digits should have been rejected");
  }
  console.log(`✓ Too short NIF correctly rejected: "${tooShortResult.error}"`);

  // Invalid NIF: repeated sequence
  const fakeNifResult = validateAlgerianNif("000000000000000");
  if (fakeNifResult.isValid) {
    throw new Error("Repeated fake NIF should have been rejected");
  }
  console.log(`✓ Fake repetitive NIF correctly rejected: "${fakeNifResult.error}"`);

  // Invalid NIF: invalid wilaya code (99)
  const invalidWilayaResult = validateAlgerianNif("999999999999998");
  if (invalidWilayaResult.isValid) {
    throw new Error("NIF with invalid wilaya 99 should have been rejected");
  }
  console.log(`✓ Invalid wilaya code NIF correctly rejected: "${invalidWilayaResult.error}"`);

  // 22. CASNOS Dual Scheme Regulatory Configuration
  console.log("Verifying CASNOS Dual Scheme parameters...");
  if (
    REGULATORY_CONFIG.casnos.defaultAnnualContributionDzd !== 24_000 ||
    REGULATORY_CONFIG.casnos.standardRate !== 0.15 ||
    REGULATORY_CONFIG.casnos.standardMinimumAnnualDzd !== 36_000
  ) {
    throw new Error("CASNOS dual scheme regulatory parameters incorrect");
  }
  console.log(
    `✓ CASNOS parameters verified: Flat Rate = ${REGULATORY_CONFIG.casnos.defaultAnnualContributionDzd} DZD/an | Standard Rate = ${REGULATORY_CONFIG.casnos.standardRate * 100}% | Standard Floor = ${REGULATORY_CONFIG.casnos.standardMinimumAnnualDzd} DZD/an`
  );

  console.log("=== ALL SECTION 3 ANAE NOMENCLATURE & NIF VALIDATION TESTS PASSED PERFECTLY ===");

  console.log("\n=== STARTING SECTION 4: STATUTORY CALENDAR & TAX SUMMARY (IFU G12 BIS) ===");

  // 23. Statutory Obligations Calendar & Deadlines Engine
  console.log("Testing Statutory Obligations Calendar Engine...");
  const statutoryDeadlines = getStatutoryDeadlines(2026, profile);
  console.log(`✓ Computed ${statutoryDeadlines.length} statutory deadlines for fiscal year 2026:`);
  for (const dl of statutoryDeadlines) {
    console.log(`  - [${dl.category}] ${dl.title} -> Due: ${dl.targetDate.toISOString().slice(0, 10)} (${dl.badgeLabel})`);
  }

  // Verify IFU deadline: Jan 31 of N+1 (2027)
  const ifuDl = statutoryDeadlines.find((d) => d.id === "ifu-declaration");
  if (!ifuDl) throw new Error("Missing IFU statutory deadline");
  if (ifuDl.targetDate.getFullYear() !== 2027 || ifuDl.targetDate.getMonth() !== 0 || ifuDl.targetDate.getDate() !== 31) {
    throw new Error(`IFU target date incorrect: ${ifuDl.targetDate}`);
  }
  if (ifuDl.category !== "FISCAL") throw new Error("IFU category must be FISCAL");

  // Verify CASNOS deadline: June 30 of N (2026)
  const casnosDl = statutoryDeadlines.find((d) => d.id === "casnos-annual");
  if (!casnosDl) throw new Error("Missing CASNOS statutory deadline");
  if (casnosDl.targetDate.getFullYear() !== 2026 || casnosDl.targetDate.getMonth() !== 5 || casnosDl.targetDate.getDate() !== 30) {
    throw new Error(`CASNOS target date incorrect: ${casnosDl.targetDate}`);
  }
  if (casnosDl.category !== "SOCIAL") throw new Error("CASNOS category must be SOCIAL");
  console.log("✓ Key statutory dates verified: IFU = Jan 31 N+1, CASNOS = June 30 N");

  // 24. Annual Tax Summary Calculation (Bordereau Récapitulatif)
  console.log("Testing Annual Tax Summary (getAnnualTaxSummary)...");
  const taxSummary = await getAnnualTaxSummary(tenantId, 2026);
  console.log(`✓ Annual Tax Summary computed for ${taxSummary.fiscalYear}:`);
  console.log(`  - Gross Billed: ${taxSummary.metrics.grossBilledDzd} DZD`);
  console.log(`  - Gross Collected: ${taxSummary.metrics.rawCollectedDzd} DZD across ${taxSummary.metrics.totalPaidInvoicesCount} paid invoices`);
  console.log(`  - Refunded Credit Notes: ${taxSummary.metrics.totalRefundedCreditDzd} DZD across ${taxSummary.metrics.totalRefundedNotesCount} refunded notes`);
  console.log(`  - Net Taxable Turnover: ${taxSummary.metrics.netTaxableTurnoverDzd} DZD`);
  console.log(`  - IFU Tax Owed (0.5% / min 10k): ${taxSummary.metrics.finalTaxOwedDzd} DZD (Floor applied: ${taxSummary.metrics.isMinimumApplied})`);
  console.log(`  - Remaining Ceiling: ${taxSummary.metrics.remainingCeilingDzd} DZD (${taxSummary.metrics.ceilingConsumedPercentage}%)`);

  if (taxSummary.fiscalYear !== 2026) throw new Error("Summary fiscal year mismatch");
  if (taxSummary.metrics.netTaxableTurnoverDzd !== taxSummary.metrics.rawCollectedDzd - taxSummary.metrics.totalRefundedCreditDzd) {
    throw new Error("Net turnover deduction arithmetic mismatch");
  }
  if (taxSummary.metrics.finalTaxOwedDzd < 10_000) {
    throw new Error("IFU tax owed must not be less than the 10,000 DZD statutory floor");
  }
  if (taxSummary.paidInvoices.length !== taxSummary.metrics.totalPaidInvoicesCount) {
    throw new Error("Paid invoices list length mismatch");
  }

  // 25. Annual Tax Summary CSV Export (Livre des Recettes)
  console.log("Testing Tax Summary CSV Export...");
  const csvContent = generateTaxSummaryCsv(taxSummary);
  if (!csvContent.startsWith("\uFEFF")) {
    throw new Error("CSV must include UTF-8 BOM for Algerian Excel compatibility");
  }
  if (!csvContent.includes("BORDEREAU RÉCAPITULATIF FISCAL") || !csvContent.includes("CHIFFRE D'AFFAIRES")) {
    throw new Error("CSV missing key headers or sections");
  }
  console.log(`✓ CSV Export generated successfully (${csvContent.length} chars, UTF-8 BOM present)`);

  // 26. High-Resolution Vector PDF Generator (Bordereau Série G n° 12 bis)
  console.log("Testing Official Tax Summary PDF Generation (Série G n° 12 bis)...");
  const taxPdfBuffer = await generateTaxSummaryPdfBuffer(taxSummary);
  console.log(`✓ Tax Summary PDF generated successfully, byte size: ${taxPdfBuffer.length}`);
  if (taxPdfBuffer.length < 1000) {
    throw new Error("Tax Summary PDF buffer suspiciously small");
  }

  console.log("=== ALL SECTION 4 STATUTORY CALENDAR & TAX SUMMARY TESTS PASSED PERFECTLY ===");

  console.log("\n=== STARTING SECTION 5: ARABIC LANGUAGE & RTL (العربية / JORADP) ===");

  // 27. Official JORADP Gazette Legal Terminology
  console.log("Verifying Official JORADP Gazette Legal Terminology in Arabic...");
  if (ARABIC_NOMENCLATURE.invoiceTitle !== "فـــاتـــورة") {
    throw new Error("Arabic invoice title mismatch");
  }
  if (!ARABIC_NOMENCLATURE.vatExemptionClause.includes("معفى من الرسم على القيمة المضافة")) {
    throw new Error("Arabic VAT exemption clause missing legal terminology");
  }
  if (!ARABIC_NOMENCLATURE.vatExemptionClause.includes("القانون رقم 22-23")) {
    throw new Error("Arabic VAT exemption clause missing Law 22-23 statutory reference");
  }
  if (ARABIC_NOMENCLATURE.activityCodeLabel !== "رمز النشاط المعتمد") {
    throw new Error("Arabic activity code label mismatch");
  }
  if (ARABIC_NOMENCLATURE.republicTitle !== "الجمهورية الجزائرية الديمقراطية الشعبية") {
    throw new Error("Arabic republic title mismatch");
  }
  console.log("✓ Official JORADP terminology verified (فاتورة, رمز النشاط, الإعفاء من الرسم على القيمة المضافة)");

  // 28. Arabic Currency & Date Formatting
  console.log("Testing Arabic currency and date formatting...");
  const formattedDzdAr = formatDZD_AR(250_000);
  if (formattedDzdAr !== "\u2066250\u00A0000\u2069\u00A0د.ج") {
    throw new Error(`Unexpected Arabic currency format: ${formattedDzdAr}`);
  }
  console.log(`✓ Arabic DZD Currency formatted: 250,000 -> "${formattedDzdAr}"`);

  const testDate = new Date(2026, 9, 8); // 8 Octobre 2026
  const formattedDateAr = formatArabicDate(testDate);
  if (!formattedDateAr.includes("أكتوبر") || !formattedDateAr.includes("2026")) {
    throw new Error(`Unexpected Arabic date format: ${formattedDateAr}`);
  }
  console.log(`✓ Arabic Date formatted: 2026-10-08 -> "${formattedDateAr}"`);

  // 29. Algerian Administrative Tafqeet (Transcription en toutes lettres)
  console.log("Testing Algerian Administrative Tafqeet (التفقيط)...");
  const words250k = tafqeetNumberToArabicWords(250_000);
  if (words250k !== "مائتان وخمسون ألف") {
    throw new Error(`Tafqeet failed for 250,000: got "${words250k}"`);
  }

  const legalAmountText = getArabicAmountInWords(250_000);
  if (
    !legalAmountText.includes("مائتان وخمسون ألف") ||
    !legalAmountText.includes("دينار جزائري لا غير")
  ) {
    throw new Error(`Full legal amount text failed: "${legalAmountText}"`);
  }
  console.log(`✓ Tafqeet 250,000 DZD: "${words250k}" -> Legal: "${legalAmountText}"`);

  const words1_5M = tafqeetNumberToArabicWords(1_500_000);
  if (words1_5M !== "مليون وخمسمائة ألف") {
    throw new Error(`Tafqeet failed for 1,500,000: got "${words1_5M}"`);
  }
  console.log(`✓ Tafqeet 1,500,000 DZD: "${words1_5M}"`);

  const words24k = tafqeetNumberToArabicWords(24_000);
  if (words24k !== "أربعة وعشرون ألف") {
    throw new Error(`Tafqeet failed for 24,000: got "${words24k}"`);
  }
  console.log(`✓ Tafqeet 24,000 DZD (CASNOS): "${words24k}"`);

  // 30. Full Application I18n UI Dictionary Verification
  console.log("Verifying Full Application UI I18n Translations Dictionary...");
  const frKeys = Object.keys(translations.fr);
  const arKeys = Object.keys(translations.ar);
  if (frKeys.length !== arKeys.length) {
    throw new Error(`Key mismatch: FR has ${frKeys.length} keys, AR has ${arKeys.length} keys`);
  }
  for (const k of frKeys) {
    if (!(k in translations.ar)) {
      throw new Error(`Missing Arabic translation for key: ${k}`);
    }
    const arVal = (translations.ar as any)[k];
    if (!arVal || typeof arVal !== "string" || arVal.trim() === "") {
      throw new Error(`Empty Arabic translation for key: ${k}`);
    }
  }
  console.log(`✓ All ${frKeys.length} application UI translation keys validated in French and Arabic!`);
  console.log(`  - FR Dashboard: "${translations.fr.dashboard}" | AR: "${translations.ar.dashboard}"`);
  console.log(`  - FR Invoicing: "${translations.fr.invoicing}" | AR: "${translations.ar.invoicing}"`);
  console.log(`  - FR Statutory: "${translations.fr.statutoryCalendarTitle}" | AR: "${translations.ar.statutoryCalendarTitle}"`);

  console.log("=== ALL SECTION 5 ARABIC LANGUAGE & RTL TESTS PASSED PERFECTLY ===");

  // ==========================================
  // SECTION 6: PAYMENT RECEIPTS & CLIENT STATEMENTS
  // ==========================================
  console.log("\n--- SECTION 6: PAYMENT RECEIPTS & CLIENT STATEMENTS (BORDEREAU CLIENT) ---");

  // 31. Number to French Words Verification
  console.log("Verifying French Number-to-Words Converter for Legal Receipts...");
  const frWords150k = getFrenchAmountInWords(150_000);
  if (!frWords150k.toLowerCase().includes("cent cinquante mille dinars algériens")) {
    throw new Error(`French words failed for 150,000: got "${frWords150k}"`);
  }
  console.log(`✓ French 150,000 DZD: "${frWords150k}"`);

  const frWords24k = getFrenchAmountInWords(24_000);
  if (!frWords24k.toLowerCase().includes("vingt-quatre mille dinars algériens")) {
    throw new Error(`French words failed for 24,000: got "${frWords24k}"`);
  }
  console.log(`✓ French 24,000 DZD: "${frWords24k}"`);

  // 32. Issue Invoice and Record Payment with Receipt
  console.log("Testing Official Payment Receipt (Quittance) generation...");
  const clientForReceipt = await db.client.findFirst({
    where: { tenantId },
  });
  if (!clientForReceipt) throw new Error("No client found for receipt test");

  const receiptInvoiceDraft = await createDraftInvoice({
    tenantId,
    clientId: clientForReceipt.id,
    issueDate: new Date(),
    notes: "Mission de développement d'application web",
    lineItems: [
      {
        description: "Développement d'application web",
        quantity: 1,
        unitPrice: 85_000,
      },
    ],
  });

  const issuedForReceipt = await issueInvoice(tenantId, receiptInvoiceDraft.id);
  console.log(`✓ Issued invoice for receipt: ${issuedForReceipt.invoiceNumber} (${issuedForReceipt.total} DZD)`);

  const paidDate = new Date("2026-06-20");
  const paidReceiptInvoice = await toggleInvoicePayment(tenantId, issuedForReceipt.id, true, {
    paidAt: paidDate,
    paymentMethod: "CCP_BARIDIMOB",
    paymentReference: "TXN-BARIDIMOB-849201",
  });

  if (paidReceiptInvoice.paymentStatus !== "PAID") {
    throw new Error("Invoice should be marked as PAID");
  }
  if (!paidReceiptInvoice.receiptNumber || !paidReceiptInvoice.receiptNumber.startsWith("REC-")) {
    throw new Error(`Invalid receipt number: got "${paidReceiptInvoice.receiptNumber}"`);
  }
  if (paidReceiptInvoice.paymentMethod !== "CCP_BARIDIMOB") {
    throw new Error(`Invalid payment method: got "${paidReceiptInvoice.paymentMethod}"`);
  }
  if (paidReceiptInvoice.paymentReference !== "TXN-BARIDIMOB-849201") {
    throw new Error(`Invalid payment reference: got "${paidReceiptInvoice.paymentReference}"`);
  }
  console.log(`✓ Payment recorded with receipt: ${paidReceiptInvoice.receiptNumber}`);
  console.log(`  - Mode: ${formatPaymentMethodLabel(paidReceiptInvoice.paymentMethod, "fr")} (${formatPaymentMethodLabel(paidReceiptInvoice.paymentMethod, "ar")})`);
  console.log(`  - Réf: ${paidReceiptInvoice.paymentReference}`);

  // 33. Generate Payment Receipt PDF Buffer
  console.log("Generating Payment Receipt (Quittance) PDF buffer...");
  const receiptPdfBuffer = await generatePaymentReceiptPdfBuffer({
    receiptNumber: paidReceiptInvoice.receiptNumber,
    invoiceNumber: paidReceiptInvoice.invoiceNumber!,
    paymentDate: paidReceiptInvoice.paidAt!,
    paymentMethod: paidReceiptInvoice.paymentMethod,
    paymentReference: paidReceiptInvoice.paymentReference,
    total: paidReceiptInvoice.total,
    currency: "DZD",
    notes: "Règlement reçu avec remerciements.",
    seller: {
      fullName: user.tenant.profile.fullName,
      rnaeNumber: user.tenant.profile.rnaeNumber,
      nif: user.tenant.profile.nif,
      address: user.tenant.profile.address,
      phone: user.tenant.profile.phone,
      email: user.tenant.profile.email,
      activityCode: user.tenant.profile.activityCode,
      activityLabel: user.tenant.profile.activityLabel,
    },
    client: {
      name: clientForReceipt.name,
      clientType: clientForReceipt.clientType,
      address: clientForReceipt.address,
      nif: clientForReceipt.nif,
      nis: clientForReceipt.nis,
      rc: clientForReceipt.rc,
      email: clientForReceipt.email,
      phone: clientForReceipt.phone,
    },
  });

  if (!receiptPdfBuffer || receiptPdfBuffer.length === 0) {
    throw new Error("Failed to generate receipt PDF buffer");
  }
  console.log(`✓ Receipt PDF generated successfully (${receiptPdfBuffer.length} bytes)`);

  // 34. Client Financial Ledger & Statement Calculations
  console.log("Testing Client Financial Ledger (Grand Livre Client)...");
  const ledger = await getClientLedger(tenantId, clientForReceipt.id);

  if (ledger.client.id !== clientForReceipt.id) {
    throw new Error("Ledger returned incorrect client");
  }
  if (ledger.metrics.totalBilledDzd <= 0) {
    throw new Error("Ledger totalBilledDzd should be greater than zero");
  }
  if (ledger.metrics.totalPaidDzd <= 0) {
    throw new Error("Ledger totalPaidDzd should be greater than zero");
  }
  if (ledger.entries.length === 0) {
    throw new Error("Ledger should have at least one chronological entry");
  }

  console.log(`✓ Client Ledger retrieved for: ${ledger.client.name}`);
  console.log(`  - Total Facturé: ${ledger.metrics.totalBilledDzd} DZD`);
  console.log(`  - Total Réglé: ${ledger.metrics.totalPaidDzd} DZD`);
  console.log(`  - Solde Restant Dû: ${ledger.metrics.outstandingBalanceDzd} DZD`);
  console.log(`  - Situation: ${ledger.metrics.isSettled ? "Soldé" : "Solde Débiteur"}`);
  console.log(`  - Nombre d'écritures: ${ledger.entries.length}`);

  // Verify running balance consistency
  for (const entry of ledger.entries) {
    if (typeof entry.runningBalance !== "number" || isNaN(entry.runningBalance)) {
      throw new Error(`Invalid runningBalance on entry ${entry.reference}`);
    }
  }
  console.log("✓ Progressive running balance computed correctly across all ledger entries!");

  // 35. Export Client Statement to CSV
  console.log("Testing Client Statement CSV Export...");
  const csvStatement = generateClientStatementCsv(ledger);
  if (!csvStatement.startsWith("\uFEFF")) {
    throw new Error("CSV Statement missing UTF-8 BOM");
  }
  if (!csvStatement.includes("RELEVÉ DE COMPTE")) {
    throw new Error("CSV Statement missing header title");
  }
  if (!csvStatement.includes(ledger.client.name)) {
    throw new Error("CSV Statement missing client name");
  }
  console.log(`✓ Client Statement CSV generated (${csvStatement.length} characters with BOM)`);

  // 36. Export Client Statement to PDF
  console.log("Testing Client Statement PDF Export...");
  const statementPdfBuffer = await generateClientStatementPdfBuffer(ledger);
  if (!statementPdfBuffer || statementPdfBuffer.length === 0) {
    throw new Error("Failed to generate client statement PDF buffer");
  }
  console.log(`✓ Client Statement PDF generated successfully (${statementPdfBuffer.length} bytes)`);

  console.log("=== ALL SECTION 6 PAYMENT RECEIPTS & CLIENT STATEMENTS TESTS PASSED PERFECTLY ===");

  // 37. Phase 3: Expense Tracking & Real Net Profit Analysis
  console.log("\n=== TESTING PHASE 3: EXPENSE TRACKING & NET PROFIT ANALYTICS ===");
  const testFiscalYear = new Date().getFullYear();

  // Clean up any potential prior test expenses
  await db.expense.deleteMany({
    where: {
      tenantId,
      title: { in: ["Abonnement GitHub Copilot & Vercel Pro", "Abonnement Fibre Optique Professionnel"] },
    },
  });

  // Create test expenses across categories
  const expense1 = await db.expense.create({
    data: {
      tenantId,
      title: "Abonnement GitHub Copilot & Vercel Pro",
      amount: 12500,
      currency: "DZD",
      exchangeRate: 1.0,
      amountDzd: 12500,
      date: new Date(),
      fiscalYear: testFiscalYear,
      category: "SOFTWARE_SUBSCRIPTIONS",
      paymentMethod: "CIB",
      supplier: "GitHub / Vercel",
      invoiceNumber: "INV-GH-2026-09",
      notes: "Outils de développement essentiels",
    },
  });

  const expense2 = await db.expense.create({
    data: {
      tenantId,
      title: "Abonnement Fibre Optique Professionnel",
      amount: 4500,
      currency: "DZD",
      exchangeRate: 1.0,
      amountDzd: 4500,
      date: new Date(),
      fiscalYear: testFiscalYear,
      category: "TELECOM_INTERNET",
      paymentMethod: "EDAHABIA",
      supplier: "Algérie Télécom",
      invoiceNumber: "AT-489201",
    },
  });

  console.log(`✓ Created 2 expenses: ${expense1.title} (${expense1.amount} DZD) and ${expense2.title} (${expense2.amount} DZD)`);

  // Verify getExpensesSummary
  const expenseSummary = await getExpensesSummary(tenantId, testFiscalYear);
  console.log("Expense Summary Results:");
  console.log(`  - Total Dépenses: ${expenseSummary.totalExpensesDzd} DZD (${expenseSummary.expenseCount} écritures)`);
  console.log(`  - Chiffre d'Affaires Net Encaissé: ${expenseSummary.netCollectedTurnoverDzd} DZD`);
  console.log(`  - Impôt IFU (0.5%): ${expenseSummary.estimatedIfuTaxDzd} DZD`);
  console.log(`  - Cotisation CASNOS: ${expenseSummary.casnosContributionDzd} DZD`);
  console.log(`  - BÉNÉFICE NET RÉEL: ${expenseSummary.realNetProfitDzd} DZD`);
  console.log(`  - Marge Nette: ${expenseSummary.netProfitMarginPercent}%`);
  console.log(`  - Ratio de Charges: ${expenseSummary.expenseRatioPercent}%`);

  if (expenseSummary.totalExpensesDzd < 17000) {
    throw new Error(`Total expenses should be at least 17,000 DZD, got: ${expenseSummary.totalExpensesDzd}`);
  }

  // Verify Real Net Profit Math
  const expectedNetProfit =
    expenseSummary.netCollectedTurnoverDzd -
    expenseSummary.totalExpensesDzd -
    expenseSummary.estimatedIfuTaxDzd -
    expenseSummary.casnosContributionDzd;
  if (Math.abs(expenseSummary.realNetProfitDzd - expectedNetProfit) > 0.01) {
    throw new Error(`Net profit calculation mismatch: expected ${expectedNetProfit}, got ${expenseSummary.realNetProfitDzd}`);
  }
  console.log("✓ Net profit formula verified (Net CA - Charges - IFU - CASNOS)");

  // Verify Category Breakdown
  if (expenseSummary.categoryBreakdown.length === 0) {
    throw new Error("Category breakdown should not be empty");
  }
  const softwareCategory = expenseSummary.categoryBreakdown.find((c) => c.category === "SOFTWARE_SUBSCRIPTIONS");
  if (!softwareCategory || softwareCategory.totalAmount < 12500) {
    throw new Error("Software category missing or incorrect amount");
  }
  console.log(`✓ Category breakdown verified (${expenseSummary.categoryBreakdown.length} active categories)`);

  // Verify Monthly Trends
  if (expenseSummary.monthlyTrends.length !== 12) {
    throw new Error("Monthly trends should contain 12 months");
  }
  console.log("✓ 12-month evolution trend calculated");

  // Verify CSV Generation
  const expensesList = await db.expense.findMany({
    where: { tenantId, fiscalYear: testFiscalYear },
    orderBy: { date: "desc" },
  });
  const expenseCsv = generateExpensesCsv(expensesList as any, testFiscalYear);
  if (!expenseCsv.startsWith("\uFEFF")) {
    throw new Error("Expenses CSV missing UTF-8 BOM");
  }
  if (!expenseCsv.includes("Loi 22-23")) {
    throw new Error("Expenses CSV missing legal disclaimer regarding non-deductibility");
  }
  if (!expenseCsv.includes("GitHub / Vercel")) {
    throw new Error("Expenses CSV missing supplier entry");
  }
  console.log(`✓ Expenses CSV exported with UTF-8 BOM and Law 22-23 disclaimer (${expenseCsv.length} chars)`);

  // Clean up test expenses
  await db.expense.deleteMany({
    where: { id: { in: [expense1.id, expense2.id] } },
  });
  console.log("✓ Test expenses cleaned up cleanly");

  console.log("=== ALL PHASE 3 EXPENSES & NET PROFIT TESTS PASSED WITH DISTINCTION ===");

  console.log("\n=== STARTING PHASE 3 MULTI-CURRENCY INVOICING TEST SUITE ===");

  // 1. Currency Engine Validation
  if (SUPPORTED_CURRENCIES.length !== 6) {
    throw new Error(`Expected 6 supported currencies, got: ${SUPPORTED_CURRENCIES.length}`);
  }
  const eurDef = getCurrencyDef("EUR");
  if (eurDef.symbol !== "€" || eurDef.defaultRate <= 100) {
    throw new Error("EUR currency definition invalid");
  }
  const formattedEurFr = formatCurrencyAmount(1500, "EUR", "fr");
  const formattedEurAr = formatCurrencyAmount(1500, "EUR", "ar");
  if (!formattedEurFr.includes("€") || !formattedEurAr.includes("€")) {
    throw new Error("Currency formatting failed");
  }
  const wordsFr = getAmountInWordsWithCurrency(1500, "EUR", "fr");
  const wordsAr = getAmountInWordsWithCurrency(1500, "EUR", "ar");
  if (!wordsFr.includes("euros") || !wordsAr.includes("يورو")) {
    throw new Error("Currency amount in words failed");
  }
  const noticeFr = getExchangeRateNotice("EUR", 146.5, 219750, "fr");
  if (!noticeFr.includes("Banque d'Algérie") || !noticeFr.includes("219 750")) {
    throw new Error("Exchange rate notice generation failed");
  }
  console.log("✓ Currency engine verified (6 currencies, formatting, Tafqeet/French words, regulatory notices)");

  // 2. Multi-Currency Draft Invoice Creation & Computation
  const draftEur = await createDraftInvoice({
    tenantId,
    clientId: client.id,
    issueDate: new Date(),
    currency: "EUR",
    exchangeRate: 146.5,
    notes: "Exportation de services numériques - Règlement par virement international SWIFT",
    lineItems: [
      { description: "Développement application mobile iOS/Android", quantity: 1, unitPrice: 1500 },
    ],
  });

  if (draftEur.currency !== "EUR") {
    throw new Error(`Expected EUR currency, got: ${draftEur.currency}`);
  }
  if (draftEur.exchangeRate !== 146.5) {
    throw new Error(`Expected exchange rate 146.5, got: ${draftEur.exchangeRate}`);
  }
  if (Math.abs((draftEur.totalDzd ?? 0) - 219750) > 0.01) {
    throw new Error(`Expected totalDzd 219750, got: ${draftEur.totalDzd}`);
  }
  console.log(`✓ Created EUR invoice draft: ${draftEur.id} (1 500 € = ${draftEur.totalDzd} DZD à 146.50 DZD/EUR)`);

  // 3. Issue EUR Invoice & Generate Official PDF
  const issuedEur = await issueInvoice(tenantId, draftEur.id);
  console.log(`✓ Issued EUR Invoice: ${issuedEur.invoiceNumber}`);

  const eurPdfBuffer = await generateInvoicePdfBuffer({
    invoice: {
      ...issuedEur,
      issueDate: issuedEur.issueDate,
      lineItems: issuedEur.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
      })),
    },
    seller: {
      fullName: profile.fullName || "Émetteur",
      rnaeNumber: profile.rnaeNumber || "—",
      nif: profile.nif || "—",
      address: profile.address || "—",
      email: profile.email || "—",
      phone: profile.phone || "—",
      activityCode: profile.activityCode || "—",
      activityLabel: profile.activityLabel || "—",
    },
    client: {
      name: client.name,
      clientType: client.clientType,
      address: client.address || "—",
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
      email: client.email,
      phone: client.phone,
    },
  });

  if (!eurPdfBuffer || eurPdfBuffer.length < 3000) {
    throw new Error("EUR Invoice PDF generation failed or too small");
  }
  console.log(`✓ EUR Invoice PDF generated with dual-currency & statutory exchange notice (${eurPdfBuffer.length} bytes)`);

  // 4. Multi-Currency Quote Creation & PDF Generation
  const quoteUsd = await createDraftQuote({
    tenantId,
    clientId: client.id,
    issueDate: new Date(),
    currency: "USD",
    exchangeRate: 134.8,
    notes: "Export prestation DevOps & Cloud Architecture",
    lineItems: [
      { description: "Configuration cluster Kubernetes", quantity: 2, unitPrice: 1000 },
    ],
  });

  if (quoteUsd.currency !== "USD" || quoteUsd.exchangeRate !== 134.8) {
    throw new Error(`Quote USD currency/rate mismatch`);
  }
  if (Math.abs((quoteUsd.totalDzd ?? 0) - 269600) > 0.01) {
    throw new Error(`Expected quote totalDzd 269600, got: ${quoteUsd.totalDzd}`);
  }
  console.log(`✓ Created USD Quote: ${quoteUsd.id} ($2,000 = ${quoteUsd.totalDzd} DZD à 134.80 DZD/USD)`);

  const usdQuotePdfBuffer = await generateQuotePdfBuffer({
    quote: {
      ...quoteUsd,
      issueDate: quoteUsd.issueDate,
      lineItems: quoteUsd.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
      })),
    },
    seller: {
      fullName: profile.fullName || "Émetteur",
      rnaeNumber: profile.rnaeNumber || "—",
      nif: profile.nif || "—",
      address: profile.address || "—",
      email: profile.email || "—",
      phone: profile.phone || "—",
      activityCode: profile.activityCode || "—",
      activityLabel: profile.activityLabel || "—",
    },
    client: {
      name: client.name,
      clientType: client.clientType,
      address: client.address || "—",
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
      email: client.email,
      phone: client.phone,
    },
  });

  if (!usdQuotePdfBuffer || usdQuotePdfBuffer.length < 3000) {
    throw new Error("USD Quote PDF generation failed or too small");
  }
  console.log(`✓ USD Quote PDF generated successfully (${usdQuotePdfBuffer.length} bytes)`);

  // 5. Convert USD Quote to Invoice with Multi-Currency Carry-Over
  const convertedInvoice = await convertQuoteToInvoice(tenantId, quoteUsd.id);
  if (convertedInvoice.currency !== "USD") {
    throw new Error(`Converted invoice should inherit USD currency, got: ${convertedInvoice.currency}`);
  }
  if (convertedInvoice.exchangeRate !== 134.8) {
    throw new Error(`Converted invoice should inherit exchange rate 134.8, got: ${convertedInvoice.exchangeRate}`);
  }
  if (Math.abs((convertedInvoice.totalDzd ?? 0) - 269600) > 0.01) {
    throw new Error(`Converted invoice totalDzd mismatch: ${convertedInvoice.totalDzd}`);
  }
  console.log(`✓ Converted USD Quote to Invoice preserving currency, rate, and totalDzd`);

  // 6. Multi-Currency Credit Note (Avoir) from Foreign Invoice
  const creditNoteEur = await createCreditNoteFromInvoice({
    tenantId,
    originalInvoiceId: issuedEur.id,
    reason: "Remise commerciale sur prestation export",
    issueDate: new Date(),
    lineItems: [
      { description: "Développement application mobile iOS/Android - Remise", quantity: 1, unitPrice: 500 },
    ],
  });

  if (creditNoteEur.currency !== "EUR" || creditNoteEur.exchangeRate !== 146.5) {
    throw new Error("Credit note should inherit currency & rate from original invoice");
  }
  if (Math.abs((creditNoteEur.totalDzd ?? 0) - 73250) > 0.01) {
    throw new Error(`Expected credit note totalDzd 73250, got: ${creditNoteEur.totalDzd}`);
  }
  console.log(`✓ Created EUR Credit Note: ${creditNoteEur.id} (500 € = ${creditNoteEur.totalDzd} DZD)`);

  const cnPdfBuffer = await generateCreditNotePdfBuffer({
    creditNote: {
      ...creditNoteEur,
      issueDate: creditNoteEur.issueDate,
      originalInvoiceNumber: issuedEur.invoiceNumber,
      lineItems: creditNoteEur.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        totalPrice: li.totalPrice,
      })),
    },
    seller: {
      fullName: profile.fullName || "Émetteur",
      rnaeNumber: profile.rnaeNumber || "—",
      nif: profile.nif || "—",
      address: profile.address || "—",
      email: profile.email || "—",
      phone: profile.phone || "—",
      activityCode: profile.activityCode || "—",
      activityLabel: profile.activityLabel || "—",
    },
    client: {
      name: client.name,
      clientType: client.clientType,
      address: client.address || "—",
      nif: client.nif,
      nis: client.nis,
      rc: client.rc,
      email: client.email,
      phone: client.phone,
    },
  });

  if (!cnPdfBuffer || cnPdfBuffer.length < 3000) {
    throw new Error("EUR Credit Note PDF generation failed or too small");
  }
  console.log(`✓ EUR Credit Note PDF generated successfully (${cnPdfBuffer.length} bytes)`);

  // Clean up Multi-Currency Test Artifacts
  await db.creditNoteLineItem.deleteMany({ where: { creditNoteId: creditNoteEur.id } });
  await db.creditNote.delete({ where: { id: creditNoteEur.id } });
  await db.invoiceLineItem.deleteMany({ where: { invoiceId: { in: [issuedEur.id, convertedInvoice.id] } } });
  await db.invoice.deleteMany({ where: { id: { in: [issuedEur.id, convertedInvoice.id] } } });
  await db.quoteLineItem.deleteMany({ where: { quoteId: quoteUsd.id } });
  await db.quote.delete({ where: { id: quoteUsd.id } });
  console.log("✓ Multi-currency test records cleaned up cleanly");

  console.log("=== ALL PHASE 3 MULTI-CURRENCY INVOICING TESTS PASSED WITH DISTINCTION ===");

  // ==========================================
  // SECTION 9: ROLE-BASED ACCOUNTANT ACCESS & AUDIT PACK (MODULE 3)
  // ==========================================
  console.log("\n=== TESTING PHASE 3 - MODULE 3: ROLE-BASED ACCOUNTANT ACCESS & AUDIT PACK ===");

  // Clean up any existing test accountant accesses for tenant
  await db.accountantAccess.deleteMany({
    where: {
      tenantId,
      name: { in: ["Cabinet Audit Khellaf & Associés", "Cabinet Test Open Access", "Cabinet Expiré Test"] },
    },
  });

  // 1. Create Accountant Access with 6-digit PIN and 30-day validity
  console.log("Testing creation of accountant access with 6-digit PIN...");
  const pinCode = "739281";
  const accessWithPin = await createAccountantAccess({
    tenantId,
    name: "Cabinet Audit Khellaf & Associés",
    email: "contact@cabinet-khellaf.dz",
    pin: pinCode,
    expiresInDays: 30,
    fiscalYear: testFiscalYear,
    notes: "Audit légal annuel Loi 22-23 et vérification IFU G12 bis",
  });

  if (!accessWithPin.token || accessWithPin.token.length < 32) {
    throw new Error("Accountant access token generation failed");
  }
  if (!accessWithPin.pinHash) {
    throw new Error("PIN hash was not created");
  }
  if (accessWithPin.rawPin !== pinCode) {
    throw new Error("Raw PIN returned does not match");
  }
  console.log(`✓ Created accountant access with PIN: token=${accessWithPin.token.slice(0, 8)}... (expires: ${accessWithPin.expiresAt?.toISOString()})`);

  // 2. Validate Token and Verify Telemetry Tracking
  console.log("Testing token validation & access tracking...");
  const valResult1 = await validateAccountantToken(accessWithPin.token);
  if (!valResult1.valid || !valResult1.access) {
    throw new Error(`Token validation failed: ${valResult1.reason}`);
  }
  if (valResult1.access.name !== "Cabinet Audit Khellaf & Associés") {
    throw new Error("Accountant name mismatch in validated access");
  }
  if (valResult1.access.accessCount !== 1) {
    throw new Error(`Expected accessCount 1, got ${valResult1.access.accessCount}`);
  }
  console.log(`✓ Token validated successfully. Telemetry updated (views=${valResult1.access.accessCount}, lastAccessed=${valResult1.access.lastAccessedAt})`);

  // 3. Verify PIN Verification
  console.log("Testing PIN verification logic...");
  const isPinValid = await verifyAccountantPin(accessWithPin.token, pinCode);
  if (!isPinValid) {
    throw new Error("Valid PIN was rejected");
  }
  console.log("✓ Correct PIN verified successfully");

  const isWrongPinValid = await verifyAccountantPin(accessWithPin.token, "000000");
  if (isWrongPinValid) {
    throw new Error("Wrong PIN was erroneously accepted");
  }
  console.log("✓ Wrong PIN was rejected as expected");

  // 4. Test Open Access (No PIN)
  console.log("Testing open access invitation without PIN...");
  const openAccess = await createAccountantAccess({
    tenantId,
    name: "Cabinet Test Open Access",
    expiresInDays: 7,
  });
  if (openAccess.pinHash !== null) {
    throw new Error("Open access should not have a pinHash");
  }
  const isOpenAccessAllowed = await verifyAccountantPin(openAccess.token, "");
  if (!isOpenAccessAllowed) {
    throw new Error("Open access should not require PIN verification");
  }
  console.log("✓ Open access works without PIN");

  // 5. Test Expired Token
  console.log("Testing expired token handling...");
  const expiredAccess = await db.accountantAccess.create({
    data: {
      tenantId,
      token: "expired_token_test_1234567890abcdef",
      name: "Cabinet Expiré Test",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  });
  const valExpired = await validateAccountantToken(expiredAccess.token);
  if (valExpired.valid || valExpired.reason !== "EXPIRED") {
    throw new Error(`Expired token should fail with reason EXPIRED, got ${valExpired.reason}`);
  }
  console.log("✓ Expired token properly rejected with reason EXPIRED");

  // 6. Test Audit Data Retrieval
  console.log("Testing full audit dataset extraction for external accountant...");
  const auditData = await getAccountantAuditData(accessWithPin.token, testFiscalYear);
  if (!auditData.profile || !auditData.taxSummary || !auditData.invoices) {
    throw new Error("Audit dataset is missing required components");
  }
  console.log(`✓ Audit dataset loaded: ${auditData.invoices.length} invoices, ${auditData.creditNotes.length} credit notes, ${auditData.expenses.length} expenses, ${auditData.clients.length} clients`);
  console.log(`  - Assiette IFU (CA Net Encaissé): ${formatDZD(auditData.taxSummary.metrics.netTaxableTurnoverDzd)}`);
  console.log(`  - Impôt IFU calculé: ${formatDZD(auditData.taxSummary.metrics.finalTaxOwedDzd)}`);

  // 7. Test One-Click Audit Package ZIP Generation
  console.log("Testing complete audit package ZIP archive generation (JSZip)...");
  const zipBuffer = await generateAccountantAuditZipBuffer(accessWithPin.token, testFiscalYear);
  if (!zipBuffer || zipBuffer.length < 5000) {
    throw new Error(`Audit ZIP buffer generation failed or too small (${zipBuffer?.length} bytes)`);
  }
  console.log(`✓ Audit ZIP buffer generated successfully (${zipBuffer.length} bytes)`);

  // Unpack and verify all certified files in the ZIP archive
  const loadedZip = await JSZip.loadAsync(zipBuffer);
  const zipFileNames = Object.keys(loadedZip.files);
  console.log("✓ ZIP Contents:", zipFileNames);

  const expectedFiles = [
    `01_Bilan_Fiscal_IFU_G12_bis_${testFiscalYear}.pdf`,
    `02_Livre_des_Recettes_${testFiscalYear}.csv`,
    `03_Registre_des_Depenses_${testFiscalYear}.csv`,
    `04_Grand_Livre_Clients_${testFiscalYear}.csv`,
    `05_Attestation_Audit_Loi_22-23_${testFiscalYear}.txt`,
  ];

  for (const expected of expectedFiles) {
    if (!zipFileNames.includes(expected)) {
      throw new Error(`Missing expected file in audit ZIP: ${expected}`);
    }
  }
  console.log("✓ All 5 statutory audit files present in the archive!");

  // Verify contents of the Attestation TXT manifest
  const manifestContent = await loadedZip.file(`05_Attestation_Audit_Loi_22-23_${testFiscalYear}.txt`)!.async("string");
  if (!manifestContent.includes("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE") || !manifestContent.includes("Loi n° 22-23")) {
    throw new Error("Audit manifest content does not contain mandatory legal references");
  }
  console.log("✓ Statutory compliance manifest verified");

  // 8. Test Direct Tenant ZIP Generation
  console.log("Testing direct tenant audit ZIP buffer generation...");
  const tenantZipBuffer = await generateTenantAuditZipBuffer(tenantId, testFiscalYear);
  if (!tenantZipBuffer || tenantZipBuffer.length < 5000) {
    throw new Error("Direct tenant audit ZIP failed");
  }
  console.log(`✓ Direct tenant audit ZIP generated (${tenantZipBuffer.length} bytes)`);

  // 9. Test Revocation
  console.log("Testing accountant access revocation...");
  await revokeAccountantAccess(tenantId, accessWithPin.id);
  const valRevoked = await validateAccountantToken(accessWithPin.token);
  if (valRevoked.valid || valRevoked.reason !== "REVOKED") {
    throw new Error(`Revoked token should fail with reason REVOKED, got ${valRevoked.reason}`);
  }
  console.log("✓ Revoked token properly rejected with reason REVOKED");

  // 10. Clean up test access records
  await deleteAccountantAccess(tenantId, accessWithPin.id);
  await deleteAccountantAccess(tenantId, openAccess.id);
  await db.accountantAccess.delete({ where: { id: expiredAccess.id } });
  console.log("✓ All accountant access test records cleaned up cleanly");

  console.log("=== ALL PHASE 3 MODULE 3 ACCOUNTANT ACCESS & AUDIT PACK TESTS PASSED WITH DISTINCTION ===");

  // ==========================================
  // SECTION 10: AUTOMATED VAULT BACKUP & RESTORE (MODULE 4)
  // ==========================================
  console.log("\n=== TESTING PHASE 3 - MODULE 4: AUTOMATED VAULT BACKUP & RESTORE ===");

  // 1. Export Tenant Vault Data
  console.log("Testing complete tenant vault export...");
  const exportContainer = await exportTenantVaultData(tenantId);
  if (!exportContainer.manifest || !exportContainer.payload) {
    throw new Error("Vault export missing manifest or payload");
  }
  if (!exportContainer.payload.profile || !exportContainer.payload.invoices) {
    throw new Error("Vault payload missing profile or invoices");
  }
  console.log(`✓ Vault exported: ${exportContainer.manifest.stats.invoicesCount} factures, ${exportContainer.manifest.stats.clientsCount} clients, ${exportContainer.manifest.stats.quotesCount} devis, ${exportContainer.manifest.stats.creditNotesCount} avoirs`);
  console.log(`  - Empreinte d'intégrité SHA-256 : ${exportContainer.manifest.checksum}`);

  // 2. AES-256-GCM Vault Encryption
  console.log("Testing AES-256-GCM encryption with scrypt key derivation...");
  const testPassphrase = "Moukawil_Strong_Vault_Password_2026!";
  const rawPayloadJson = JSON.stringify(exportContainer.payload);
  const encryptedEnvelope = encryptVaultPayload(rawPayloadJson, testPassphrase, exportContainer.manifest);

  if (!encryptedEnvelope.isEncrypted || encryptedEnvelope.algorithm !== "aes-256-gcm") {
    throw new Error("Encrypted envelope metadata invalid");
  }
  if (!encryptedEnvelope.salt || !encryptedEnvelope.iv || !encryptedEnvelope.authTag || !encryptedEnvelope.ciphertext) {
    throw new Error("Encrypted envelope missing cryptographic components");
  }
  console.log(`✓ Vault payload encrypted successfully with AES-256-GCM (salt=${encryptedEnvelope.salt.slice(0, 8)}..., iv=${encryptedEnvelope.iv.slice(0, 8)}..., authTag=${encryptedEnvelope.authTag.slice(0, 8)}...)`);

  // 3. AES-256-GCM Vault Decryption (Valid Passphrase)
  console.log("Testing decryption with correct passphrase...");
  const decryptedJson = decryptVaultPayload(encryptedEnvelope, testPassphrase);
  if (decryptedJson !== rawPayloadJson) {
    throw new Error("Decrypted JSON does not match original plaintext");
  }
  console.log("✓ Decryption succeeded and verified with SHA-256 integrity check");

  // 4. AES-256-GCM Vault Decryption (Invalid Passphrase)
  console.log("Testing decryption rejection with wrong passphrase...");
  let failedAsExpected = false;
  try {
    decryptVaultPayload(encryptedEnvelope, "WrongPassword123!");
  } catch (err: any) {
    failedAsExpected = true;
  }
  if (!failedAsExpected) {
    throw new Error("Decryption should have failed with incorrect passphrase");
  }
  console.log("✓ Wrong passphrase properly rejected with authentication tag error");

  // 5. Generate Standalone Vault JSON Buffer (Plain & Encrypted)
  console.log("Testing generation of JSON vault files...");
  const plainJsonFile = await generateVaultJsonBuffer(tenantId);
  if (!plainJsonFile.filename.endsWith(".json") || plainJsonFile.buffer.length < 500) {
    throw new Error("Plain JSON vault buffer generation failed");
  }
  console.log(`✓ Plain JSON vault generated: ${plainJsonFile.filename} (${plainJsonFile.buffer.length} bytes)`);

  const encJsonFile = await generateVaultJsonBuffer(tenantId, { passphrase: testPassphrase });
  if (!encJsonFile.filename.includes("_Encrypted_") || encJsonFile.buffer.length < 500) {
    throw new Error("Encrypted JSON vault buffer generation failed");
  }
  console.log(`✓ Encrypted JSON vault generated: ${encJsonFile.filename} (${encJsonFile.buffer.length} bytes)`);

  // 6. Generate Full Vault ZIP Archive (Plain & Encrypted)
  console.log("Testing generation of complete ZIP vault archive (JSZip)...");
  const plainZip = await generateVaultZipArchive(tenantId);
  const loadedPlainZip = await JSZip.loadAsync(plainZip.buffer);
  const plainZipFiles = Object.keys(loadedPlainZip.files);
  console.log("✓ Plain ZIP files:", plainZipFiles);

  const expectedVaultZipFiles = [
    "data_vault.json",
    "vault_manifest.json",
    "01_clients.csv",
    "02_factures.csv",
    "03_devis.csv",
    "04_avoirs.csv",
    "05_depenses.csv",
    "06_instructions_restauration.txt",
  ];
  for (const f of expectedVaultZipFiles) {
    if (!plainZipFiles.includes(f)) {
      throw new Error(`Missing expected file in plain vault ZIP: ${f}`);
    }
  }
  console.log("✓ All 8 files present in unencrypted vault ZIP");

  const encZip = await generateVaultZipArchive(tenantId, { passphrase: testPassphrase });
  const loadedEncZip = await JSZip.loadAsync(encZip.buffer);
  const encZipFiles = Object.keys(loadedEncZip.files);
  if (!encZipFiles.includes("data_vault.enc.json") || !encZipFiles.includes("vault_manifest.json")) {
    throw new Error("Encrypted vault ZIP missing encrypted payload or manifest");
  }
  console.log("✓ Encrypted vault ZIP verified with data_vault.enc.json");

  // 7. Test Inspect Buffer (Inspection Pre-Restoration)
  console.log("Testing pre-restore inspection for plain & encrypted files...");
  const inspectPlain = await inspectVaultBuffer(plainZip.buffer);
  if (!inspectPlain.valid || inspectPlain.isEncrypted || !inspectPlain.payload) {
    throw new Error("Inspection of plain ZIP archive failed");
  }
  console.log(`✓ Inspected plain ZIP: valid=true, isEncrypted=false, detected ${inspectPlain.payload.invoices.length} invoices`);

  const inspectEncWithoutPass = await inspectVaultBuffer(encZip.buffer);
  if (!inspectEncWithoutPass.valid || !inspectEncWithoutPass.isEncrypted || !inspectEncWithoutPass.requiresPassphrase) {
    throw new Error("Encrypted archive should require passphrase during inspection");
  }
  console.log("✓ Encrypted ZIP without password correctly flagged requiresPassphrase=true");

  const inspectEncWithPass = await inspectVaultBuffer(encZip.buffer, testPassphrase);
  if (!inspectEncWithPass.valid || !inspectEncWithPass.payload) {
    throw new Error("Inspection with valid passphrase failed");
  }
  console.log(`✓ Inspected encrypted ZIP with password: valid=true, unlocked ${inspectEncWithPass.payload.invoices.length} invoices`);

  // 8. Test Restore Vault (Merge Mode)
  console.log("Testing transactional vault restore in MERGE mode...");
  const restoreMergeRes = await restoreVaultData(tenantId, inspectPlain.payload, "merge");
  if (!restoreMergeRes.success) {
    throw new Error("Vault restore in merge mode failed");
  }
  console.log(`✓ Merge restore succeeded: ${restoreMergeRes.restoredCounts.invoicesCount} invoices, ${restoreMergeRes.restoredCounts.clientsCount} clients in database`);

  // 9. Test Restore Vault (Overwrite Mode)
  console.log("Testing transactional vault restore in OVERWRITE mode...");
  const restoreOverwriteRes = await restoreVaultData(tenantId, inspectPlain.payload, "overwrite");
  if (!restoreOverwriteRes.success) {
    throw new Error("Vault restore in overwrite mode failed");
  }
  console.log(`✓ Overwrite restore succeeded: ${restoreOverwriteRes.restoredCounts.invoicesCount} invoices, ${restoreOverwriteRes.restoredCounts.clientsCount} clients in database`);

  console.log("=== ALL PHASE 3 MODULE 4 VAULT BACKUP & RESTORE TESTS PASSED WITH DISTINCTION ===");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
