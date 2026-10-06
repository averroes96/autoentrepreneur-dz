# Moukawil.dz — Algerian Auto-Entrepreneur Management Platform

A web application designed for Algerian auto-entrepreneurs operating under **Law 22-23 of December 18, 2022** and the **Single Flat Tax (IFU - Impôt Forfaitaire Unique)** regime. It handles legally compliant invoicing, sequential numbering, turnover tracking, ceiling thresholds, and tax compliance.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18+)
- **npm** (v9+)

### 2. Installation
```bash
# Clone the repository and navigate into the project directory
cd /Users/admin/Github/autoentrepreneur-dz

# Install dependencies (runs postinstall patch automatically)
npm install
```

### 3. Database & Seed Data
The application uses **SQLite** locally via Prisma ORM for zero-setup local development:
```bash
# Initialize and sync SQLite schema
npx prisma db push

# Seed demo data
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Pre-configured Demo Account
- **Email**: `demo@autoentrepreneur.dz`
- **Password**: `password123`

---

## 🧪 Integration & Compliance Tests

An automated end-to-end test suite validates:
1. Multi-tenant data isolation.
2. Gapless, collision-free sequential numbering (`FAC-2026-XXXX`).
3. Immutability of issued invoices and the audited cancellation workflow.
4. IFU tax calculation engine (0.5% rate with a 10,000 DZD statutory floor).
5. 5,000,000 DZD annual turnover ceiling progress and warning thresholds.
6. 3-year consecutive turnover compliance rule (Law 22-23).
7. High-fidelity vector PDF generation.

To run the test suite:
```bash
npm test
```

---

## ⚙️ How to Update Tax & Regulatory Parameters

In accordance with Section 6 of the BRD, **no legal thresholds or tax figures are hardcoded in application logic**. All regulatory parameters are centralized in a single typed configuration file:

📁 **`src/config/regulatory.ts`**

### Configuration Structure:
```typescript
export const REGULATORY_CONFIG: RegulatoryConfig = {
  ifu: {
    rate: 0.005, // 0.5% of collected turnover (Finance Law 2024)
    minimumAnnualTaxDzd: 10_000, // Statutory minimum tax even if turnover is zero
    annualDeclarationDeadline: {
      month: 1, // January
      day: 31,  // January 31 of Year N+1
      description: "January 31 of the year following the tax year",
    },
  },
  turnoverCeiling: {
    annualLimitDzd: 5_000_000, // 5,000,000 DZD annual ceiling
    warningThresholds: {
      yellow: 0.80, // Warning alert at 80% (4,000,000 DZD)
      red: 0.95,    // Critical alert at 95% (4,750,000 DZD)
    },
    consecutiveYearsLimit: 3, // 3 consecutive years rule
    nearZeroThresholdDzd: 50_000, // Inactivity / near-zero turnover threshold
  },
  casnos: {
    defaultAnnualContributionDzd: 24_000, // CASNOS flat social security fee (24,000 DZD/year)
    affiliationDeadlineDays: 10, // 10 days following activity commencement
    annualPaymentDeadlineDescription: "Per CASNOS schedule (typically by end of June)",
  },
  fiscalRegistration: {
    declarationDeadlineDays: 30, // 30 days after receiving the auto-entrepreneur card
  },
  card: {
    validityYears: 5, // Auto-entrepreneur card validity (5 years)
  },
  defaultVatExemptionNote:
    "Exempt from VAT under Law No. 22-23 of December 18, 2022 governing the auto-entrepreneur status and the Direct Tax Code (IFU regime).",
  currencies: {
    active: ["DZD"],
    default: "DZD",
    labels: {
      DZD: "Algerian Dinar (DZD)",
    },
  },
};
```

### Examples of Updating Regulations:

#### 1. If a new Finance Law changes the IFU rate (e.g., to 1%):
Edit `src/config/regulatory.ts`:
```typescript
ifu: {
  rate: 0.01, // 1%
  // ...
}
```
*The dashboard and all tax projections update automatically across the application.*

#### 2. If the annual ceiling is raised (e.g., to 7,000,000 DZD):
Edit:
```typescript
turnoverCeiling: {
  annualLimitDzd: 7_000_000,
  // ...
}
```

#### 3. If CASNOS flat contribution changes:
Edit:
```typescript
casnos: {
  defaultAnnualContributionDzd: 30_000,
  // ...
}
```

#### 4. If the required VAT exemption legal wording changes:
- Update the default string in `src/config/regulatory.ts` under `defaultVatExemptionNote`.
- Or customize it on a per-user basis in the **Profile & Compliance** settings page (`/profile`).

---

## 🏛️ Phase 1 (MVP) Features Delivered

- **Multi-Tenant by Design**: Every auto-entrepreneur has an isolated workspace with strict tenant boundaries (`tenant_id`).
- **Client Management**:
  - Support for Individual clients and Corporate entities (agencies, companies).
  - Corporate identifiers tracked: Tax ID (NIF), Statistical ID (NIS), Trade Registry (RC), address.
  - Search, filtering, and client archiving.
- **Legally Compliant Invoicing Flow (Law 22-23)**:
  - **Draft Mode**: Flexible creation and modification without burning sequential invoice numbers.
  - **Flat vs. Detailed Task Totals**: Quick entry by task total amount in DZD, with optional toggle for quantity & unit price.
  - **Official Issuance (Sealing)**: Atomic, gapless sequential numbering (`FAC-2026-0001`). Freezes profile and client snapshots for historical immutability.
  - **Strictly No VAT & No HT/TTC Split**: Displays total amount in DZD only, accompanied by the mandatory statutory VAT exemption notice.
  - **Vector PDF Generation**: Fast, print-ready PDF invoices using pure PDFKit vector rendering.
  - **Audited Cancellation**: Issued invoices preserve their sequential spot in the accounting ledger; cancellation requires a documented reason.
  - **Payment Tracking**: One-click toggle for marking invoices as paid to reflect actual cash-basis turnover.
- **Real-Time Tax & Compliance Dashboard**:
  - Progress gauge toward the **5,000,000 DZD** ceiling (color-coded: Normal, Warning ≥80%, Critical ≥95%, Exceeded).
  - Live **IFU (0.5%)** estimate with automatic **10,000 DZD** statutory floor application.
  - **3-Year Consecutive Year Compliance Tracker** with customizable historical turnover records in settings.
  - **Profile Setup Progress Bar**: Real-time legal compliance meter guiding users through completing required regulatory fields (RNAE, NIF, activity code/label, address).
