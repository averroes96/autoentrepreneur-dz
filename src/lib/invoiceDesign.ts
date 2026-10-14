/**
 * Invoice & Document Visual Identity & Styling Engine
 * Phase 4 - Module 1: Brand Colors, Logo Settings, and Layout Templates
 */

export type BrandColorKey = "EMERALD" | "NAVY" | "BURGUNDY" | "SLATE" | "AMBER";
export type TemplateStyleKey = "MODERN" | "CLASSIC" | "MINIMALIST" | "COMPACT";
export type LogoPositionKey = "LEFT" | "CENTER" | "RIGHT";

export interface BrandPalette {
  key: BrandColorKey;
  labelEn: string;
  labelFr: string;
  labelAr: string;
  hex: string;
  darkHex: string;
  lightBgHex: string;
  borderHex: string;
  tw: {
    bg: string;
    bgHover: string;
    text: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    ring: string;
    headerGradient: string;
  };
}

export const BRAND_PALETTES: Record<BrandColorKey, BrandPalette> = {
  EMERALD: {
    key: "EMERALD",
    labelEn: "Sovereign Emerald",
    labelFr: "Vert Émeraude Souverain",
    labelAr: "الزمرد السيادي",
    hex: "#059669",
    darkHex: "#047857",
    lightBgHex: "#f0fdf4",
    borderHex: "#bbf7d0",
    tw: {
      bg: "bg-emerald-600",
      bgHover: "hover:bg-emerald-700",
      text: "text-emerald-700",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-800",
      ring: "focus:ring-emerald-500",
      headerGradient: "from-emerald-600 to-teal-700",
    },
  },
  NAVY: {
    key: "NAVY",
    labelEn: "Royal Navy Blue",
    labelFr: "Bleu Nuit Royal",
    labelAr: "الأزرق الملكي",
    hex: "#1d4ed8",
    darkHex: "#1e3a8a",
    lightBgHex: "#eff6ff",
    borderHex: "#bfdbfe",
    tw: {
      bg: "bg-blue-700",
      bgHover: "hover:bg-blue-800",
      text: "text-blue-700",
      border: "border-blue-200",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800",
      ring: "focus:ring-blue-500",
      headerGradient: "from-blue-700 to-indigo-900",
    },
  },
  BURGUNDY: {
    key: "BURGUNDY",
    labelEn: "Administrative Burgundy",
    labelFr: "Bordeaux Administratif",
    labelAr: "العنابي الإداري",
    hex: "#991b1b",
    darkHex: "#7f1d1d",
    lightBgHex: "#fef2f2",
    borderHex: "#fecaca",
    tw: {
      bg: "bg-red-800",
      bgHover: "hover:bg-red-900",
      text: "text-red-800",
      border: "border-red-200",
      badgeBg: "bg-red-50",
      badgeText: "text-red-900",
      ring: "focus:ring-red-500",
      headerGradient: "from-red-800 to-rose-950",
    },
  },
  SLATE: {
    key: "SLATE",
    labelEn: "Modern Graphite Slate",
    labelFr: "Anthracite Graphique",
    labelAr: "الرمادي الحديث",
    hex: "#334155",
    darkHex: "#0f172a",
    lightBgHex: "#f8fafc",
    borderHex: "#cbd5e1",
    tw: {
      bg: "bg-slate-800",
      bgHover: "hover:bg-slate-900",
      text: "text-slate-800",
      border: "border-slate-300",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-900",
      ring: "focus:ring-slate-500",
      headerGradient: "from-slate-800 to-slate-950",
    },
  },
  AMBER: {
    key: "AMBER",
    labelEn: "Warm Gold & Amber",
    labelFr: "Or & Ambre Chaleureux",
    labelAr: "الذهبي الدافئ",
    hex: "#d97706",
    darkHex: "#b45309",
    lightBgHex: "#fffbeb",
    borderHex: "#fde68a",
    tw: {
      bg: "bg-amber-600",
      bgHover: "hover:bg-amber-700",
      text: "text-amber-800",
      border: "border-amber-200",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-900",
      ring: "focus:ring-amber-500",
      headerGradient: "from-amber-600 to-orange-800",
    },
  },
};

export interface TemplateStyleDef {
  key: TemplateStyleKey;
  labelEn: string;
  labelFr: string;
  labelAr: string;
  descEn: string;
  descFr: string;
  descAr: string;
  badge: string;
}

export const TEMPLATE_STYLES: Record<TemplateStyleKey, TemplateStyleDef> = {
  MODERN: {
    key: "MODERN",
    labelEn: "Modern Studio",
    labelFr: "Studio Contemporain",
    labelAr: "النمط الحديث المعاصر",
    descEn: "Soft cards, colored accent header banner, rounded badges.",
    descFr: "Cartes douces, en-tête épuré avec bandeau de couleur, badges arrondis.",
    descAr: "بطاقات ناعمة، ترويسة أنيقة بشريط لوني، وإشارات دائرية حديثة.",
    badge: "Recommended",
  },
  CLASSIC: {
    key: "CLASSIC",
    labelEn: "Classic Administrative",
    labelFr: "Classique Administratif",
    labelAr: "النمط الإداري الكلاسيكي",
    descEn: "Formal structured borders, proven Algerian commercial transaction layout.",
    descFr: "Cadres formels, bordures nettes, disposition commerciale algérienne éprouvée.",
    descAr: "إطارات رسمية محددة، مظهر تجاري رسمي معتمد لدى الشركات الجزائرية.",
    badge: "Standard",
  },
  MINIMALIST: {
    key: "MINIMALIST",
    labelEn: "Minimalist Eco-Ink",
    labelFr: "Minimaliste Éco-Encre",
    labelAr: "النمط البسيط الموفر للحبر",
    descEn: "Thin crisp strokes, no heavy solid backgrounds, ideal for fast monochrome print.",
    descFr: "Lignes fines sans aplats denses, idéal pour impression noir & blanc rapide.",
    descAr: "خطوط رفيعة بدون مساحات حبر كثيفة، مثالي للطباعة الورقية بالأبيض والأسود.",
    badge: "Eco-Friendly",
  },
  COMPACT: {
    key: "COMPACT",
    labelEn: "Compact Multi-Row",
    labelFr: "Compact & Détaillé",
    labelAr: "النمط المضغوط للمهام المتعددة",
    descEn: "Condensed row padding, optimized for lengthy itemized proformas and invoices.",
    descFr: "Marges condensées, tableau optimisé pour les devis et factures volumineux.",
    descAr: "هوامش مدمجة وجداول محسنة للفواتير وكشوف التقدير كثيرة البنود.",
    badge: "Dense Items",
  },
};

export function getBrandPalette(color?: string | null): BrandPalette {
  if (!color) return BRAND_PALETTES.EMERALD;
  const upper = color.toUpperCase() as BrandColorKey;
  return BRAND_PALETTES[upper] || BRAND_PALETTES.EMERALD;
}

export function getTemplateStyle(style?: string | null): TemplateStyleDef {
  if (!style) return TEMPLATE_STYLES.MODERN;
  const upper = style.toUpperCase() as TemplateStyleKey;
  return TEMPLATE_STYLES[upper] || TEMPLATE_STYLES.MODERN;
}

export interface SellerIdentityProfile {
  fullName?: string | null;
  rnaeNumber?: string | null;
  nif?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  activityCode?: string | null;
  activityLabel?: string | null;
  logoUrl?: string | null;
  logoPosition?: string | null;
  brandColor?: string | null;
  templateStyle?: string | null;
  bankName?: string | null;
  bankRib?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
  accountHolder?: string | null;
  bankAgency?: string | null;
  ccpNumber?: string | null;
  ccpKey?: string | null;
  paymentTerms?: string | null;
  paymentInstructions?: string | null;
  showStampSignature?: boolean | null;
  stampType?: string | null;
  stampUrl?: string | null;
  signatureUrl?: string | null;
}

/**
 * Resolves seller data for rendering invoices, quotes, credit notes, and receipts:
 * - Legal identity (fullName, rnaeNumber, nif, address, email, activity) is preserved from the snapshot (regulatory compliance), falling back to profile.
 * - Banking coordinates are taken from snapshot if present, falling back to profile.
 * - Document visual presentation (brandColor, templateStyle, logoUrl, logoPosition, showStampSignature, stampType, stampUrl, signatureUrl) reflects the active profile template so documents match the user's customized design settings.
 */
export function resolveDocumentSeller(
  profile: SellerIdentityProfile,
  snapshotRaw?: string | null | Record<string, any>
): SellerIdentityProfile {
  let snapshot: Record<string, any> = {};
  if (typeof snapshotRaw === "string" && snapshotRaw.trim()) {
    try {
      snapshot = JSON.parse(snapshotRaw);
    } catch {
      snapshot = {};
    }
  } else if (snapshotRaw && typeof snapshotRaw === "object") {
    snapshot = snapshotRaw;
  }

  return {
    // Statutory identity (immutable snapshot with profile fallback)
    fullName: snapshot.fullName || profile.fullName || "Auto-Entrepreneur",
    rnaeNumber: snapshot.rnaeNumber || profile.rnaeNumber || "",
    nif: snapshot.nif || profile.nif || "",
    address: snapshot.address || profile.address || "",
    email: snapshot.email || profile.email || "",
    phone: snapshot.phone || profile.phone || "",
    activityCode: snapshot.activityCode || profile.activityCode || "",
    activityLabel: snapshot.activityLabel || profile.activityLabel || "",

    // Banking coordinates (snapshot with profile fallback)
    bankName: snapshot.bankName || profile.bankName || null,
    bankRib: snapshot.bankRib || profile.bankRib || null,
    bankIban: snapshot.bankIban || profile.bankIban || null,
    bankBic: snapshot.bankBic || profile.bankBic || null,
    accountHolder: snapshot.accountHolder || profile.accountHolder || profile.fullName || null,
    bankAgency: snapshot.bankAgency || profile.bankAgency || null,
    ccpNumber: snapshot.ccpNumber || profile.ccpNumber || null,
    ccpKey: snapshot.ccpKey || profile.ccpKey || null,
    paymentTerms: snapshot.paymentTerms || profile.paymentTerms || "UPON_RECEIPT",
    paymentInstructions: snapshot.paymentInstructions || profile.paymentInstructions || null,

    // Document visual presentation & template styling:
    // Active profile settings take precedence so documents match the configured template.
    brandColor: profile.brandColor || snapshot.brandColor || "EMERALD",
    templateStyle: profile.templateStyle || snapshot.templateStyle || "MODERN",
    logoUrl: profile.logoUrl !== undefined ? profile.logoUrl : snapshot.logoUrl,
    logoPosition: profile.logoPosition || snapshot.logoPosition || "LEFT",
    showStampSignature: profile.showStampSignature !== undefined ? profile.showStampSignature : (snapshot.showStampSignature ?? true),
    stampType: profile.stampType || snapshot.stampType || "AUTO",
    stampUrl: profile.stampUrl !== undefined ? profile.stampUrl : snapshot.stampUrl,
    signatureUrl: profile.signatureUrl !== undefined ? profile.signatureUrl : snapshot.signatureUrl,
  };
}
