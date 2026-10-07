/**
 * REGULATORY & TAX CONFIGURATION LAYER
 * Auto-Entrepreneur Regime — Algeria (Law 22-23 & Annual Finance Laws)
 *
 * CRITICAL REQUIREMENT (BRD Section 6):
 * All regulatory figures, rates, ceilings, minimums, and legal deadlines must live in this
 * single configuration file and NEVER be hardcoded into business logic.
 *
 * How to update:
 * Whenever Algeria's annual Finance Law (Loi de Finances) or executive decrees update
 * tax rates, ceilings, or contribution amounts, modify the values in this file.
 */

export interface RegulatoryConfig {
  /**
   * Impôt Forfaitaire Unique (IFU) - Flat rate tax
   * Unified to 0.5% by the 2024 Finance Law (LF 2024). Replaces IRG, IBS, TAP, and VAT.
   */
  ifu: {
    /** Flat rate applied to gross turnover (chiffre d'affaires encaissé). 0.005 = 0.5% */
    rate: number;
    /** Minimum annual IFU tax due even if turnover is zero (in DZD). Currently 10,000 DZD */
    minimumAnnualTaxDzd: number;
    /** Annual tax declaration deadline: normally January 31 of year N+1 */
    annualDeclarationDeadline: {
      month: number; // 1 = January
      day: number;   // 31
      description: string;
    };
  };

  /**
   * Annual Turnover Ceiling (Plafond de Chiffre d'Affaires)
   * Set by Law 22-23 at 5,000,000 DZD / calendar year.
   */
  turnoverCeiling: {
    /** Maximum annual turnover allowed under auto-entrepreneur status */
    annualLimitDzd: number;
    /** Warning thresholds for UI progress bar */
    warningThresholds: {
      /** Yellow alert threshold: 80% (4,000,000 DZD) */
      yellow: number;
      /** Red alert threshold: 95% (4,750,000 DZD) */
      red: number;
    };
    /**
     * Number of consecutive years at/near zero or exceeding the ceiling
     * before forced deregistration or transition to EURL/SARL.
     */
    consecutiveYearsLimit: number;
    /** Definition of near-zero annual turnover threshold in DZD */
    nearZeroThresholdDzd: number;
  };

  /**
   * Social Security (CASNOS)
   * Non-salaried workers' social security fund
   */
  casnos: {
    /** Default flat annual contribution scheme (in DZD) for Auto-Entrepreneurs */
    defaultAnnualContributionDzd: number;
    /** Standard non-salaried rate (15% of declared income) */
    standardRate: number;
    /** Statutory minimum contribution under standard scheme (15% of 3x SNMG = 36,000 DZD) */
    standardMinimumAnnualDzd: number;
    /** Affiliation deadline: 10 days after activity start */
    affiliationDeadlineDays: number;
    /** Annual contribution payment deadline description */
    annualPaymentDeadlineDescription: string;
  };

  /**
   * Fiscal Registration (DGI / NIF)
   */
  fiscalRegistration: {
    /** Déclaration d'existence deadline: 30 days after card issuance */
    declarationDeadlineDays: number;
  };

  /**
   * Auto-Entrepreneur Card Validity
   */
  card: {
    /** Card validity duration in years */
    validityYears: number;
  };

  /**
   * Default VAT exemption note to display on invoices (editable per profile)
   * Under Law 22-23, auto-entrepreneurs do not charge, collect, or remit VAT.
   */
  defaultVatExemptionNote: string;

  /**
   * Currency Configuration
   */
  currencies: {
    active: string[];
    default: string;
    labels: Record<string, string>;
  };
}

export const REGULATORY_CONFIG: RegulatoryConfig = {
  ifu: {
    rate: 0.005, // 0.5%
    minimumAnnualTaxDzd: 10_000,
    annualDeclarationDeadline: {
      month: 1, // January
      day: 31,
      description: "31 Janvier de l'année suivant l'exercice d'imposition",
    },
  },
  turnoverCeiling: {
    annualLimitDzd: 5_000_000,
    warningThresholds: {
      yellow: 0.80, // 80% -> 4,000,000 DZD
      red: 0.95,    // 95% -> 4,750,000 DZD
    },
    consecutiveYearsLimit: 3,
    nearZeroThresholdDzd: 50_000,
  },
  casnos: {
    defaultAnnualContributionDzd: 24_000,
    standardRate: 0.15,
    standardMinimumAnnualDzd: 36_000,
    affiliationDeadlineDays: 10,
    annualPaymentDeadlineDescription: "Selon le calendrier fixé par la CASNOS (habituellement fin juin)",
  },
  fiscalRegistration: {
    declarationDeadlineDays: 30,
  },
  card: {
    validityYears: 5,
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

export default REGULATORY_CONFIG;
