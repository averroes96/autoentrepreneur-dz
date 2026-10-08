/**
 * French Number to Words Converter for Algerian Commercial and Administrative Documents
 * Conforme aux règles d'orthographe administrative (chiffres en lettres).
 */

const ONES = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];

const TENS = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingts",
  "quatre-vingt-dix",
];

function convertBelowThousand(n: number): string {
  if (n === 0) return "";

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  const parts: string[] = [];

  if (hundreds > 0) {
    if (hundreds === 1) {
      parts.push("cent");
    } else {
      parts.push(`${ONES[hundreds]} cent${remainder === 0 ? "s" : ""}`);
    }
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else if (remainder < 70) {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      if (unit === 1) {
        parts.push(`${TENS[ten]} et un`);
      } else if (unit > 1) {
        parts.push(`${TENS[ten]}-${ONES[unit]}`);
      } else {
        parts.push(TENS[ten]);
      }
    } else if (remainder < 80) {
      // 70-79: soixante-dix, soixante et onze, etc.
      const unit = remainder - 60;
      if (unit === 11) {
        parts.push("soixante et onze");
      } else {
        parts.push(`soixante-${ONES[unit]}`);
      }
    } else if (remainder < 90) {
      // 80-89: quatre-vingts, quatre-vingt-un, etc.
      const unit = remainder - 80;
      if (unit === 0) {
        parts.push("quatre-vingts");
      } else {
        parts.push(`quatre-vingt-${ONES[unit]}`);
      }
    } else {
      // 90-99: quatre-vingt-dix, quatre-vingt-onze, etc.
      const unit = remainder - 80;
      parts.push(`quatre-vingt-${ONES[unit]}`);
    }
  }

  return parts.join(" ");
}

export function numberToFrenchWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "zéro";

  const billions = Math.floor(rounded / 1_000_000_000);
  const millions = Math.floor((rounded % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1_000);
  const remainder = rounded % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(billions === 1 ? "un milliard" : `${convertBelowThousand(billions)} milliards`);
  }

  if (millions > 0) {
    parts.push(millions === 1 ? "un million" : `${convertBelowThousand(millions)} millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("mille");
    } else {
      parts.push(`${convertBelowThousand(thousands)} mille`);
    }
  }

  if (remainder > 0) {
    parts.push(convertBelowThousand(remainder));
  }

  const result = parts.join(" ").trim();
  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function getFrenchAmountInWords(amount: number, currency: string = "dinars algériens"): string {
  const words = numberToFrenchWords(amount);
  return `${words} ${currency} et zéro centimes.`;
}
