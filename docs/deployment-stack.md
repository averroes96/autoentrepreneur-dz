# Cloud Architecture & Production Deployment Guide: Vercel + Supabase + Cloudflare R2 + Resend + Sentry

This document details the production cloud architecture implemented for **MoukawilOS (Moukawil.dz)**:
- **Hosting & CDN**: [Vercel](https://vercel.com)
- **Web Analytics & Core Web Vitals**: [Vercel Analytics & Speed Insights](https://vercel.com/analytics)
- **Relational Database & Storage**: [Supabase (PostgreSQL)](https://supabase.com)
- **Transactional Emails**: [Resend](https://resend.com)
- **Object Storage (PDF & Backup Archiving)**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
- **Error Monitoring & Telemetry**: [Sentry](https://sentry.io)

---

## 1. Architecture Diagram

```
                                  +------------------------------+
                                  |   Web Browser / Client UI    |
                                  +--------------+---------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
                       v                                                   v
           +-----------------------+                           +-----------------------+
           |    Vercel Hosting     |                           |   Vercel Analytics    |
           |  (Next.js App Router) |                           |    & Speed Insights   |
           +-----------+-----------+                           +-----------------------+
                       |
     +-----------------+-------------------+--------------------+
     |                                     |                    |
     v                                     v                    v
+-----------------------+      +-----------------------+  +-----------------------+
|  Supabase PostgreSQL  |      |   Emails (Resend)     |  | Cloudflare R2 Storage |
|  • Supavisor (Pooler) |      | • Invoices with PDF   |  | • PDF Archiving       |
|  • Direct Migrations  |      | • Payment Receipts    |  | • Zero Egress Fees    |
|  • Backup fallback    |      | • Ceiling Alerts      |  | • S3-Compatible API   |
+-----------------------+      +-----------------------+  +-----------------------+
     ^                                     ^                    ^
     |                                     |                    |
     +-------------------------------------+--------------------+
                                           |
                                           v
                              +-----------------------+
                              |    Sentry Tracking    |
                              | • Error Diagnostics   |
                              | • Performance Tracing |
                              +-----------------------+
```

---

## 2. Infrastructure Components & Configuration

### 2.1 Vercel & Vercel Analytics / Speed Insights
- **Configuration file**: `vercel.json`
- **Injected components**: `<Analytics />` and `<SpeedInsights />` inside `src/app/layout.tsx`.
- **Activation**:
  1. Link your GitHub repository on [Vercel](https://vercel.com).
  2. In the **Analytics** tab, enable Vercel Analytics.
  3. In the **Speed Insights** tab, enable Speed Insights.
  4. Core Web Vitals (LCP, FID, CLS) and real-time visitor telemetry are automatically captured.

### 2.2 Supabase (PostgreSQL & Storage)
- **Client implementation**: `src/lib/supabase.ts`
- **PostgreSQL schema**: `prisma/schema.postgresql.prisma`
- **Management commands**:
  - Switch to PostgreSQL / Supabase mode:
    ```bash
    npm run db:postgres
    ```
  - Push schema changes to Supabase:
    ```bash
    npm run db:push
    ```
  - Switch back to local offline SQLite mode:
    ```bash
    npm run db:sqlite
    ```
- **Supavisor pooler configuration**:
  - `DATABASE_URL` uses the pooler port `6543` with `?pgbouncer=true` (mandatory for serverless Next.js functions).
  - `DIRECT_URL` uses the direct connection port `5432` for Prisma schema push and migrations.

### 2.3 Resend (Transactional Emails)
- **Integration library**: `src/lib/email.ts`
- **Server action**: `emailInvoiceAction(invoiceId, recipientEmail)` in `src/app/actions.ts`.
- **Available features**:
  1. `sendInvoiceEmail`: Transmits issued invoices with attached vector PDF and Law 22-23 statutory notices.
  2. `sendPaymentReceiptEmail`: Formal receipt confirmation of received funds.
  3. `sendCeilingAlertEmail`: Triggered when turnover reaches 80% (yellow warning) or 95% (critical warning).
- **Development fallback**:
  - If `RESEND_API_KEY` is omitted, emails are simulated in the console without throwing runtime errors.

### 2.4 Cloudflare R2 (S3-Compatible Object Storage)
- **Integration library**: `src/lib/storage.ts`
- **Benefits**: Zero egress bandwidth fees, low-latency edge retrieval.
- **Unified storage dispatcher**:
  - `persistInvoicePdf` attempts Cloudflare R2 first, falls back to Supabase Storage, and retains local files in development.
- **Environment variables**:
  `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`.

### 2.5 Sentry (Error Telemetry & Performance Monitoring)
- **Configuration files**:
  - `sentry.client.config.ts`: Client-side browser errors.
  - `sentry.server.config.ts`: Node.js runtime errors.
  - `sentry.edge.config.ts`: Edge runtime errors.
  - `src/instrumentation.ts`: Next.js initialization hook.
  - `src/lib/sentry.ts`: Telemetry logger (`captureException`, `captureMessage`).
  - `next.config.ts`: Wrapped with `withSentryConfig`.

---

## 3. Step-by-Step Vercel Deployment

### Step 1: Create Supabase Database
1. Create a project at [database.new](https://database.new).
2. Go to **Project Settings > Database**.
3. Copy both connection strings:
   - **Transaction Pooler (port 6543)** -> `DATABASE_URL`.
   - **Direct connection (port 5432)** -> `DIRECT_URL`.
4. In your local terminal, apply the schema:
   ```bash
   npm run db:postgres
   DATABASE_URL="<your_pooler_string>" DIRECT_URL="<your_direct_string>" npm run db:push
   ```

### Step 2: Configure Resend
1. Create an account at [resend.com](https://resend.com).
2. Generate an API Key under **API Keys**.
3. (Production) Add your custom domain (e.g. `moukawil.dz`) or use testing domains.

### Step 3: Configure Cloudflare R2
1. In Cloudflare Dashboard, navigate to **R2 Object Storage**.
2. Create a bucket named `moukawil-invoices`.
3. In **Manage R2 API Tokens**, create a token with "Object Read & Write" permissions.

### Step 4: Deploy on Vercel
1. Import your GitHub repository to [Vercel](https://vercel.com/new).
2. In **Environment Variables**, provide the keys listed in `.env.example`:
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `CLOUDFLARE_R2_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_R2_BUCKET_NAME`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_DSN`
3. Click **Deploy**.

---

## 4. Verification & Testing

Every infrastructure block has been automated and verified:
- `npm test`: Runs the comprehensive Law 22-23 accounting and regulatory test suite.
- `npx tsx test-stack-integration.ts`: Validates Sentry, Supabase, Resend, and Cloudflare R2 interoperability.
- `npm run typecheck`: Validates complete TypeScript typing with zero errors.
