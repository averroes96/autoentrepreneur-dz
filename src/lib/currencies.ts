import { numberToFrenchWords } from "./numberToWordsFr";
import { tafqeetNumberToArabicWords } from "./arabicNomenclature";

export type CurrencyCode = "DZD" | "EUR" | "USD" | "GBP" | "CAD" | "CHF";

export interface CurrencyDef {
  code: CurrencyCode;
  symbol: string;
  nameFr: string;
  nameAr: string;
  defaultRate: number; // Taux indicatif officiel Banque d'Algérie en DZD
  wordsFr: string;
  wordsAr: string;
  isBase: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyDef[] = [
  {
    code: "DZD",
    symbol: "DZD",
    nameFr: "Dinar Algérien (DZD)",
    nameAr: "دينار جزائري (د.ج)",
    defaultRate: 1.0,
    wordsFr: "dinars algériens",
    wordsAr: "دينار جزائري",
    isBase: true,
  },
  {
    code: "EUR",
    symbol: "€",
    nameFr: "Euro (€)",
    nameAr: "يورو (€)",
    defaultRate: 146.5,
    wordsFr: "euros",
    wordsAr: "يورو",
    isBase: false,
  },
  {
    code: "USD",
    symbol: "$",
    nameFr: "Dollar Américain ($)",
    nameAr: "دولار أمريكي ($)",
    defaultRate: 134.2,
    wordsFr: "dollars américains",
    wordsAr: "دولار أمريكي",
    isBase: false,
  },
  {
    code: "GBP",
    symbol: "£",
    nameFr: "Livre Sterling (£)",
    nameAr: "جنيه إسترليني (£)",
    defaultRate: 175.8,
    wordsFr: "livres sterling",
    wordsAr: "جنيه إسترليني",
    isBase: false,
  },
  {
    code: "CAD",
    symbol: "CA$",
    nameFr: "Dollar Canadien (CA$)",
    nameAr: "دولار كندي (CA$)",
    defaultRate: 98.4,
    wordsFr: "dollars canadiens",
    wordsAr: "دولار كندي",
    isBase: false,
  },
  {
    code: "CHF",
    symbol: "CHF",
    nameFr: "Franc Suisse (CHF)",
    nameAr: "فرنك سويسري (CHF)",
    defaultRate: 154.6,
    wordsFr: "francs suisses",
    wordsAr: "فرنك سويسري",
    isBase: false,
  },
];

export const DEFAULT_CURRENCY: CurrencyCode = "DZD";

export function getCurrencyDef(code?: string | null): CurrencyDef {
  const normalized = (code || "DZD").toUpperCase() as CurrencyCode;
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === normalized);
  return (
    found || {
      code: "DZD",
      symbol: "DZD",
      nameFr: "Dinar Algérien (DZD)",
      nameAr: "دينار جزائري (د.ج)",
      defaultRate: 1.0,
      wordsFr: "dinars algériens",
      wordsAr: "دينار جزائري",
      isBase: true,
    }
  );
}

/**
 * Calcule la contre-valeur en Dinar Algérien (DZD) selon le taux de change appliqué.
 * Sous la Loi 22-23 et la réglementation fiscale algérienne, le chiffre d'affaires
 * pour le calcul de l'IFU (0,5%) et le suivi du plafond (5 000 000 DZD)
 * doit être arrêté en Dinars Algériens (DZD) au cours officiel du jour de facturation.
 */
export function calculateDzdEquivalent(
  amount: number,
  currency: string,
  exchangeRate?: number | null
): number {
  if (currency === "DZD") {
    return Math.round(amount * 100) / 100;
  }
  const rate =
    typeof exchangeRate === "number" && exchangeRate > 0
      ? exchangeRate
      : getCurrencyDef(currency).defaultRate;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Formatage monétaire adapté à la langue et à la devise
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string = "DZD",
  locale: string = "fr"
): string {
  const def = getCurrencyDef(currency);
  const rounded = Math.round(amount * 100) / 100;

  // Format standard des nombres avec séparateur d'espace
  const parts = rounded.toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decPart = parts[1];
  const formattedNum = decPart === "00" ? intPart : `${intPart},${decPart}`;

  if (locale === "ar") {
    if (def.code === "DZD") {
      return `\u2066${formattedNum}\u2069 د.ج`;
    }
    return `\u2066${formattedNum}\u2069 ${def.symbol}`;
  }

  // French formatting
  if (def.code === "DZD") {
    return `${formattedNum} DZD`;
  }
  return `${formattedNum} ${def.symbol}`;
}

/**
 * Montant en toutes lettres dans la devise facturée
 */
export function getAmountInWordsWithCurrency(
  amount: number,
  currency: string = "DZD",
  locale: string = "fr"
): string {
  const def = getCurrencyDef(currency);
  const rounded = Math.round(amount);

  if (locale === "ar") {
    const arabicWords = tafqeetNumberToArabicWords(rounded);
    return `أُوقفت هذه الفاتورة عند المبلغ الصافي الإجمالي وقدره : ${arabicWords} ${def.wordsAr} لا غير.`;
  }

  const frenchWords = numberToFrenchWords(rounded);
  return `${frenchWords} ${def.wordsFr} et zéro centimes.`;
}

/**
 * Mention réglementaire pour les factures et devis en devises étrangères
 * Obligatoire pour justifier la conversion fiscale auprès de la DGI et de la Banque d'Algérie.
 */
export function getExchangeRateNotice(
  currency: string,
  exchangeRate: number,
  totalDzd: number,
  locale: string = "fr"
): string {
  const formattedRate = exchangeRate.toLocaleString("fr-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const formattedTotalDzd = formatCurrencyAmount(totalDzd, "DZD", locale);

  if (locale === "ar") {
    return `* المقابل الجبائي الرسمي بالدينار : ${formattedTotalDzd} (سعر الصرف المعتمد : 1 ${currency} = ${formattedRate} د.ج وفقاً للنشرة الرسمية لبنك الجزائر). المبلغ الخاضع للضريبة الجزافية الوحيدة IFU.`;
  }

  return `* Contre-valeur fiscale légale : ${formattedTotalDzd} (Cours officiel appliqué : 1 ${currency} = ${formattedRate} DZD - Banque d'Algérie). Montant retenu pour l'assiette IFU (Loi 22-23).`;
}
