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
} from "./src/lib/tax";
import {
  generateInvoicePdfBuffer,
  generateQuotePdfBuffer,
  generateCreditNotePdfBuffer,
  generateTaxSummaryPdfBuffer,
} from "./src/lib/pdfGenerator";
import { getStatutoryDeadlines } from "./src/lib/statutoryCalendar";
import { getAnnualTaxSummary, generateTaxSummaryCsv } from "./src/lib/taxSummary";
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
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
