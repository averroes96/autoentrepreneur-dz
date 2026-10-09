# Moukawil.dz — Algerian Auto-Entrepreneur Management Platform

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-blue?logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma.io/)
[![Law 22-23](https://img.shields.io/badge/Compliance-Law_22--23_Algeria-059669)](https://www.joradp.dz/)
[![License](https://img.shields.io/badge/License-Proprietary-slate)](LICENSE)

**Moukawil.dz (MoukawilOS)** is a sovereign, web-based operating system purpose-built for Algerian auto-entrepreneurs operating under **Law No. 22-23 of December 18, 2022** and the **Single Flat Tax (IFU - Impôt Forfaitaire Unique)** regime updated by the **2024 Finance Law**.

It delivers rigorous commercial and tax compliance: immutable sequential invoicing, quote and credit note management, multi-currency invoicing (EUR, USD, GBP, CAD) with Bank of Algeria exchange rates and repatriation notices, cost and real net profit tracking, a role-based audit portal for external certified accountants (*Commissaires aux comptes / Experts-comptables*) with 6-digit PIN verification, and automated AES-256-GCM encrypted data vault backups.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Algerian Regulatory & Tax Framework](#-algerian-regulatory--tax-framework)
3. [Quick Start (Local Development)](#-quick-start-local-development)
4. [Architecture & Technology Stack](#-architecture--technology-stack)
5. [Production Deployment](#-production-deployment)
6. [Project Structure](#-project-structure)
7. [Regulatory Parameters & Flexibility](#-regulatory-parameters--flexibility)
8. [Automated Test Suite](#-automated-test-suite)

---

## ✨ Key Features

### 🏛️ 1. Statutory Invoicing & Commercial Lifecycle
* **Gapless Sequential Numbering**: Chronological, collision-free sequencing (`FAC-2026-XXXX`). Once issued (sealed), invoices are immutable with preserved client and profile snapshots.
* **Strict VAT Exemption (Zero TVA)**: Strict compliance with Law 22-23 (no misleading HT/TTC splits; net amount in DZD accompanied by the mandatory statutory VAT exemption notice).
* **Official Quotes / Devis (`DEV-2026-XXXX`)**: Commercial quotation engine with one-click conversion into official sealed invoices.
* **Credit Notes / Avoirs (`AVO-2026-XXXX`)**: Legally compliant cancellation and refund workflow preserving chronological sequence integrity.
* **High-Fidelity Vector PDF Generation**: Native, high-speed PDF rendering (PDFKit) in French and Arabic with Amiri typography and verification QR codes.
* **Payment Receipts & Quittances (`REC-2026-XXXX`)**: Official payment receipts with amounts in words (Algerian administrative Tafqeet in Arabic and French).

### 💱 2. Multi-Currency Invoicing & Bank Reconciliation
* **Foreign Currencies Supported**: EUR (€), USD ($), GBP (£), CAD ($).
* **Official Bank of Algeria Rates**: Automatic conversion to Algerian Dinars (DZD) on invoice generation, logging the legal exchange rate for the IFU tax base.
* **Foreign Exchange Repatriation Compliance**: Mandatory notices reminding auto-entrepreneurs to repatriate foreign earnings to Algerian commercial bank accounts per central bank regulations.

### 📊 3. Real-Time Turnover Ceiling & Tax Projections
* **Dynamic 5,000,000 DZD Ceiling Gauge**: Live progress monitoring toward the annual statutory threshold with color-coded alerts (Normal <80%, Warning ≥80%, Critical ≥95%, Exceeded).
* **IFU Tax Engine (0.5%)**: Live tax projection with automatic application of the **10,000 DZD** statutory annual floor.
* **3-Year Consecutive Limit Tracking**: Predictive detection of multi-year ceiling breaches in compliance with Article 13 of Law 22-23.
* **Statutory Obligations Calendar**: Real-time countdowns for annual IFU declarations (January 31), annual CASNOS social contributions (June 30), and 5-year ANAE card renewals.

### 💼 4. Operating Expenses & Net Profit Analytics
* **Operating Cost Ledger**: Expense tracking across 9 professional categories (SaaS tools, cloud hosting, hardware, telecom, coworking, etc.).
* **True Net Profit Calculation**: Real-time economic dashboard computing net disposable earnings after deducting expenses, IFU (0.5%), and CASNOS social security fees.
* **Excel-Compatible CSV Exports**: Encoded with UTF-8 BOM (`\uFEFF`) for seamless opening in Microsoft Excel.

### 👥 5. Client Financial Ledger & Statement of Account
* **Comprehensive Client Directory**: Individual clients and corporate entities with Tax ID (NIF), Statistical ID (NIS), Trade Registry (RC), and Tax Article.
* **Progressive Client Ledger (Grand Livre Client)**: Detailed audit trail of all debits (invoices) and credits (payments, credit notes) with real-time progressive running balances.
* **Certified Statement of Account (Bordereau Client)**: One-click PDF and CSV statement export for financial reconciliations.

### 📈 6. Business Intelligence & Cashflow Projections
* **Interactive Financial Analytics**: Monthly collected vs. invoiced revenue trends, client share distribution, and multi-currency breakdowns.
* **Cashflow Forecasts**: 30, 60, and 90-day aging balance schedules with overdue tracking.

### 🔒 7. Role-Based Accountant Access & Audit Pack (Module 3)
* **Read-Only Guest Portal**: Secure, revocable invitation links for external certified accountants (*Commissaires aux comptes / Experts-comptables*) with configurable expiration (7, 30, 90 days, or 1 year).
* **6-Digit PIN Security Gate**: Authenticated with bcryptjs-hashed 6-digit PIN numbers; no plain text credentials stored.
* **Dedicated Audit Portal (`/portal/accountant/[token]`)**: Full read-only view of sales ledgers, expense journals, and fiscal reconciliations.
* **1-Click Statutory Audit Pack (ZIP)**: Generates a complete legal audit archive (`JSZip`) containing:
  1. `01_Bilan_Fiscal_IFU_G12_bis_2026.pdf` (Official tax summary)
  2. `02_Livre_des_Recettes_2026.csv` (Chronological sales ledger)
  3. `03_Registre_des_Depenses_2026.csv` (Operating expenses journal)
  4. `04_Grand_Livre_Clients_2026.csv` (Client aging balances)
  5. `05_Attestation_Audit_Loi_22-23_2026.txt` (Certified audit manifest with SHA-256 checksum)

### 🛡️ 8. Automated AES-256-GCM Vault Backup & Restore (Module 4)
* **Complete Digital Heritage Export**: Full backup in JSON or ZIP format containing all invoices, quotes, credit notes, expenses, clients, profiles, and settings.
* **Military-Grade AES-256-GCM Encryption**: Robust `scrypt` key derivation, cryptographic salt, unique initialization vector (IV), and GCM authentication tag.
* **SHA-256 Integrity Verification**: Cryptographic fingerprint ensuring zero data tampering.
* **Transactional Restore Engine**:
  - **Pre-restore Inspection & Dry-Run**: Validates archive integrity, passphrase, and dataset stats before touching the database.
  - **Merge or Overwrite Modes**: Seamless transactional data recovery in SQLite or PostgreSQL.

### 🌐 9. Native Bicultural Engine: Arabic & French (RTL)
* **Complete UI Localization**: Over 620 verified translation keys across Arabic (official JORADP terminology) and French.
* **Bidirectional Layouts (LTR / RTL)**: Smooth directional switching, Amiri Arabic typography, and official Algerian administrative Tafqeet.

---

## 📜 Algerian Regulatory & Tax Framework

The platform complies with all statutory provisions in Algerian law:

| Legislative Parameter | Statutory Value | Legal Basis |
| :--- | :--- | :--- |
| **Auto-Entrepreneur Status** | ANAE Card (5-year validity) | Law No. 22-23 of Dec 18, 2022 |
| **Annual Turnover Ceiling** | **5,000,000 DZD / year** | Executive Decree No. 23-197 |
| **Tax Regime** | Single Flat Tax (IFU) | Direct Tax Code (CID) |
| **IFU Tax Rate** | **0.5%** of collected turnover | 2024 Finance Law (Art. 34) |
| **Statutory Minimum Tax** | **10,000 DZD / year** (even if CA = 0) | Direct Tax Code |
| **VAT Regime** | **Total Exemption** from VAT | Law No. 22-23 (Art. 11) |
| **Social Security** | CASNOS flat fee (24,000 DZD / year) | CASNOS Executive Decree |
| **Foreign Invoicing** | Mandatory bank repatriation | Bank of Algeria Regulation |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* **Node.js**: v20 or higher recommended
* **npm**: v10 or higher

### 2. Installation
```bash
# Clone the repository and enter the directory
git clone git@github.com:averroes96/autoentrepreneur-dz.git
cd autoentrepreneur-dz

# Install dependencies (runs postinstall patch and Prisma generation)
npm install
```

### 3. Local Database (SQLite)
The application defaults to **SQLite** locally for zero-config, offline-first development:
```bash
# Initialize and sync SQLite schema
npx prisma db push

# Seed realistic demo data
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Pre-configured Demo Account
* **Email**: `demo@autoentrepreneur.dz`
* **Password**: `password123`

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 16 (App Router)                     │
│  React 19 Server & Client Components · Tailwind CSS v4      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│       Business Domain       │ │     Storage & File Engine   │
│ • regulatory.ts (Tax rules) │ │ • PDFKit (Vector rendering) │
│ • tafqeet.ts (Words logic)  │ │ • JSZip (Archive generator) │
│ • vault.ts (AES-256-GCM)    │ │ • Cloudflare R2 / Supabase  │
│ • accountantAccess.ts       │ │ • Resend (Compliant email)  │
└──────────────┬──────────────┘ └─────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│           Prisma ORM 6.19 (Hybrid Architecture)             │
│   Development: SQLite    │   Production: PostgreSQL         │
└─────────────────────────────────────────────────────────────┘
```

* **Frontend**: Next.js 16.4.0 (Turbopack), React 19, Tailwind CSS 4, Lucide Icons, Amiri font (Arabic).
* **Backend**: Next.js Server Actions & API Route Handlers, Prisma ORM, Jose (JWT), Bcryptjs.
* **Security & Cryptography**: Node.js Crypto (`crypto.createCipheriv` / `crypto.scrypt`), AES-256-GCM, SHA-256.
* **Document Engine**: Pure PDFKit (vector rendering, zero Chromium dependencies), JSZip.
* **Cloud & Monitoring**: Vercel Hosting & Speed Insights, Supabase PostgreSQL, Resend Email, Cloudflare R2, Sentry.

---

## ☁️ Production Deployment

For deployment on Vercel with Supabase PostgreSQL:

1. **Switch to PostgreSQL schema**:
   ```bash
   npm run db:postgres
   ```
2. **Push schema to Supabase**:
   ```bash
   DATABASE_URL="<supabase_pooler_url>" DIRECT_URL="<supabase_direct_url>" npm run db:push
   ```
3. **Switch back to local SQLite at any time**:
   ```bash
   npm run db:sqlite
   ```

For the comprehensive step-by-step production deployment guide, refer to:  
👉 **[`docs/deployment-stack.md`](docs/deployment-stack.md)**.

---

## 📂 Project Structure

```
autoentrepreneur-dz/
├── docs/                             # Architectural documentation & technical guides
│   ├── deployment-stack.md           # Cloud production stack (Vercel, Supabase, R2, Sentry)
│   ├── accountant-audit-guide.md     # Audit guide for external accountants (French legal terms)
│   └── backup-vault-spec.md          # Cryptographic specification for the backup vault
├── prisma/
│   ├── schema.prisma                 # Active schema (SQLite or PostgreSQL)
│   ├── schema.sqlite.prisma          # Dedicated SQLite schema
│   ├── schema.postgresql.prisma      # Dedicated PostgreSQL schema
│   └── seed.ts                       # Comprehensive business seed script
├── scripts/
│   ├── switch-db.js                  # Database switching utility
│   └── patch-next.js                 # Environment patch script
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Login and registration
│   │   ├── accountant/               # Accountant invitation and management
│   │   ├── backup/                   # Vault backup & restore dashboard
│   │   ├── clients/                  # Clients directory & general ledger
│   │   ├── credit-notes/             # Credit notes (avoirs)
│   │   ├── dashboard/                # Main dashboard & ceiling tracking
│   │   ├── expenses/                 # Operating costs & net profit
│   │   ├── invoices/                 # Invoicing system
│   │   ├── portal/accountant/[token] # External read-only accountant audit portal
│   │   ├── profile/                  # Auto-entrepreneur compliance settings
│   │   ├── quotes/                   # Quotes (devis)
│   │   ├── tax-summary/              # G12 bis tax summary & statutory calendar
│   │   └── api/                      # PDF, CSV, and ZIP export endpoints
│   ├── components/                   # Modular React components
│   │   ├── accountant/               # Audit portal, PIN gate, and management
│   │   ├── backup/                   # Vault client (export & transactional restore)
│   │   ├── clients/                  # Client ledger & aging balance tables
│   │   ├── expenses/                 # Expense forms & net profit visualizer
│   │   ├── invoices/                 # Invoicing workflows
│   │   ├── quotes/                   # Quote forms & conversion triggers
│   │   └── layout/                   # Navbar & bilingual status bar
│   ├── config/
│   │   └── regulatory.ts             # Single source of truth for Algerian tax rules
│   └── lib/
│       ├── accountantAccess.ts       # Access security & ZIP audit pack generator
│       ├── anaeNomenclature.ts       # Official 130+ activity nomenclature
│       ├── auth.ts                   # Tenant-isolated authentication
│       ├── currency.ts               # Multi-currency engine & Bank of Algeria rates
│       ├── expenses.ts               # Expense tracking & net profit computation
│       ├── i18n/                     # Bilingual translation dictionary (620+ keys)
│       ├── pdfGenerator.ts           # Pure vector PDF rendering engine
│       ├── tafqeet.ts                # Administrative Tafqeet (Arabic & French)
│       └── vault.ts                  # AES-256-GCM encryption & transactional restore
└── test-e2e.ts                       # End-to-end integration test suite (60KB)
```

---

## ⚙️ Regulatory Parameters & Flexibility

In strict compliance with Law 22-23, **no legal thresholds or tax figures are hardcoded in application logic**. All parameters are centralized in:

📁 **`src/config/regulatory.ts`**

### Examples of adjusting tax rules:
* **Changing the IFU rate (e.g., to 1%)**:
  ```typescript
  export const REGULATORY_CONFIG = {
    ifu: {
      rate: 0.01, // 1% instead of 0.5%
      minimumAnnualTaxDzd: 10_000,
      // ...
    }
  };
  ```
  *All calculations, projections, declarations, and tax summaries update instantly across the entire platform.*

* **Adjusting the annual ceiling (e.g., to 8,000,000 DZD)**:
  ```typescript
  turnoverCeiling: {
    annualLimitDzd: 8_000_000,
    warningThresholds: { yellow: 0.80, red: 0.95 },
  }
  ```

---

## 🧪 Automated Test Suite

A comprehensive end-to-end test suite validates all legal, cryptographic, and accounting rules:

```bash
npm test
```

### Verified Scope:
1. **Multi-Tenant Isolation** (`tenant_id`).
2. **Gapless Sequential Numbering** for invoices (`FAC-2026-XXXX`), quotes (`DEV-2026-XXXX`), and credit notes (`AVO-2026-XXXX`).
3. **IFU Tax Engine** (0.5% rate and strict 10,000 DZD floor).
4. **5,000,000 DZD Ceiling Monitoring** and 3-year consecutive limit detection.
5. **High-Fidelity Vector PDF Generation** (Invoices, Quotes, Credit Notes, Receipts, Statements).
6. **Multi-Currency Invoicing** with Bank of Algeria exchange rates.
7. **Administrative Tafqeet** (Arabic & French) and full 623-key i18n dictionary.
8. **Role-Based Accountant Access** (bcryptjs PIN hashing, token expiry, 5-file JSZip audit pack).
9. **AES-256-GCM Vault** (scrypt KDF, SHA-256 checksums, invalid password rejection, transactional restore in Merge and Overwrite modes).
