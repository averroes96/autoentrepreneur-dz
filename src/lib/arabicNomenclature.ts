/**
 * Official Algerian JORADP Administrative Nomenclature & Legal Terminology in Arabic (العربية)
 * Conformité : Journal Officiel de la République Algérienne Démocratique et Populaire (JORADP)
 * Loi n° 22-23 du 18 décembre 2022 (Statut de l'Auto-Entrepreneur) & Décret exécutif n° 23-197.
 */

export interface ArabicInvoiceLabels {
  // Document Titles
  republicTitle: string;
  autoEntrepreneurRegime: string;
  invoiceTitle: string;
  quoteTitle: string;
  creditNoteTitle: string;
  draftBadge: string;
  issuedBadge: string;
  paidBadge: string;
  pendingPaymentBadge: string;
  cancelledBadge: string;
  refundedBadge: string;

  // Metadata
  invoiceNumberLabel: string;
  quoteNumberLabel: string;
  creditNoteNumberLabel: string;
  issueDateLabel: string;
  validUntilLabel: string;
  timestampLabel: string;
  linkedInvoiceLabel: string;

  // Parties
  sellerTitle: string;
  clientTitle: string;
  fullNameLabel: string;
  rnaeNumberLabel: string;
  nifLabel: string;
  nisLabel: string;
  rcLabel: string;
  activityCodeLabel: string;
  activityLabelLabel: string;
  addressLabel: string;
  phoneLabel: string;
  emailLabel: string;
  clientTypeLabel: string;
  clientTypeProfessional: string;
  clientTypeIndividual: string;

  // Table
  descriptionHeader: string;
  quantityHeader: string;
  unitPriceHeader: string;
  totalHeader: string;

  // Totals & Taxes
  totalServicesLabel: string;
  vatRateLabel: string;
  vatExemptValue: string;
  netPayableLabel: string;
  amountInWordsPrefix: string;
  amountInWordsSuffix: string;
  currencySymbol: string;

  // Legal Mentions
  vatExemptionClause: string;
  notesTitle: string;
  legalFooterClause: string;
}

export const ARABIC_NOMENCLATURE: ArabicInvoiceLabels = {
  // Titles
  republicTitle: "الجمهورية الجزائرية الديمقراطية الشعبية",
  autoEntrepreneurRegime: "نظام المقاول الذاتي (القانون رقم 22-23 المؤرخ في 18 ديسمبر 2022)",
  invoiceTitle: "فـــاتـــورة",
  quoteTitle: "كشف تقديري / عرض أسعار",
  creditNoteTitle: "فاتورة دائنة (سند إنقاص)",
  draftBadge: "مسودة",
  issuedBadge: "صادرة (نهائية)",
  paidBadge: "مدفوعة ومستخلصة",
  pendingPaymentBadge: "في انتظار الدفع",
  cancelledBadge: "ملغاة",
  refundedBadge: "تم تعويضها (مقتطعة من ر.أ)",

  // Metadata
  invoiceNumberLabel: "رقم الفاتورة",
  quoteNumberLabel: "رقم الكشف التقديري",
  creditNoteNumberLabel: "رقم الفاتورة الدائنة",
  issueDateLabel: "تاريخ الإصدار",
  validUntilLabel: "تاريخ الصلاحية",
  timestampLabel: "التوقيت الرسمي للتسجيل",
  linkedInvoiceLabel: "الفاتورة الأصلية المرجعية",

  // Parties
  sellerTitle: "المورد (المقاول الذاتي)",
  clientTitle: "العميل (المفوتر له)",
  fullNameLabel: "الاسم واللقب",
  rnaeNumberLabel: "رقم السجل الوطني للمقاول الذاتي (RNAE)",
  nifLabel: "رقم التعريف الجبائي (NIF)",
  nisLabel: "رقم التعريف الإحصائي (NIS)",
  rcLabel: "رقم السجل التجاري (RC)",
  activityCodeLabel: "رمز النشاط المعتمد",
  activityLabelLabel: "بيان النشاط المهني",
  addressLabel: "العنوان المهني",
  phoneLabel: "الهاتف",
  emailLabel: "البريد الإلكتروني",
  clientTypeLabel: "الصفة القانونية للعميل",
  clientTypeProfessional: "مهني / شخص معنوي (شركة)",
  clientTypeIndividual: "شخص طبيعي (خاص)",

  // Table
  descriptionHeader: "بيان الخدمات والمهام المنجزة",
  quantityHeader: "الكمية",
  unitPriceHeader: "السعر الوحدوي",
  totalHeader: "المجموع الإجمالي",

  // Totals & Taxes
  totalServicesLabel: "مجموع مبالغ الخدمات :",
  vatRateLabel: "نسبة الرسم على القيمة المضافة (TVA) :",
  vatExemptValue: "0% (معفى قانوناً)",
  netPayableLabel: "المبلغ الصافي الإجمالي المستحق للدفع :",
  amountInWordsPrefix: "أُوقفت هذه الفاتورة عند المبلغ الصافي الإجمالي وقدره :",
  amountInWordsSuffix: "دينار جزائري لا غير.",
  currencySymbol: "د.ج",

  // Legal Mentions
  vatExemptionClause:
    "معفى من الرسم على القيمة المضافة (TVA) عملاً بأحكام المادة 13 من القانون رقم 22-23 المؤرخ في 18 ديسمبر 2022 المتضمن القانون الأساسي للمقاول الذاتي وأحكام قانون الضرائب المباشرة والرسوم المماثلة (نظام الضريبة الجزافية الوحيدة IFU بنسبة 0.5%).",
  notesTitle: "شروط وطرق التسوية وملاحظات :",
  legalFooterClause:
    "حُررت هذه الوثيقة وفقاً لأحكام التشريع الجزائري الساري المفعول المنظم لنشاط المقاول الذاتي (القانون رقم 22-23). صاحب الفاتورة مقيد قانوناً في السجل الوطني للمقاول الذاتي التابع للوكالة الوطنية للمقاول الذاتي (ANAE).",
};

/**
 * Formatage d'un montant monétaire en dinars algériens en langue arabe.
 * Utilise les marques d'isolation bidirectionnelle (LRI \u2066 et PDI \u2069)
 * ainsi qu'un espace insécable (\u00A0 de classe CS) afin d'empêcher
 * l'algorithme BiDi d'inverser les groupes de milliers (ex: 670 000 et non 000 670).
 */
export function formatDZD_AR(amount: number): string {
  const isNegative = (amount || 0) < 0;
  const absAmount = Math.abs(amount || 0);
  const parts = Math.round(absAmount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  const prefix = isNegative ? "-" : "";
  return `\u2066${prefix}${parts}\u2069\u00A0د.ج`;
}

/**
 * Formatage d'une date en arabe algérien.
 */
export function formatArabicDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const arabicMonths = [
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
  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Tafqeet Algorithm (التفقيط) : Transcription d'un montant numérique en toutes lettres arabes
 * Indispensable pour la conformité administrative algérienne des factures et marchés.
 */
export function tafqeetNumberToArabicWords(amount: number): string {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return "صفر";

  const ones = [
    "",
    "واحد",
    "اثنان",
    "ثلاثة",
    "أربعة",
    "خمسة",
    "ستة",
    "سبعة",
    "ثمانية",
    "تسعة",
    "عشرة",
    "أحد عشر",
    "اثنا عشر",
    "ثلاثة عشر",
    "أربعة عشر",
    "خمسة عشر",
    "ستة عشر",
    "سبعة عشر",
    "ثمانية عشر",
    "تسعة عشر",
  ];

  const tens = [
    "",
    "",
    "عشرون",
    "ثلاثون",
    "أربعون",
    "خمسون",
    "ستون",
    "سبعون",
    "ثمانون",
    "تسعون",
  ];

  const hundreds = [
    "",
    "مائة",
    "مائتان",
    "ثلاثمائة",
    "أربعمائة",
    "خمسمائة",
    "ستمائة",
    "سبعمائة",
    "ثمانمائة",
    "تسعمائة",
  ];

  function convertGroup(n: number): string {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;

    if (h > 0) {
      parts.push(hundreds[h]);
    }

    if (rem > 0) {
      if (rem < 20) {
        parts.push(ones[rem]);
      } else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o > 0) {
          parts.push(`${ones[o]} و${tens[t]}`);
        } else {
          parts.push(tens[t]);
        }
      }
    }

    return parts.join(" و");
  }

  const billions = Math.floor(rounded / 1_000_000_000);
  const millions = Math.floor((rounded % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1_000);
  const remainder = rounded % 1_000;

  const resultParts: string[] = [];

  if (billions > 0) {
    if (billions === 1) resultParts.push("مليار");
    else if (billions === 2) resultParts.push("ملياران");
    else if (billions >= 3 && billions <= 10) resultParts.push(`${convertGroup(billions)} مليارات`);
    else resultParts.push(`${convertGroup(billions)} مليار`);
  }

  if (millions > 0) {
    if (millions === 1) resultParts.push("مليون");
    else if (millions === 2) resultParts.push("مليونان");
    else if (millions >= 3 && millions <= 10) resultParts.push(`${convertGroup(millions)} ملايين`);
    else resultParts.push(`${convertGroup(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) resultParts.push("ألف");
    else if (thousands === 2) resultParts.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) resultParts.push(`${convertGroup(thousands)} آلاف`);
    else resultParts.push(`${convertGroup(thousands)} ألف`);
  }

  if (remainder > 0) {
    resultParts.push(convertGroup(remainder));
  }

  return resultParts.join(" و");
}

/**
 * Transcription complète du montant en lettres pour la mention légale d'arrêt de facture.
 */
export function getArabicAmountInWords(amount: number): string {
  const words = tafqeetNumberToArabicWords(amount);
  return `${ARABIC_NOMENCLATURE.amountInWordsPrefix} ${words} ${ARABIC_NOMENCLATURE.amountInWordsSuffix}`;
}
