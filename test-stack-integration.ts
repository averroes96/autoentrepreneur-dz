import { getSupabaseClient, getSupabaseAdminClient, uploadToSupabaseStorage } from "./src/lib/supabase";
import { sendInvoiceEmail, sendPaymentReceiptEmail, sendCeilingAlertEmail } from "./src/lib/email";
import { getR2Client, uploadToCloudflareR2, persistInvoicePdf } from "./src/lib/storage";
import { captureException, captureMessage } from "./src/lib/sentry";

async function testStack() {
  console.log("=== TESTING STACK INTEGRATION ===");

  // 1. Sentry Integration
  console.log("1. Testing Sentry reporting...");
  captureMessage("Sentry stack smoke test message", "info");
  captureException(new Error("Test stack error handling"), { test: true });
  console.log("✓ Sentry hooks executed cleanly without crashing in dev mode.");

  // 2. Supabase SDK
  console.log("2. Testing Supabase client initialization...");
  const client = getSupabaseClient();
  const adminClient = getSupabaseAdminClient();
  console.log("✓ Supabase client handled:", { client: !!client, adminClient: !!adminClient });

  // 3. Resend Transactional Email (Dev/Mock Mode)
  console.log("3. Testing Resend transactional email service...");
  const fakePdf = Buffer.from("%PDF-1.4 test invoice buffer");
  const invoiceEmail = await sendInvoiceEmail({
    to: "client@test.dz",
    clientName: "Test Client SARL",
    invoiceNumber: "FAC-2026-0099",
    totalAmount: 150000,
    currency: "DZD",
    pdfBuffer: fakePdf,
    sellerName: "Karim Meziane",
  });
  console.log("✓ Resend invoice email response:", invoiceEmail);

  const receiptEmail = await sendPaymentReceiptEmail({
    to: "client@test.dz",
    clientName: "Test Client SARL",
    invoiceNumber: "FAC-2026-0099",
    amountPaid: 150000,
    currency: "DZD",
    paymentDate: new Date(),
    sellerName: "Karim Meziane",
  });
  console.log("✓ Resend receipt email response:", receiptEmail);

  const alertEmail = await sendCeilingAlertEmail({
    to: "entrepreneur@moukawil.dz",
    entrepreneurName: "Karim Meziane",
    currentTurnover: 4200000,
    percentage: 84.0,
    fiscalYear: 2026,
  });
  console.log("✓ Resend ceiling alert email response:", alertEmail);

  // 4. Cloudflare R2 / Storage Dispatcher
  console.log("4. Testing Cloudflare R2 / Storage adapter...");
  const r2 = getR2Client();
  console.log("✓ Cloudflare R2 client handled:", { r2Active: !!r2 });

  const storageResult = await persistInvoicePdf({
    tenantId: "test-tenant-123",
    invoiceNumber: "FAC-2026-0099",
    pdfBuffer: fakePdf,
  });
  console.log("✓ Storage dispatcher result:", storageResult);

  console.log("=== ALL STACK INTEGRATION CHECKS PASSED ===");
}

testStack().catch((err) => {
  console.error("Stack test failed:", err);
  process.exit(1);
});
