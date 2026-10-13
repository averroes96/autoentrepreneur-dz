/**
 * Algerian Banking & BaridiMob Utilities
 * Directory of Algerian Financial Institutions (Algérie Poste, BNA, BEA, etc.)
 * RIP, CCP, IBAN, SWIFT / BIC, and Payment Terms (Échéancier) Engine
 */

export interface AlgerianBankDef {
  code: string;
  id: string;
  name: string;
  fullName: string;
  swift: string;
  hasBaridiMob?: boolean;
  isPostal?: boolean;
  colorHex?: string;
}

export const ALGERIAN_BANKS: AlgerianBankDef[] = [
  {
    code: "007",
    id: "ALGERIE_POSTE",
    name: "Algérie Poste (CCP / BaridiMob)",
    fullName: "Algérie Poste — Comptes Chèques Postaux (CCP)",
    swift: "POAL DZ AL",
    hasBaridiMob: true,
    isPostal: true,
    colorHex: "#eab308", // Golden yellow / Postal blue
  },
  {
    code: "001",
    id: "BNA",
    name: "Banque Nationale d'Algérie (BNA)",
    fullName: "Banque Nationale d'Algérie — Société Nationale",
    swift: "BNAL DZ AL",
  },
  {
    code: "002",
    id: "BEA",
    name: "Banque Extérieure d'Algérie (BEA)",
    fullName: "Banque Extérieure d'Algérie",
    swift: "BEXA DZ AL",
  },
  {
    code: "003",
    id: "BADR",
    name: "Banque de l'Agriculture et du Développement Rural (BADR)",
    fullName: "Banque de l'Agriculture et du Développement Rural",
    swift: "BADR DZ AL",
  },
  {
    code: "004",
    id: "CPA",
    name: "Crédit Populaire d'Algérie (CPA)",
    fullName: "Crédit Populaire d'Algérie",
    swift: "CPAL DZ AL",
  },
  {
    code: "005",
    id: "BDL",
    name: "Banque de Développement Local (BDL)",
    fullName: "Banque de Développement Local",
    swift: "BDEL DZ AL",
  },
  {
    code: "008",
    id: "CNEP",
    name: "CNEP-Banque (Caisse Nationale d'Épargne et de Prévoyance)",
    fullName: "CNEP-Banque — Caisse Nationale d'Épargne et de Prévoyance",
    swift: "CNEP DZ AL",
  },
  {
    code: "006",
    id: "BARAKA",
    name: "Al Baraka Bank Algeria",
    fullName: "Banque Al Baraka d'Algérie",
    swift: "BARA DZ AL",
  },
  {
    code: "011",
    id: "AGB",
    name: "Gulf Bank Algeria (AGB)",
    fullName: "Gulf Bank Algérie",
    swift: "AGBL DZ AL",
  },
  {
    code: "021",
    id: "SOCIETE_GENERALE",
    name: "Société Générale Algérie (SGA)",
    fullName: "Société Générale Algérie",
    swift: "SGEN DZ AL",
  },
  {
    code: "014",
    id: "BNP_PARIBAS",
    name: "BNP Paribas El Djazaïr",
    fullName: "BNP Paribas El Djazaïr",
    swift: "BNPA DZ AL",
  },
  {
    code: "020",
    id: "NATIXIS",
    name: "Natixis Algérie",
    fullName: "Natixis Algérie",
    swift: "NATX DZ AL",
  },
  {
    code: "013",
    id: "BANK_ABC",
    name: "Bank ABC Algérie (Arab Banking Corporation)",
    fullName: "Arab Banking Corporation Algérie",
    swift: "ABCO DZ AL",
  },
  {
    code: "023",
    id: "FRANSABANK",
    name: "Fransabank El Djazaïr",
    fullName: "Fransabank El Djazaïr",
    swift: "FRAN DZ AL",
  },
  {
    code: "017",
    id: "HOUSING_BANK",
    name: "Housing Bank Algeria",
    fullName: "Housing Bank for Trade and Finance Algeria",
    swift: "HBAL DZ AL",
  },
  {
    code: "025",
    id: "AL_SALAM",
    name: "Al Salam Bank Algeria",
    fullName: "Banque Al Salam Algérie",
    swift: "ASAL DZ AL",
  },
  {
    code: "999",
    id: "AUTRE",
    name: "Autre établissement bancaire",
    fullName: "Autre banque ou compte international",
    swift: "",
  },
];

export interface PaymentTermsDef {
  key: string;
  labelFr: string;
  labelAr: string;
  shortFr: string;
  shortAr: string;
  days: number;
  isEndOfMonth?: boolean;
}

export const PAYMENT_TERMS_CONFIG: Record<string, PaymentTermsDef> = {
  UPON_RECEIPT: {
    key: "UPON_RECEIPT",
    labelFr: "À réception (Paiement immédiat)",
    labelAr: "عند الاستلام (دفع فوري)",
    shortFr: "À réception",
    shortAr: "عند الاستلام",
    days: 0,
  },
  "15_DAYS": {
    key: "15_DAYS",
    labelFr: "15 jours nets",
    labelAr: "خلال 15 يوماً",
    shortFr: "15 jours",
    shortAr: "15 يوماً",
    days: 15,
  },
  "30_DAYS": {
    key: "30_DAYS",
    labelFr: "30 jours nets",
    labelAr: "خلال 30 يوماً",
    shortFr: "30 jours",
    shortAr: "30 يوماً",
    days: 30,
  },
  "30_DAYS_END_OF_MONTH": {
    key: "30_DAYS_END_OF_MONTH",
    labelFr: "30 jours fin de mois",
    labelAr: "30 يوماً نهاية الشهر",
    shortFr: "30j fin de mois",
    shortAr: "30 يوماً نهاية الشهر",
    days: 30,
    isEndOfMonth: true,
  },
  "45_DAYS": {
    key: "45_DAYS",
    labelFr: "45 jours nets",
    labelAr: "خلال 45 يوماً",
    shortFr: "45 jours",
    shortAr: "45 يوماً",
    days: 45,
  },
  "60_DAYS": {
    key: "60_DAYS",
    labelFr: "60 jours nets",
    labelAr: "خلال 60 يوماً",
    shortFr: "60 jours",
    shortAr: "60 يوماً",
    days: 60,
  },
};

export const PAYMENT_TERMS_LIST = Object.values(PAYMENT_TERMS_CONFIG);

export const PAYMENT_INSTRUCTION_SUGGESTIONS = [
  "Mentionner impérativement le numéro de facture en référence du virement BaridiMob.",
  "Virement bancaire ou postal au crédit du compte RIP ci-dessus.",
  "Règlement par virement BaridiMob ou versement en bureau de poste.",
  "Paiement par chèque bancaire ou virement sous 15 jours à compter de la réception.",
  "Pour tout virement international (EUR/USD), mentionner le code SWIFT et les frais à charge de l'émetteur (OUR).",
];

/**
 * Calculates due date based on issue date and selected payment terms.
 */
export function calculateDueDate(
  issueDate: Date | string,
  paymentTermsKey: string = "UPON_RECEIPT"
): Date {
  const d = new Date(issueDate);
  const cfg = PAYMENT_TERMS_CONFIG[paymentTermsKey] || PAYMENT_TERMS_CONFIG.UPON_RECEIPT;

  if (cfg.key === "UPON_RECEIPT") {
    return new Date(d);
  }

  if (cfg.isEndOfMonth) {
    // 30 days end of month: advance 1 month then set to last day of that month
    const target = new Date(d.getFullYear(), d.getMonth() + 2, 0);
    return target;
  }

  const result = new Date(d);
  result.setDate(result.getDate() + cfg.days);
  return result;
}

/**
 * Cleans a RIP or CCP string to pure alphanumeric digits.
 */
export function cleanBankString(val: string | null | undefined): string {
  if (!val) return "";
  return val.replace(/[\s\-_.]/g, "").toUpperCase();
}

/**
 * Formats a 20-digit Algerian RIP into readable 4-part grouped format:
 * "007 99999 0012345678 90" (Bank, Guichet, Account, Key)
 */
export function formatRip(rip: string | null | undefined): string {
  const clean = cleanBankString(rip);
  if (!clean) return "";
  if (clean.length === 20) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 8)} ${clean.slice(8, 18)} ${clean.slice(18, 20)}`;
  }
  // Group in 4s if general format
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Computes 2-digit Clé CCP from CCP account number using Algérie Poste algorithm.
 * Clé = 97 - ((CCP * 100) % 97)
 */
export function calculateCcpKey(ccpAccount: string): string {
  const clean = ccpAccount.replace(/\D/g, "");
  if (!clean) return "";
  try {
    const num = BigInt(clean);
    const remainder = Number((num * BigInt(100)) % BigInt(97));
    const key = (97 - remainder) % 97;
    return key.toString().padStart(2, "0");
  } catch {
    return "";
  }
}

/**
 * Computes 20-digit Algérie Poste RIP from legacy CCP account and optional Key.
 * Format: 007 99999 [10-digit account] [2-digit key]
 */
export function computeRipFromCcp(ccpAccount: string, customKey?: string): string {
  const cleanAcc = ccpAccount.replace(/\D/g, "");
  if (!cleanAcc) return "";

  const paddedAccount = cleanAcc.padStart(10, "0");
  const key = customKey && customKey.trim().length > 0
    ? customKey.replace(/\D/g, "").padStart(2, "0")
    : calculateCcpKey(cleanAcc);

  return `00799999${paddedAccount}${key}`;
}

/**
 * Formats IBAN into 4-character chunks: DZ50 0079 9999 0012 3456 7890
 */
export function formatIban(iban: string | null | undefined): string {
  const clean = cleanBankString(iban);
  if (!clean) return "";
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Looks up bank details by bank name or code.
 */
export function findBankDef(nameOrCode: string | null | undefined): AlgerianBankDef | undefined {
  if (!nameOrCode) return undefined;
  const target = nameOrCode.trim().toLowerCase();
  return ALGERIAN_BANKS.find(
    (b) =>
      b.id.toLowerCase() === target ||
      b.code === target ||
      b.name.toLowerCase().includes(target) ||
      target.includes(b.name.toLowerCase())
  );
}

/**
 * Checks if the bank is Algérie Poste / BaridiMob.
 */
export function isBaridiMobAccount(bankName: string | null | undefined, bankRib: string | null | undefined): boolean {
  if (bankName && (bankName.includes("007") || bankName.toLowerCase().includes("poste") || bankName.toLowerCase().includes("baridi"))) {
    return true;
  }
  const cleanRib = cleanBankString(bankRib);
  if (cleanRib.startsWith("007")) {
    return true;
  }
  return false;
}
