# Moukawil.dz — Auto-Entrepreneur Management App (Algérie)

Application web de gestion d'activité, facturation légale séquentielle et suivi de conformité fiscale pour les auto-entrepreneurs en Algérie régis par la **Loi 22-23 du 18 décembre 2022** et le **régime fiscal de l'Impôt Forfaitaire Unique (IFU)**.

---

## 🚀 Démarrage Rapide en Local

### 1. Prérequis
- **Node.js** (v18+)
- **npm** (v9+)

### 2. Installation
```bash
# Cloner le dépôt et se placer dans le projet
cd /Users/admin/Github/autoentrepreneur-dz

# Installer les dépendances
npm install
```

### 3. Base de données & Données de démonstration
L'application utilise **SQLite** en local (via Prisma ORM) pour une installation immédiate sans serveur de base de données externe à configurer :
```bash
# Initialiser et synchroniser le schéma SQLite
npx prisma db push

# Charger les données initiales de démonstration
npm run seed
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez votre navigateur sur **[http://localhost:3000](http://localhost:3000)**.

### 5. Compte de démonstration pré-configuré
- **Email** : `demo@autoentrepreneur.dz`
- **Mot de passe** : `password123`

---

## 🧪 Tests d'Intégration & Conformité Fiscale

Un script de test automatisé vérifie de bout en bout :
1. L'isolation multi-tenant des données.
2. La numérotation séquentielle sans doublon ni saut (`FAC-2026-XXXX`).
3. L'immuabilité des factures émises et le flux d'annulation justifié.
4. Le moteur de calcul de l'IFU (taux de 0.5% avec plancher de 10 000 DZD).
5. La jauge du plafond annuel de 5 000 000 DZD (chiffre d'affaires encaissé).
6. La règle réglementaire des 3 années consécutives (Loi 22-23).
7. La génération vectorielle du fichier PDF de facture conforme.

Pour exécuter la suite de tests :
```bash
npm test
```

---

## ⚙️ Comment Mettre à Jour les Règles Fiscales & Réglementaires

Conformément à la section 6 du BRD, **aucun chiffre ni seuil légal n'est codé en dur dans la logique métier**. Tous les paramètres fiscaux et réglementaires sont centralisés dans un fichier unique, typé et documenté :

📁 **`src/config/regulatory.ts`**

### Structure du fichier de configuration :
```typescript
export const REGULATORY_CONFIG: RegulatoryConfig = {
  ifu: {
    rate: 0.005, // 0.5% du chiffre d'affaires encaissé (Loi de Finances 2024)
    minimumAnnualTaxDzd: 10_000, // Minimum de 10 000 DZD dû même en cas de CA nul
    annualDeclarationDeadline: {
      month: 1, // Janvier
      day: 31,  // 31 Janvier N+1
      description: "31 Janvier de l'année suivant l'exercice d'imposition",
    },
  },
  turnoverCeiling: {
    annualLimitDzd: 5_000_000, // Plafond annuel de 5 000 000 DZD
    warningThresholds: {
      yellow: 0.80, // Alerte jaune dès 80% (4 000 000 DZD)
      red: 0.95,    // Alerte rouge critique dès 95% (4 750 000 DZD)
    },
    consecutiveYearsLimit: 3, // 3 années consécutives
    nearZeroThresholdDzd: 50_000, // Seuil d'activité quasi-nulle
  },
  casnos: {
    defaultAnnualContributionDzd: 24_000, // Cotisation forfaitaire CASNOS de 24 000 DZD/an
    affiliationDeadlineDays: 10, // 10 jours après le début d'activité
    annualPaymentDeadlineDescription: "Selon le calendrier fixé par la CASNOS (habituellement fin juin)",
  },
  fiscalRegistration: {
    declarationDeadlineDays: 30, // 30 jours après réception de la carte ANAE
  },
  card: {
    validityYears: 5, // Validité de la carte auto-entrepreneur (5 ans)
  },
  defaultVatExemptionNote:
    "Exonéré de la TVA conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur et du Code des Impôts Directs (Régime IFU).",
  currencies: {
    active: ["DZD"],
    default: "DZD",
    labels: {
      DZD: "Dinar Algérien (DZD)",
    },
  },
};
```

### Cas concrets de mise à jour :

#### 1. Si une nouvelle Loi de Finances modifie le taux de l'IFU (ex: passage à 1%) :
Ouvrez `src/config/regulatory.ts` et modifiez :
```typescript
ifu: {
  rate: 0.01, // 1%
  // ...
}
```
*Le tableau de bord et toutes les estimations se recalculeront instantanément.*

#### 2. Si le plafond annuel est réévalué (ex: passage à 7 000 000 DZD) :
Modifiez :
```typescript
turnoverCeiling: {
  annualLimitDzd: 7_000_000,
  // ...
}
```

#### 3. Si la cotisation CASNOS forfaitaire est revalorisée :
Modifiez :
```typescript
casnos: {
  defaultAnnualContributionDzd: 30_000,
  // ...
}
```

#### 4. Si la mention légale d'exonération de TVA requise par votre centre des impôts évolue :
- Vous pouvez soit modifier le texte par défaut dans `src/config/regulatory.ts` sous `defaultVatExemptionNote`.
- Soit personnaliser la mention directement dans votre interface utilisateur via la page **Profil & Conformité** (`/profile`).

---

## 🏛️ Fonctionnalités Phase 1 (MVP) Livrées

- **Multi-Tenant dès l'origine** : Chaque auto-entrepreneur dispose de son compte entreprise dédié avec isolation stricte des données (`tenant_id`).
- **Création & Gestion des Clients** :
  - Distinction Particuliers vs Professionnels (Agences / Entreprises).
  - Gestion des mentions légales entreprises : NIF, NIS, RC, adresse.
  - Recherche instantanée et archivage.
- **Cycle de Facturation Conforme (Loi 22-23)** :
  - **Mode Brouillon** : Édition et suppression libres sans consommer de numéro fiscal.
  - **Émission officielle (Scellement)** : Attribution atomique et sans rupture du numéro séquentiel (`FAC-2026-0001`). Capture figée de l'identité émetteur/client garantissant l'immuabilité historique.
  - **Zéro TVA & Pas de split HT/TTC** : Affichage exclusif du montant total en DZD, assorti de la mention d'exonération obligatoire.
  - **Téléchargement PDF natif** : Facture prête à l'impression et transmissible aux agences/clients.
  - **Flux d'Annulation contrôlé** : Conservation du numéro séquentiel au registre comptable avec saisie d'un motif obligatoire.
  - **Suivi d'encaissement** : Bascule en un clic « Marquer comme Payée (Encaissée) » pour refléter la réalité fiscale.
- **Tableau de Bord Fiscal & Réglementaire en Direct** :
  - Jauge de progression vers le plafond de **5 000 000 DZD** (codes couleur : vert, attention ≥80%, alerte ≥95%, dépassement).
  - Estimation de l'**IFU (0.5%)** avec application automatique du plancher légal de **10 000 DZD**.
  - Suivi de la **règle des 3 années consécutives** avec historique pluriannuel personnalisable dans les paramètres.
