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
import { generateInvoicePdfBuffer } from "./src/lib/pdfGenerator";

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
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
