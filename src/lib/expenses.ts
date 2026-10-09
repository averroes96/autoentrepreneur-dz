import { db } from "@/lib/db";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import { calculateIfu } from "@/lib/tax";

export type ExpenseCategory =
  | "SOFTWARE_SUBSCRIPTIONS"
  | "HARDWARE_EQUIPMENT"
  | "OFFICE_COWORKING"
  | "TELECOM_INTERNET"
  | "LEGAL_ACCOUNTING"
  | "TRAVEL_TRANSPORT"
  | "MARKETING_ADVERTISING"
  | "TRAINING_CERTIFICATIONS"
  | "OTHER";

export interface ExpenseCategoryDef {
  key: ExpenseCategory;
  labelFr: string;
  labelAr: string;
  color: string;
  bgColor: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  {
    key: "SOFTWARE_SUBSCRIPTIONS",
    labelFr: "Logiciels, Cloud & Abonnements",
    labelAr: "البرمجيات، السحابة والاشتراكات",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
  {
    key: "HARDWARE_EQUIPMENT",
    labelFr: "Matériel informatique & Équipement",
    labelAr: "العتاد والأجهزة التقنية",
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-200",
  },
  {
    key: "OFFICE_COWORKING",
    labelFr: "Espace de travail & Coworking",
    labelAr: "مساحات العمل ومكاتب مشتركة",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
  {
    key: "TELECOM_INTERNET",
    labelFr: "Internet, Téléphone & Télécom",
    labelAr: "الإنترنت، الهاتف والاتصالات",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  {
    key: "LEGAL_ACCOUNTING",
    labelFr: "Frais Juridiques & Administratifs",
    labelAr: "الرسوم القانونية والإدارية",
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
  {
    key: "TRAVEL_TRANSPORT",
    labelFr: "Déplacements & Transports professionnels",
    labelAr: "التنقل والنقل المهني",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    key: "MARKETING_ADVERTISING",
    labelFr: "Marketing, Publicité & Domaines",
    labelAr: "التسويق، الإعلانات والنطاقات",
    color: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-200",
  },
  {
    key: "TRAINING_CERTIFICATIONS",
    labelFr: "Formations & Certifications",
    labelAr: "الدورات التكوينية والشهادات",
    color: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-200",
  },
  {
    key: "OTHER",
    labelFr: "Autres Dépenses opérationnelles",
    labelAr: "مصاريف ونفقات تشغيلية أخرى",
    color: "text-slate-600",
    bgColor: "bg-slate-50 border-slate-200",
  },
];

export interface ExpenseData {
  id: string;
  tenantId: string;
  title: string;
  amount: number;
  currency: string;
  date: Date;
  fiscalYear: number;
  category: ExpenseCategory;
  paymentMethod: string;
  supplier: string | null;
  invoiceNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  labelFr: string;
  labelAr: string;
  color: string;
  bgColor: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: number;
  monthNameFr: string;
  monthNameAr: string;
  turnoverDzd: number;
  expensesDzd: number;
  netProfitDzd: number;
}

export interface ExpensesSummary {
  fiscalYear: number;
  totalExpensesDzd: number;
  expenseCount: number;
  grossCollectedTurnoverDzd: number;
  totalRefundedDzd: number;
  netCollectedTurnoverDzd: number;
  estimatedIfuTaxDzd: number;
  casnosContributionDzd: number;
  realNetProfitDzd: number;
  netProfitMarginPercent: number;
  expenseRatioPercent: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrends: MonthlyTrend[];
  topCategory: CategoryBreakdown | null;
}

const MONTH_NAMES_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const MONTH_NAMES_AR = [
  "جانفي",
  "فيفري",
  "مارس",
  "أفريل",
  "ماي",
  "جوان",
  "جويلية",
  "أوت",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export async function getExpensesSummary(
  tenantId: string,
  fiscalYear: number
): Promise<ExpensesSummary> {
  const [expenses, paidInvoices, refundedCreditNotes, profile] = await Promise.all([
    db.expense.findMany({
      where: {
        tenantId,
        fiscalYear,
      },
      orderBy: { date: "desc" },
    }),
    db.invoice.findMany({
      where: {
        tenantId,
        fiscalYear,
        paymentStatus: "PAID",
      },
      select: {
        total: true,
        totalDzd: true,
        paidAt: true,
        createdAt: true,
      },
    }),
    db.creditNote.findMany({
      where: {
        tenantId,
        fiscalYear,
        status: "ISSUED",
        refundStatus: "REFUNDED",
      },
      select: {
        total: true,
        totalDzd: true,
        refundedAt: true,
        createdAt: true,
      },
    }),
    db.autoEntrepreneurProfile.findUnique({
      where: { tenantId },
      select: { casnosScheme: true },
    }),
  ]);

  const totalExpensesDzd = expenses.reduce((acc, exp) => acc + (exp.amountDzd && exp.amountDzd > 0 ? exp.amountDzd : (exp.amount ?? 0)), 0);
  const expenseCount = expenses.length;

  const grossCollectedTurnoverDzd = paidInvoices.reduce((acc, inv) => acc + (inv.totalDzd ?? inv.total ?? 0), 0);
  const totalRefundedDzd = refundedCreditNotes.reduce((acc, cn) => acc + (cn.totalDzd ?? cn.total ?? 0), 0);
  const netCollectedTurnoverDzd = Math.max(0, grossCollectedTurnoverDzd - totalRefundedDzd);

  // Calculate IFU Tax
  const ifuCalc = calculateIfu(netCollectedTurnoverDzd);
  const estimatedIfuTaxDzd = ifuCalc.taxOwedDzd;

  // CASNOS contribution
  const casnosContributionDzd =
    profile?.casnosScheme === "STANDARD_15"
      ? Math.max(36_000, Math.round(netCollectedTurnoverDzd * 0.15))
      : REGULATORY_CONFIG.casnos.defaultAnnualContributionDzd;

  // Real Net Profit
  const realNetProfitDzd =
    netCollectedTurnoverDzd - totalExpensesDzd - estimatedIfuTaxDzd - casnosContributionDzd;

  const netProfitMarginPercent =
    netCollectedTurnoverDzd > 0
      ? Math.round((realNetProfitDzd / netCollectedTurnoverDzd) * 1000) / 10
      : 0;

  const expenseRatioPercent =
    netCollectedTurnoverDzd > 0
      ? Math.round((totalExpensesDzd / netCollectedTurnoverDzd) * 1000) / 10
      : 0;

  // Category Breakdown
  const catMap = new Map<ExpenseCategory, { total: number; count: number }>();
  expenses.forEach((e) => {
    const cat = (e.category as ExpenseCategory) || "OTHER";
    const existing = catMap.get(cat) || { total: 0, count: 0 };
    catMap.set(cat, {
      total: existing.total + (e.amountDzd && e.amountDzd > 0 ? e.amountDzd : (e.amount || 0)),
      count: existing.count + 1,
    });
  });

  const categoryBreakdown: CategoryBreakdown[] = EXPENSE_CATEGORIES.map((catDef) => {
    const data = catMap.get(catDef.key) || { total: 0, count: 0 };
    const pct =
      totalExpensesDzd > 0 ? Math.round((data.total / totalExpensesDzd) * 1000) / 10 : 0;
    return {
      category: catDef.key,
      labelFr: catDef.labelFr,
      labelAr: catDef.labelAr,
      color: catDef.color,
      bgColor: catDef.bgColor,
      totalAmount: data.total,
      count: data.count,
      percentage: pct,
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  const topCategory = categoryBreakdown.length > 0 && categoryBreakdown[0].totalAmount > 0
    ? categoryBreakdown[0]
    : null;

  // Monthly trends (12 months)
  const monthlyTrends: MonthlyTrend[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    let mTurnover = 0;
    let mExpenses = 0;

    paidInvoices.forEach((inv) => {
      const d = inv.paidAt || inv.createdAt;
      if (new Date(d).getMonth() === i) {
        mTurnover += (inv.totalDzd ?? inv.total ?? 0);
      }
    });

    refundedCreditNotes.forEach((cn) => {
      const d = cn.refundedAt || cn.createdAt;
      if (new Date(d).getMonth() === i) {
        mTurnover -= (cn.totalDzd ?? cn.total ?? 0);
      }
    });

    expenses.forEach((exp) => {
      if (new Date(exp.date).getMonth() === i) {
        mExpenses += (exp.amountDzd && exp.amountDzd > 0 ? exp.amountDzd : (exp.amount ?? 0));
      }
    });

    const netTurnover = Math.max(0, mTurnover);
    const mIfu = Math.round(netTurnover * REGULATORY_CONFIG.ifu.rate);
    const mNetProfit = netTurnover - mExpenses - mIfu;

    return {
      month: m,
      monthNameFr: MONTH_NAMES_FR[i],
      monthNameAr: MONTH_NAMES_AR[i],
      turnoverDzd: netTurnover,
      expensesDzd: mExpenses,
      netProfitDzd: mNetProfit,
    };
  });

  return {
    fiscalYear,
    totalExpensesDzd,
    expenseCount,
    grossCollectedTurnoverDzd,
    totalRefundedDzd,
    netCollectedTurnoverDzd,
    estimatedIfuTaxDzd,
    casnosContributionDzd,
    realNetProfitDzd,
    netProfitMarginPercent,
    expenseRatioPercent,
    categoryBreakdown,
    monthlyTrends,
    topCategory,
  };
}

/**
 * Generate CSV export of expenses for personal accounting & archives
 */
export function generateExpensesCsv(
  expenses: Array<{
    date: Date | string;
    title: string;
    category: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    supplier: string | null;
    invoiceNumber: string | null;
    notes: string | null;
  }>,
  fiscalYear: number
): string {
  const headers = [
    "Date",
    "Titre de la dépense",
    "Catégorie",
    "Montant (DZD)",
    "Fournisseur",
    "N° Pièce / Facture",
    "Mode de paiement",
    "Notes",
  ];

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map((e) => {
    const d = new Date(e.date).toISOString().split("T")[0];
    const catDef = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
    const catLabel = catDef ? catDef.labelFr : e.category;
    return [
      escapeCsv(d),
      escapeCsv(e.title),
      escapeCsv(catLabel),
      escapeCsv(e.amount),
      escapeCsv(e.supplier || ""),
      escapeCsv(e.invoiceNumber || ""),
      escapeCsv(e.paymentMethod),
      escapeCsv(e.notes || ""),
    ].join(",");
  });

  const metaLines = [
    `REGISTRE DU SUIVI DES DÉPENSES & CHARGES (EXERCICE ${fiscalYear})`,
    `AVERTISSEMENT RÉGLEMENTAIRE (Loi 22-23) : Sous le régime de l'auto-entrepreneur en Algérie, l'impôt forfaitaire unique (IFU 0,5%) est assis sur le chiffre d'affaires brut encaissé. Ce registre de dépenses est tenu à des fins de gestion budgétaire personnelle et n'a aucune valeur de déductibilité fiscale.`,
    "",
  ];

  // Prepend UTF-8 BOM so Excel opens Algerian accents properly
  return "\uFEFF" + metaLines.join("\r\n") + [headers.join(","), ...rows].join("\r\n");
}
