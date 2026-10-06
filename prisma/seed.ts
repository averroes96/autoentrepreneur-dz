import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with sample auto-entrepreneur data...");

  // Check if tenant already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@autoentrepreneur.dz" },
  });

  if (existingUser) {
    console.log("Demo user already exists, skipping seed.");
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "DevConsult DZ",
    },
  });

  // 2. Create Admin User
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "demo@autoentrepreneur.dz",
      passwordHash,
      fullName: "Karim Meziane",
      role: "ADMIN",
    },
  });

  // 3. Create Auto-Entrepreneur Profile
  const profile = await prisma.autoEntrepreneurProfile.create({
    data: {
      tenantId: tenant.id,
      fullName: "Karim Meziane",
      rnaeNumber: "24-004812",
      nif: "198816010098765",
      address: "14 Rue Didouche Mourad, Alger Centre, 16000 Alger",
      email: "demo@autoentrepreneur.dz",
      phone: "0550 12 34 56",
      activityCode: "601101",
      activityLabel: "Développement informatique et logiciels",
      defaultCurrency: "DZD",
      cardIssueDate: new Date("2024-03-15"),
      activityStartDate: new Date("2024-03-20"),
      cardValidityYears: 5,
      casnosStatus: "AFFILIATED",
      casnosScheme: "FLAT_24000",
      vatExemptionNote:
        "Exonéré de la TVA conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur et du Code des Impôts Directs (Régime IFU).",
      invoicePrefix: "FAC",
    },
  });

  // 4. Create Sequence tracker
  await prisma.invoiceSequence.create({
    data: {
      tenantId: tenant.id,
      fiscalYear: 2026,
      lastSequence: 1,
    },
  });

  // 5. Create Sample Client (Digital Agency)
  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: "Agence Web Alger SARL",
      clientType: "PROFESSIONAL",
      address: "Cité El Mokrani, Bâtiment B, Bir Mourad Raïs, Alger",
      nif: "001616098765432",
      nis: "001616012345678",
      rc: "16/00-1234567B16",
      email: "facturation@agence-alger.dz",
      phone: "021 54 32 10",
      isArchived: false,
    },
  });

  // 6. Create Past Turnover History (for 3-year consecutive rule tracker)
  await prisma.pastTurnover.createMany({
    data: [
      {
        tenantId: tenant.id,
        fiscalYear: 2024,
        turnoverDzd: 1_850_000,
      },
      {
        tenantId: tenant.id,
        fiscalYear: 2025,
        turnoverDzd: 2_920_000,
      },
    ],
  });

  // 7. Create a Sample Issued & Paid Invoice
  const issuedDate = new Date();
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      invoiceNumber: "FAC-2026-0001",
      sequenceNumber: 1,
      fiscalYear: 2026,
      status: "ISSUED",
      paymentStatus: "PAID",
      issueDate: issuedDate,
      paidAt: issuedDate,
      issuedAt: issuedDate,
      currency: "DZD",
      total: 350_000,
      vatExemptionNote: profile.vatExemptionNote,
      sellerSnapshot: JSON.stringify({
        fullName: profile.fullName,
        rnaeNumber: profile.rnaeNumber,
        nif: profile.nif,
        address: profile.address,
        email: profile.email,
        phone: profile.phone,
        activityCode: profile.activityCode,
        activityLabel: profile.activityLabel,
      }),
      clientSnapshot: JSON.stringify({
        name: client.name,
        clientType: client.clientType,
        address: client.address,
        nif: client.nif,
        nis: client.nis,
        rc: client.rc,
        email: client.email,
        phone: client.phone,
      }),
      notes: "Règlement effectué par virement bancaire sur compte BNA.",
      lineItems: {
        create: [
          {
            description: "Développement d'application web et architecture backend",
            quantity: 1,
            unitPrice: 250_000,
            totalPrice: 250_000,
            currency: "DZD",
            position: 0,
          },
          {
            description: "Intégration d'API et optimisation des performances",
            quantity: 1,
            unitPrice: 100_000,
            totalPrice: 100_000,
            currency: "DZD",
            position: 1,
          },
        ],
      },
    },
  });

  console.log("Seeding complete!");
  console.log("Demo Credentials: email: demo@autoentrepreneur.dz | password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
