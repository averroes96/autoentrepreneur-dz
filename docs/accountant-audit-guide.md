# Guide d'Audit Légal & Accès Expert-Comptable (Loi 22-23)

Ce guide est destiné aux auto-entrepreneurs et à leurs **experts-comptables / commissaires aux comptes**. Il détaille le fonctionnement du portail d'audit dédié en lecture seule, le modèle de sécurité à code PIN, et la structure de l'archive ZIP d'audit légal générée par Moukawil.dz.

---

## 1. Cadre Juridique & Rôle de l'Auditeur

En vertu de la **Loi n° 22-23 du 18 décembre 2022** portant statut de l'auto-entrepreneur en Algérie :
- L'auto-entrepreneur est dispensé de tenir une comptabilité commerciale lourde en partie double (pas de bilan d'actif/passif complexe, pas de compte de résultat classique du SCF).
- En contrepartie, il est soumis à la tenue obligatoire d'un **Livre des Recettes** chronologique inaltérable et d'un **Registre des Dépenses**.
- L'assiette d'imposition à **l'Impôt Forfaitaire Unique (IFU)** à 0,5% (Loi de Finances 2024) est calculée sur le **Chiffre d'Affaires Net Encaissé** (comptabilité de caisse / encaissement réel).

Le module **Accès Expert-Comptable** de Moukawil.dz permet au professionnel du chiffre de certifier les écritures annuelles, de vérifier l'absence de dépassement du plafond de 5 000 000 DZD, et d'établir la déclaration fiscale annuelle (série G n° 12 bis).

---

## 2. Modèle de Sécurité du Portail d'Audit

### 2.1 Invitation et Token Sécurisé
- L'auto-entrepreneur génère un lien d'accès nominatif depuis l'onglet `/accountant`.
- Un jeton cryptographique aléatoire de 32 octets (`crypto.randomBytes(32).toString('hex')`) est généré.
- Le lien prend la forme : `https://moukawil.dz/portal/accountant/<token>`.
- Une durée de validité est obligatoirement fixée : **7 jours, 30 jours, 90 jours ou 1 an**.
- L'auto-entrepreneur peut **révoquer** l'accès à tout instant.

### 2.2 Verrouillage par Code PIN (6 Chiffres)
- L'accès peut être protégé par un code PIN à 6 chiffres configuré lors de l'invitation.
- Le code PIN est haché de manière sécurisée en base de données avec `bcryptjs` (salt rounds = 10) ; le code en clair n'est jamais stocké.
- L'auditeur doit saisir son code PIN sur l'écran d'accueil du portail (`AccountantPinGate`).
- Le token de session validé est conservé dans le sessionStorage du navigateur de l'auditeur.

### 2.3 Principe du "Strict Read-Only" (Lecture Seule)
- Le portail d'audit opère dans un sous-arbre indépendant (`/portal/accountant/[token]`).
- Aucune route de modification, suppression, création de facture ou altération de données n'est exposée.
- Même en cas de tentative d'injection, les endpoints API sous `/portal` et `/api/accountant/[token]` ne fournissent que des opérations de lecture (`GET`).

---

## 3. Contenu du Portail d'Audit en Ligne

Le portail offre 4 vues d'analyse financière et comptable :

### 3.1 Vue d'Ensemble & Rapprochement Fiscal
- **Indicateurs Clés** : Total Facturé, Total Encaissé, Avoirs émis, et Charges totales d'exploitation.
- **Assiette Fiscale IFU** : Calcul exact du Chiffre d'Affaires Net Encaissé :
  $$\text{Assiette IFU} = \sum \text{Factures Encaissées} - \sum \text{Avoirs Rattachés}$$
- **Impôt Forfaitaire Unique (0,5%)** :
  $$\text{IFU Dû} = \max(\text{Assiette IFU} \times 0.005, 10\,000 \text{ DZD})$$
- **Suivi du Plafond de 5 000 000 DZD** : Vérification du respect des seuils de la Loi 22-23 et de l'absence de dépassement sur 3 exercices consécutifs.

### 3.2 Grand Livre des Ventes (Livre des Recettes)
- Liste exhaustive de toutes les factures officielles (`FAC-2026-XXXX`).
- Date d'émission, client, montant en devises (si applicable), contre-valeur en DZD au cours officiel Banque d'Algérie, date d'encaissement et mode de paiement.
- Statut d'encaissement en temps réel (Encaissé, En attente, Annulé).

### 3.3 Journal des Achats & Charges
- Tableau des dépenses professionnelles avec justificatifs.
- Ventilation par catégories (Abonnements logiciels, hébergement, fournitures, télécoms, etc.).
- Calcul du total des charges d'exploitation déductibles du résultat économique.

### 3.4 Bilan & Compte de Résultat Simplifié
- Chiffre d'Affaires Net encaissé.
- Moins : Total des charges d'exploitation.
- Moins : Impôt IFU légal (0,5%).
- Moins : Cotisation sociale forfaitaire CASNOS (24 000 DZD).
- **= Résultat Net Réel de l'Activité**.

---

## 4. Composition du Pack d'Audit Légal (ZIP)

L'expert-comptable peut télécharger en un clic l'archive complète `Pack_Audit_Loi_22-23_<Année>_<Nom>.zip`. Cette archive contient 5 pièces officielles :

```
Pack_Audit_Loi_22-23_2026_Karim_Meziane.zip
├── 01_Bilan_Fiscal_IFU_G12_bis_2026.pdf
├── 02_Livre_des_Recettes_2026.csv
├── 03_Registre_des_Depenses_2026.csv
├── 04_Grand_Livre_Clients_2026.csv
└── 05_Attestation_Audit_Loi_22-23_2026.txt
```

### Détail de chaque pièce :

1. **`01_Bilan_Fiscal_IFU_G12_bis_2026.pdf`** :
   - Synthèse fiscale vectorielle certifiée avec coordonnées de l'auto-entrepreneur, NIF, RNAE, numéro de carte, calcul de l'assiette IFU, impôt dû et historique des 3 derniers exercices.
2. **`02_Livre_des_Recettes_2026.csv`** :
   - Tableau séquentiel inaltérable conforme au Code des Impôts Directs (Date, N° Facture, Client, Libellé de prestation, Montant DZD, Mode d'encaissement, Date d'encaissement).
   - Encodé en UTF-8 avec BOM (`\uFEFF`) pour une compatibilité native parfaite avec Microsoft Excel.
3. **`03_Registre_des_Depenses_2026.csv`** :
   - Journal des charges professionnelles (Date, Catégorie, Fournisseur, Montant DZD, N° Pièce justificative).
4. **`04_Grand_Livre_Clients_2026.csv`** :
   - Balances individuelles des comptes clients avec montants facturés, montants réglés et soldes restant dus.
5. **`05_Attestation_Audit_Loi_22-23_2026.txt`** :
   - Manifeste officiel d'intégrité contenant la date de génération, l'identité de l'auditeur, les paramètres légaux appliqués et l'empreinte de contrôle SHA-256 de l'extraction.
