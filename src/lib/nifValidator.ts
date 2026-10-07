import { getWilayaByCode, Wilaya } from "@/data/wilayas";

export interface NifValidationResult {
  isValid: boolean;
  cleanNif: string;
  formattedNif: string;
  error?: string;
  wilaya?: Wilaya;
  year?: number;
}

/**
 * Nettoie et extrait uniquement les chiffres d'une chaîne NIF.
 */
export function sanitizeNif(rawNif: string): string {
  if (!rawNif) return "";
  return rawNif.replace(/\D/g, "");
}

/**
 * Formate un NIF de 15 chiffres en blocs lisibles :
 * Ex: "198016010023456" -> "1980 16010 023456"
 */
export function formatNif(rawNif: string): string {
  const clean = sanitizeNif(rawNif);
  if (clean.length !== 15) return rawNif;
  return `${clean.slice(0, 4)} ${clean.slice(4, 9)} ${clean.slice(9, 15)}`;
}

/**
 * Algorithme de validation du Numéro d'Identification Fiscale (NIF) Algérien
 * Conformité : Direction Générale des Impôts (DGI) - 15 chiffres pour personne physique / auto-entrepreneur.
 *
 * Règles vérifiées :
 * 1. Longueur stricte de 15 chiffres.
 * 2. Caractères purement numériques (0-9).
 * 3. Rejet des séquences triviales / fictives (ex: 000000000000000, 111111111111111).
 * 4. Validation du code Wilaya d'enregistrement (selon les formats usuels DGI).
 */
export function validateAlgerianNif(rawNif: string): NifValidationResult {
  const clean = sanitizeNif(rawNif);

  if (!clean || clean.length === 0) {
    return {
      isValid: false,
      cleanNif: "",
      formattedNif: "",
      error: "Le NIF est obligatoire pour toute facturation conforme en Algérie.",
    };
  }

  // Vérification de la longueur stricte
  if (clean.length !== 15) {
    return {
      isValid: false,
      cleanNif: clean,
      formattedNif: clean,
      error: `Le NIF doit comporter exactement 15 chiffres (actuellement ${clean.length}/15).`,
    };
  }

  // Rejet des valeurs fictives répétées
  if (/^(\d)\1{14}$/.test(clean)) {
    return {
      isValid: false,
      cleanNif: clean,
      formattedNif: clean,
      error: "Le NIF renseigné est une séquence invalide ou de test.",
    };
  }

  const currentYear = new Date().getFullYear();
  let detectedWilaya: Wilaya | undefined;
  let detectedYear: number | undefined;

  // Format 1 : Année de naissance en tête (ex: 1990 16 01 0023456)
  const headYear = parseInt(clean.slice(0, 4), 10);
  if (headYear >= 1940 && headYear <= currentYear) {
    const candidateWilayaCode = clean.slice(4, 6);
    const wilayaCandidate = getWilayaByCode(candidateWilayaCode);
    if (wilayaCandidate) {
      detectedWilaya = wilayaCandidate;
      detectedYear = headYear;
    }
  }

  // Format 2 : Wilaya en tête (ex: 16 80 1601 0023456)
  if (!detectedWilaya) {
    const headWilaya = getWilayaByCode(clean.slice(0, 2));
    if (headWilaya) {
      detectedWilaya = headWilaya;
      const midYear = parseInt(clean.slice(4, 8), 10);
      if (midYear >= 1940 && midYear <= currentYear) {
        detectedYear = midYear;
      }
    }
  }

  // Format 3 : Préfixe de statut '0' ou '1' suivi du code Wilaya (ex: 0 16 01 1990 002345)
  if (!detectedWilaya && (clean[0] === "0" || clean[0] === "1")) {
    const prefixedWilaya = getWilayaByCode(clean.slice(1, 3));
    if (prefixedWilaya) {
      detectedWilaya = prefixedWilaya;
      const yearInBody = parseInt(clean.slice(5, 9), 10);
      if (yearInBody >= 1940 && yearInBody <= currentYear) {
        detectedYear = yearInBody;
      }
    }
  }

  if (!detectedWilaya) {
    return {
      isValid: false,
      cleanNif: clean,
      formattedNif: clean,
      error: "Code Wilaya d'enregistrement introuvable dans le NIF (doit correspondre à l'une des 58 Wilayas d'Algérie).",
    };
  }

  return {
    isValid: true,
    cleanNif: clean,
    formattedNif: formatNif(clean),
    wilaya: detectedWilaya,
    year: detectedYear,
  };
}
