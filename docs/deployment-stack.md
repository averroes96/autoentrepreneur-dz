# Architecture & Déploiement : Vercel + Vercel Analytics + Supabase + Resend + Cloudflare + Sentry

Ce document détaille l'intégration complète et prête pour la production de la stack cloud retenue pour **MoukawilOS (Moukawil.dz)** :
- **Hébergement & CDN** : [Vercel](https://vercel.com)
- **Mesure de trafic & Web Vitals** : [Vercel Analytics & Speed Insights](https://vercel.com/analytics)
- **Base de données relationnelle & Stockage** : [Supabase (PostgreSQL)](https://supabase.com)
- **Emails transactionnels conformes** : [Resend](https://resend.com)
- **Stockage d'objets (Archivage PDF & Justificatifs)** : [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/)
- **Surveillance des erreurs & Télémétrie** : [Sentry](https://sentry.io)

---

## 1. Schéma d'Architecture

```
                                  +------------------------------+
                                  |   Navigateur Client / Web    |
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
|  • Supavisor (Pooler) |      | • Factures avec PDF   |  | • Archivage PDF       |
|  • Migrations directes|      | • Récépissés paiement |  | • Zéro frais egress   |
|  • Bucket de secours  |      | • Alertes plafond IFU |  | • S3 API compatible   |
+-----------------------+      +-----------------------+  +-----------------------+
     ^                                     ^                    ^
     |                                     |                    |
     +-------------------------------------+--------------------+
                                           |
                                           v
                              +-----------------------+
                              |    Sentry Tracking    |
                              | • Traçage des erreurs |
                              | • Surveillance perfs  |
                              +-----------------------+
```

---

## 2. Rôles et Configuration de chaque composant

### 2.1 Vercel & Vercel Analytics / Speed Insights
- **Fichier de configuration** : `vercel.json`
- **Composants injectés** : `<Analytics />` et `<SpeedInsights />` dans `src/app/layout.tsx`.
- **Activation** :
  1. Liez votre dépôt GitHub sur [Vercel](https://vercel.com).
  2. Dans l'onglet **Analytics**, cliquez sur "Enable".
  3. Dans l'onglet **Speed Insights**, cliquez sur "Enable".
  4. Les métriques de trafic, taux de rebond, LCP, FID et CLS sont collectées automatiquement sans configuration supplémentaire.

### 2.2 Supabase (PostgreSQL & Storage)
- **Fichier client** : `src/lib/supabase.ts`
- **Fichier schéma PostgreSQL** : `prisma/schema.postgresql.prisma`
- **Commandes de gestion** :
  - Passer en mode PostgreSQL / Supabase :
    ```bash
    npm run db:postgres
    ```
  - Pousser le schéma dans la base Supabase :
    ```bash
    npm run db:push
    ```
  - Revenir au mode SQLite local (hors-ligne) :
    ```bash
    npm run db:sqlite
    ```
- **Configuration Supavisor** :
  - `DATABASE_URL` utilise le port de pooler `6543` avec `?pgbouncer=true` (indispensable pour les fonctions serverless de Vercel).
  - `DIRECT_URL` utilise le port direct `5432` pour les migrations Prisma.

### 2.3 Resend (Emails Transactionnels)
- **Fichier d'intégration** : `src/lib/email.ts`
- **Action serveur** : `emailInvoiceAction(invoiceId, recipientEmail)` dans `src/app/actions.ts`.
- **Fonctionnalités prêtes** :
  1. `sendInvoiceEmail` : transmission de la facture officielle avec PDF joint et mentions de la Loi 22-23 (exonération TVA).
  2. `sendPaymentReceiptEmail` : confirmation de règlement encaissé.
  3. `sendCeilingAlertEmail` : alerte lorsque le chiffre d'affaires approche le seuil légal de 5 000 000 DZD ou le risque sur 3 ans consécutifs.
- **Mode Développeur** :
  - Si `RESEND_API_KEY` n'est pas renseignée, le système simule l'envoi dans la console sans bloquer l'application ni générer d'erreur.

### 2.4 Cloudflare R2 (Stockage Objets S3-compatible)
- **Fichier d'intégration** : `src/lib/storage.ts`
- **Avantages** : Zéro coût sur la bande passante sortante (egress), vitesse Cloudflare Edge.
- **Dispatcher unifié** :
  - `persistInvoicePdf` essaie Cloudflare R2 en priorité, puis Supabase Storage en secours, et conserve le fichier en mémoire/disque local en développement.
- **Variables** :
  `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`.

### 2.5 Sentry (Monitoring des erreurs & Performance)
- **Fichiers de configuration** :
  - `sentry.client.config.ts` : erreurs côté navigateur.
  - `sentry.server.config.ts` : erreurs runtime Node.js.
  - `sentry.edge.config.ts` : erreurs runtime Edge.
  - `src/instrumentation.ts` : hook d'initialisation Next.js.
  - `src/lib/sentry.ts` : helper d'audit et de journalisation `captureException()` et `captureMessage()`.
  - `next.config.ts` : encapsulé avec `withSentryConfig`.

---

## 3. Guide de Déploiement pas-à-pas sur Vercel

### Étape 1 : Créer la base Supabase
1. Créez un projet sur [database.new](https://database.new).
2. Rendez-vous dans **Project Settings > Database**.
3. Récupérez les deux chaînes de connexion :
   - **Transaction Pooler (port 6543)** -> copier pour `DATABASE_URL`.
   - **Direct connection (port 5432)** -> copier pour `DIRECT_URL`.
4. Dans le terminal local, appliquez le schéma avec :
   ```bash
   npm run db:postgres
   DATABASE_URL="<votre_chaine_pooler>" DIRECT_URL="<votre_chaine_directe>" npm run db:push
   ```

### Étape 2 : Configurer Resend
1. Créez un compte sur [resend.com](https://resend.com).
2. Générez une clé API dans **API Keys**.
3. (Optionnel pour la prod) Ajoutez votre nom de domaine (ex: `moukawil.dz`) ou utilisez le domaine par défaut en test.

### Étape 3 : Configurer Cloudflare R2
1. Dans le tableau de bord Cloudflare, allez dans **R2 Object Storage**.
2. Créez un bucket nommé `moukawil-invoices`.
3. Cliquez sur **Manage R2 API Tokens** et créez un token avec les permissions "Object Read & Write".

### Étape 4 : Déployer sur Vercel
1. Importez votre dépôt GitHub sur [Vercel](https://vercel.com/new).
2. Dans la section **Environment Variables**, ajoutez les variables listées dans `.env.example` :
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `DATABASE_URL` (Supabase Pooler)
   - `DIRECT_URL` (Supabase Direct)
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
3. Cliquez sur **Deploy**.

---

## 4. Vérification et Tests

Toutes les briques ont été testées et validées :
- `npm test` : Vérifie l'ensemble des règles comptables et fiscales de la Loi 22-23.
- `npx tsx test-stack-integration.ts` : Valide l'interopérabilité de Sentry, Supabase, Resend et Cloudflare R2.
- `npx tsc --noEmit` : Compilé sans aucune erreur TypeScript.
