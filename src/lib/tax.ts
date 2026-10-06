import { REGULATORY_CONFIG } from "@/config/regulatory";

export interface IfuCalculationResult {
  turnoverDzd: number;
  rate: number;
  rawTaxDzd: number;
  minimumTaxDzd: number;
  taxOwedDzd: number;
  isMinimumApplied: boolean;
}

export interface CeilingStatusResult {
  currentTurnoverDzd: number;
  ceilingLimitDzd: number;
  percentage: number;
  remainingDzd: number;
  status: "NORMAL" | "WARNING" | "CRITICAL" | "EXCEEDED";
  statusLabel: string;
  badgeColor: string;
}

export interface ConsecutiveYearsRuleResult {
  history: Array<{
    year: number;
    turnoverDzd: number;
    status: "NORMAL" | "NEAR_ZERO" | "EXCEEDED";
  }>;
  consecutiveNearZeroCount: number;
  consecutiveExceededCount: number;
  isAtRisk: boolean;
  riskMessage?: string;
}

/**
 * Calculates the Impôt Forfaitaire Unique (IFU) owed based on collected turnover.
 * Rate: 0.5% (Law of Finance 2024 unified rate)
 * Minimum: 10,000 DZD even in zero-revenue years.
 */
export function calculateIfu(turnoverDzd: number): IfuCalculationResult {
  const rate = REGULATORY_CONFIG.ifu.rate;
  const rawTax = turnoverDzd * rate;
  const minimumTax = REGULATORY_CONFIG.ifu.minimumAnnualTaxDzd;
  const taxOwed = Math.max(rawTax, minimumTax);
  const isMinimumApplied = rawTax < minimumTax;

  return {
    turnoverDzd,
    rate,
    rawTaxDzd: Math.round(rawTax * 100) / 100,
    minimumTaxDzd: minimumTax,
    taxOwedDzd: Math.round(taxOwed * 100) / 100,
    isMinimumApplied,
  };
}

/**
 * Calculates current progress against the annual 5,000,000 DZD ceiling.
 */
export function calculateCeilingStatus(turnoverDzd: number): CeilingStatusResult {
  const limit = REGULATORY_CONFIG.turnoverCeiling.annualLimitDzd;
  const percentage = Math.round((turnoverDzd / limit) * 1000) / 10;
  const remaining = Math.max(0, limit - turnoverDzd);

  let status: CeilingStatusResult["status"] = "NORMAL";
  let statusLabel = "Conforme";
  let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";

  if (turnoverDzd > limit) {
    status = "EXCEEDED";
    statusLabel = "Plafond Dépassé";
    badgeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20";
  } else if (percentage >= REGULATORY_CONFIG.turnoverCeiling.warningThresholds.red * 100) {
    status = "CRITICAL";
    statusLabel = "Alerte Critique (≥95%)";
    badgeColor = "bg-red-500/10 text-red-600 border-red-500/20";
  } else if (percentage >= REGULATORY_CONFIG.turnoverCeiling.warningThresholds.yellow * 100) {
    status = "WARNING";
    statusLabel = "Attention (≥80%)";
    badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }

  return {
    currentTurnoverDzd: turnoverDzd,
    ceilingLimitDzd: limit,
    percentage,
    remainingDzd: remaining,
    status,
    statusLabel,
    badgeColor,
  };
}

/**
 * Analyzes the 3 consecutive years regulatory risk.
 * Law 22-23 stipulates that 3 consecutive years near-zero or over ceiling triggers removal or mandatory transition.
 */
export function evaluateThreeYearRule(
  currentYear: number,
  currentTurnoverDzd: number,
  pastRecords: Array<{ fiscalYear: number; turnoverDzd: number }>
): ConsecutiveYearsRuleResult {
  const allYearsMap = new Map<number, number>();
  pastRecords.forEach((r) => allYearsMap.set(r.fiscalYear, r.turnoverDzd));
  allYearsMap.set(currentYear, currentTurnoverDzd);

  const sortedYears = Array.from(allYearsMap.keys()).sort((a, b) => b - a); // descending

  const history = sortedYears.map((year) => {
    const to = allYearsMap.get(year) || 0;
    let st: "NORMAL" | "NEAR_ZERO" | "EXCEEDED" = "NORMAL";
    if (to > REGULATORY_CONFIG.turnoverCeiling.annualLimitDzd) {
      st = "EXCEEDED";
    } else if (to <= REGULATORY_CONFIG.turnoverCeiling.nearZeroThresholdDzd) {
      st = "NEAR_ZERO";
    }
    return {
      year,
      turnoverDzd: to,
      status: st,
    };
  });

  // Count consecutive years ending at the most recent year
  let consecutiveNearZero = 0;
  let consecutiveExceeded = 0;

  for (const item of history) {
    if (item.status === "NEAR_ZERO") {
      consecutiveNearZero++;
    } else {
      break;
    }
  }

  for (const item of history) {
    if (item.status === "EXCEEDED") {
      consecutiveExceeded++;
    } else {
      break;
    }
  }

  const isAtRisk =
    consecutiveNearZero >= REGULATORY_CONFIG.turnoverCeiling.consecutiveYearsLimit ||
    consecutiveExceeded >= REGULATORY_CONFIG.turnoverCeiling.consecutiveYearsLimit;

  let riskMessage: string | undefined;
  if (consecutiveNearZero >= REGULATORY_CONFIG.turnoverCeiling.consecutiveYearsLimit) {
    riskMessage =
      "Attention : 3 années consécutives avec un chiffre d'affaires nul ou quasi-nul peuvent entraîner la radiation du registre national de l'auto-entrepreneur (ANAE).";
  } else if (consecutiveExceeded >= REGULATORY_CONFIG.turnoverCeiling.consecutiveYearsLimit) {
    riskMessage =
      "Attention : 3 années consécutives au-dessus du plafond de 5 000 000 DZD obligent au passage sous statut de société (EURL/SARL).";
  }

  return {
    history,
    consecutiveNearZeroCount: consecutiveNearZero,
    consecutiveExceededCount: consecutiveExceeded,
    isAtRisk,
    riskMessage,
  };
}

/**
 * Format currency amount with Algerian standard thousand separators.
 * e.g., "1 250 000,00 DZD"
 */
export function formatDZD(amount: number): string {
  const parts = (amount || 0).toFixed(2).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${intPart},${parts[1]} DZD`;
}
