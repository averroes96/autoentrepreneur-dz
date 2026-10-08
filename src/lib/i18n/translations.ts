/**
 * Moukawil.dz - Complete Algerian Administrative UI Translations (FR / AR)
 * Conformité : Journal Officiel de la République Algérienne (JORADP)
 * Loi n° 22-23 du 18 décembre 2022 (Statut de l'Auto-Entrepreneur) & Décret exécutif n° 23-197.
 */

export type Locale = "fr" | "ar";

export const translations = {
  fr: {
    // Brand & Shell
    brandSub: "Auto-Entrepreneur",
    dashboard: "Tableau de bord",
    invoicing: "Facturation",
    invoices: "Factures",
    invoicesDesc: "Factures de vente & encaissements",
    quotes: "Devis & Proformas",
    quotesDesc: "Propositions & devis clients",
    creditNotes: "Factures d'Avoir",
    creditNotesDesc: "Notes de crédit & rectifications",
    taxSummary: "Bordereau Fiscal (IFU)",
    taxSummaryDesc: "Déclaration G12 bis & Échéances",
    billingCycleTitle: "Cycle de facturation (Loi 22-23)",
    clients: "Clients",
    profile: "Profil & Conformité",
    logout: "Déconnexion",
    home: "Accueil",

    // Dashboard Header & Quick Actions
    fiscalYear: "Exercice Fiscal {year}",
    rnaeNumberLabel: "N° RNAE : {number}",
    toFill: "À renseigner",
    greeting: "Bonjour, {name}",
    dashboardSubtitle:
      "Suivi de votre chiffre d'affaires et conformité fiscale auto-entrepreneur (Loi 22-23).",
    createInvoice: "Créer une facture",
    newQuote: "Nouveau devis",
    creditNotesBtn: "Avoirs",
    taxSummaryBtn: "Bordereau IFU",
    clientsBtn: "Clients",

    // Profile Completion Banner
    profileConfig: "Configuration du profil",
    profileCompletedPercent: "{percent}% complété",
    completeInfoTitle: "Complétez vos informations réglementaires",
    completeInfoDesc:
      "Renseignez votre code d'activité ANAE, le libellé de votre métier et votre adresse pour que vos factures comportent l'ensemble des mentions légales obligatoires (Loi 22-23).",
    toProvide: "À renseigner :",
    finalizeProfile: "Finaliser mon profil",

    // Metric Card 1: Collected Turnover & Ceiling
    collectedTurnoverTitle: "Chiffre d'Affaires Encaissé",
    annualCeilingLimit: "Plafond légal annuel : {amount}",
    ceilingProgress: "Progression du plafond",
    remainingAvailable: "Reste disponible : {amount}",
    statusCompliant: "Conforme",
    statusWarning: "Alerte 80%",
    statusCritical: "Critique 95%",
    statusExceeded: "Dépassement",

    // Metric Card 2: IFU Tax Estimate
    ifuEstimateTitle: "Estimation IFU (0.5%)",
    liberatoryRate: "Taux libératoire",
    calculatedAtRate: "Calculé à 0.5% du CA encaissé",
    rawCalculatedAmount: "Montant brut calculé :",
    annualLegalMinimum: "Minimum légal annuel :",
    minimumAppliedNotice: "Le plancher légal de {amount} s'applique pour cette année.",
    deadlineLabel: "Échéance :",
    ifuDeadlineDate: "{day} Janvier {year}",
    g12bisLink: "Bordereau G12 bis",

    // Metric Card 3: Billing Activity & CASNOS
    billingActivityTitle: "Activité de Facturation {year}",
    totalBilledIssued: "Total Facturé (Émis)",
    pendingPayment: "En attente d'encaissement",
    invoicesCountLabel: "Nombre de factures",
    invoicesBreakdown: "{issued} émises / {draft} brouillons",
    casnosFlatRateLabel: "CASNOS Forfaitaire :",
    perYearSuffix: "/an",

    // Statutory Deadlines Widget
    statutoryCalendarTitle: "Calendrier des Obligations Statutaires & Échéances Légales",
    statutoryCalendarSubtitle:
      "Comptes à rebours officiels pour l'administration fiscale (DGI / IFU) et la sécurité sociale (CASNOS)",
    jibayaticPortal: "Portail Jibayatic",
    catFiscal: "Fiscalité (DGI)",
    catSocial: "Sécurité Sociale",
    catAnae: "Statut ANAE",
    legalDeadlineLimit: "Date limite légale :",
    organismLabel: "Organisme :",
    daysRemainingSuffix: "j restants",
    todayBadge: "Aujourd'hui !",
    overdueBadge: "Échu",

    // 3-Year Consecutive Rule Card
    threeYearTitle: "Règle Réglementaire des 3 Années Consécutives (Loi 22-23)",
    threeYearDesc:
      "Selon l'article 2.1 du statut, déclarer un chiffre d'affaires nul/quasi-nul, ou dépasser le plafond de 5 000 000 DZD pendant 3 années consécutives entraîne la radiation de l'ANAE ou le passage forcé en société (EURL/SARL).",
    manageHistory: "Gérer l'historique →",
    normalRegulatoryStatus:
      "Situation réglementaire normale : Aucun risque de radiation ou de dépassement consécutif détecté.",
    statusNearZero: "Quasi-nul",

    // Recent Invoices Table
    recentInvoicesTitle: "Factures Récentes",
    recentInvoicesSubtitle: "Dernières factures émises et brouillons en cours",
    viewAllInvoices: "Voir toutes les factures",
    noInvoicesTitle: "Aucune facture émise pour le moment",
    noInvoicesSubtitle: "Créez votre première facture conforme au régime de l'auto-entrepreneur.",
    colNumber: "Numéro",
    colClient: "Client",
    colDate: "Date",
    colTotal: "Montant Total",
    colInvoiceStatus: "Statut Facture",
    colPayment: "Paiement",
    colAction: "Action",
    draftLabel: "Brouillon",
    issuedImmutableLabel: "Émise (Immuable)",
    cancelledLabel: "Annulée",
    paidLabel: "Payée",
    pendingLabel: "En attente",
    detailsAction: "Détails →",

    // Invoicing Tabs
    tabInvoices: "Factures",
    tabQuotes: "Devis & Proformas",
    tabCreditNotes: "Factures d'Avoir",
    tabTaxSummary: "Bordereau Fiscal (IFU)",

    // List Filters & Common Search
    searchInvoicesPlaceholder: "Rechercher par N° de facture, nom du client...",
    filterAll: "Toutes",
    filterDrafts: "Brouillons",
    filterIssued: "Émises",
    filterPaid: "Payées (Encaissées)",
    filterPending: "En attente",
    filterCancelled: "Annulées",
    noInvoicesFound: "Aucune facture trouvée",

    // Quotes List Page
    quotesTitle: "Devis & Proformas",
    quotesSubtitle: "Propositions commerciales sans TVA • Conversion en facture officielle en un clic",
    newQuoteBtn: "Nouveau Devis",
    totalQuotesStat: "Total Devis Établis",
    acceptedQuotesStat: "Devis Validés / Acceptés",
    pendingQuotesStat: "En attente de réponse",
    conversionRateStat: "Taux de Conversion Facture",
    allExercises: "Tous exercices confondus",
    proposalsAccepted: "{count} propositions acceptées",
    draftOrSent: "Brouillons ou envoyés aux clients",
    convertedCountText: "{count} devis transformés en factures",
    filterSent: "Envoyés",
    filterAccepted: "Acceptés",
    filterConverted: "Convertis",
    filterRejected: "Refusés",
    searchQuotesPlaceholder: "Rechercher par N° ou client...",
    noQuotesFound: "Aucun devis trouvé",
    startCreateQuote: "Commencez par créer votre première proposition commerciale pour un client.",
    colQuoteNumber: "N° Devis",
    colValidity: "Date & Validité",
    colEstimatedAmount: "Montant Estimé",
    societyClient: "Société",
    individualClient: "Particulier",
    expiredOn: "Expiré le ",
    validUntil: "Valide jusqu'au ",
    statusSent: "Envoyé",
    statusAccepted: "Accepté",
    statusConverted: "Facturé",
    statusRejected: "Refusé",
    viewGeneratedInvoice: "Facture",
    downloadPdf: "Télécharger PDF",

    // Credit Notes List Page
    creditNotesTitle: "Factures d'Avoir (Notes de Crédit)",
    creditNotesSubtitle:
      "Rectification comptable officielle • Déduction du chiffre d'affaires et de l'IFU",
    totalCreditNotesStat: "Total Avoirs Émis",
    refundedCreditNotesStat: "Avoirs Remboursés / Déduits",
    pendingRefundStat: "En attente de remboursement",
    deductedFromTurnover: "Déduit du chiffre d'affaires imposable",
    searchCreditNotesPlaceholder: "Rechercher par N° d'avoir, facture liée ou client...",
    filterRefunded: "Remboursés (Déduits)",
    colCreditNoteNumber: "N° Avoir",
    colLinkedInvoice: "Facture Associée",
    colReason: "Motif",
    colCreditedAmount: "Montant Crédité",
    colRefundStatus: "Remboursement",
    statusRefunded: "Remboursé (Déduit)",
    statusPendingRefund: "En attente",

    // Tax Summary Page
    taxSummaryTitle: "Échéances Statutaires & Bordereau Fiscal IFU",
    taxSummarySubtitle:
      "Préparez sereinement votre déclaration annuelle (Série G n° 12 bis) pour l'Inspection des Impôts ou Jibayatic.",
    fiscalComplianceBadge: "Conformité Fiscale DGI & CASNOS",
    fiscalDecree: "Décret 23-197 & Loi 22-23",
    fiscalExerciseLabel: "Exercice :",
    printReport: "Imprimer le Bordereau",
    exportCsv: "Exporter en CSV",
  },

  ar: {
    // Brand & Shell
    brandSub: "المقاول الذاتي",
    dashboard: "لوحة القيادة",
    invoicing: "الفوترة",
    invoices: "الفواتير",
    invoicesDesc: "فواتير المبيعات والمداخيل المحصلة",
    quotes: "عروض الأسعار والتقديرات",
    quotesDesc: "كشوف التقدير والعروض التجارية للعملاء",
    creditNotes: "الفواتير الدائنة (سندات الإنقاص)",
    creditNotesDesc: "إشعارات الدائن وتصحيحات الفواتير",
    taxSummary: "الكشف الجبائي (IFU)",
    taxSummaryDesc: "التصريح السنوي G12 مكرر والآجال القانونية",
    billingCycleTitle: "دورة الفوترة القانونية (القانون 22-23)",
    clients: "الزبائن",
    profile: "الملف والامتثال القانوني",
    logout: "تسجيل الخروج",
    home: "الرئيسية",

    // Dashboard Header & Quick Actions
    fiscalYear: "السنة المالية {year}",
    rnaeNumberLabel: "رقم السجل الوطني : {number}",
    toFill: "يجب ملؤه",
    greeting: "مرحبًا، {name}",
    dashboardSubtitle:
      "متابعة رقم الأعمال السنوي والامتثال الجبائي لنظام المقاول الذاتي (القانون رقم 22-23).",
    createInvoice: "إنشاء فاتورة",
    newQuote: "عرض سعر جديد",
    creditNotesBtn: "فواتير دائنة",
    taxSummaryBtn: "الكشف الجبائي IFU",
    clientsBtn: "الزبائن",

    // Profile Completion Banner
    profileConfig: "إعداد الملف القانوني",
    profileCompletedPercent: "{percent}% مكتمل",
    completeInfoTitle: "أكمل بياناتك الإدارية والقانونية الإلزامية",
    completeInfoDesc:
      "أدخل رمز نشاط الوكالة الوطنية (ANAE) والبيان المهني والعنوان لتتضمن وثائقك كافة البيانات الإلزامية وفقًا للقانون 22-23.",
    toProvide: "بيانات مطلوبة :",
    finalizeProfile: "استكمال الملف الشخصي",

    // Metric Card 1: Collected Turnover & Ceiling
    collectedTurnoverTitle: "رقم الأعمال المحصل (المستخلص)",
    annualCeilingLimit: "الحد الأقصى القانوني السنوي : {amount}",
    ceilingProgress: "نسبة استهلاك السقف القانوني",
    remainingAvailable: "المبلغ المتبقي المتاح : {amount}",
    statusCompliant: "مطابق قانوناً",
    statusWarning: "تنبيه (80%)",
    statusCritical: "حرج (95%)",
    statusExceeded: "تجاوز السقف",

    // Metric Card 2: IFU Tax Estimate
    ifuEstimateTitle: "تقدير الضريبة الجزافية الوحيدة (0.5%)",
    liberatoryRate: "معدل تحريري إبراءي",
    calculatedAtRate: "محسوبة بنسبة 0.5% من رقم الأعمال المحصل",
    rawCalculatedAmount: "المبلغ الإجمالي المحسوب :",
    annualLegalMinimum: "الحد الأدنى القانوني السنوي :",
    minimumAppliedNotice: "يطبق الحد الأدنى القانوني البالغ {amount} لهذه السنة.",
    deadlineLabel: "آخر أجل قانوني :",
    ifuDeadlineDate: "{day} جانفي {year}",
    g12bisLink: "جدول الإشعار G12 مكرر",

    // Metric Card 3: Billing Activity & CASNOS
    billingActivityTitle: "نشاط الفوترة لسنة {year}",
    totalBilledIssued: "إجمالي المفوتر (الصادر)",
    pendingPayment: "في انتظار التحصيل والدفع",
    invoicesCountLabel: "عدد الفواتير",
    invoicesBreakdown: "{issued} صادرة / {draft} مسودات",
    casnosFlatRateLabel: "اشتراك الضمان الاجتماعي الجزافي :",
    perYearSuffix: "/سنويًا",

    // Statutory Deadlines Widget
    statutoryCalendarTitle: "رزنامة الالتزامات والآجال القانونية الرسمية",
    statutoryCalendarSubtitle:
      "العد التنازلي الرسمي لمصالح الضرائب (DGI / IFU) وصندوق الضمان الاجتماعي لغير الأجراء (CASNOS)",
    jibayaticPortal: "بوابة جبايتك",
    catFiscal: "الضرائب (DGI)",
    catSocial: "الضمان الاجتماعي (CASNOS)",
    catAnae: "وكالة المقاول الذاتي (ANAE)",
    legalDeadlineLimit: "آخر أجل قانوني ملزم :",
    organismLabel: "الهيئة المستلمة :",
    daysRemainingSuffix: "يوم متبقي",
    todayBadge: "اليوم الأخير !",
    overdueBadge: "فات الأجل",

    // 3-Year Consecutive Rule Card
    threeYearTitle: "القاعدة التنظيمية لـ 3 سنوات متتالية (القانون 22-23)",
    threeYearDesc:
      "وفقًا للمادة 2.1 من القانون الأساسي، فإن التصريح برقم أعمال منعدم أو شبه منعدم، أو تجاوز سقف 5 000 000 دج لمدة 3 سنوات متتالية يؤدي إلى الشطب التلقائي من السجل الوطني أو التحول الإجباري إلى شركة تجارية.",
    manageHistory: "إدارة السجل التاريخي ←",
    normalRegulatoryStatus:
      "الوضعية القانونية سليمة: لا يوجد أي خطر للشطب أو تجاوز السقف المتتالي.",
    statusNearZero: "شبه منعدم",

    // Recent Invoices Table
    recentInvoicesTitle: "أحدث الفواتير",
    recentInvoicesSubtitle: "آخر الفواتير الصادرة والمسودات قيد المعالجة",
    viewAllInvoices: "عرض كافة الفواتير",
    noInvoicesTitle: "لا توجد أي فواتير صادرة حتى الآن",
    noInvoicesSubtitle: "أنشئ أول فاتورة تجارية متوافقة مع نظام المقاول الذاتي.",
    colNumber: "رقم الفاتورة",
    colClient: "الزبون",
    colDate: "التاريخ",
    colTotal: "المبلغ الإجمالي",
    colInvoiceStatus: "حالة الفاتورة",
    colPayment: "حالة الدفع",
    colAction: "الإجراء",
    draftLabel: "مسودة",
    issuedImmutableLabel: "صادرة (نهائية)",
    cancelledLabel: "ملغاة",
    paidLabel: "مدفوعة ومستخلصة",
    pendingLabel: "في الانتظار",
    detailsAction: "التفاصيل ←",

    // Invoicing Tabs
    tabInvoices: "الفواتير",
    tabQuotes: "عروض الأسعار والتقديرات",
    tabCreditNotes: "الفواتير الدائنة (سندات الإنقاص)",
    tabTaxSummary: "الكشف الجبائي (IFU)",

    // List Filters & Common Search
    searchInvoicesPlaceholder: "بحث برقم الفاتورة أو اسم الزبون...",
    filterAll: "الكل",
    filterDrafts: "مسودات",
    filterIssued: "صادرة",
    filterPaid: "مدفوعة (مستخلصة)",
    filterPending: "في انتظار الدفع",
    filterCancelled: "ملغاة",
    noInvoicesFound: "لم يتم العثور على أي فاتورة",

    // Quotes List Page
    quotesTitle: "عروض الأسعار والتقديرات (Devis)",
    quotesSubtitle:
      "عروض تجارية معفاة من الرسم على القيمة المضافة • تحويل إلى فاتورة رسمية بنقرة واحدة",
    newQuoteBtn: "عرض سعر جديد",
    totalQuotesStat: "إجمالي عروض الأسعار",
    acceptedQuotesStat: "عروض مقبولة ومصادق عليها",
    pendingQuotesStat: "في انتظار رد الزبون",
    conversionRateStat: "نسبة التحويل إلى فواتير",
    allExercises: "كافة السنوات المالية",
    proposalsAccepted: "{count} عرض مقبول",
    draftOrSent: "مسودات أو مرسلة للزبائن",
    convertedCountText: "تم تحويل {count} عرض إلى فواتير رسمية",
    filterSent: "مرسلة",
    filterAccepted: "مقبولة",
    filterConverted: "مفوترة",
    filterRejected: "مرفوضة",
    searchQuotesPlaceholder: "بحث برقم العرض أو اسم الزبون...",
    noQuotesFound: "لم يتم العثور على أي عرض أسعار",
    startCreateQuote: "ابدأ بإنشاء أول عرض سعر تجاري لزبائنك.",
    colQuoteNumber: "رقم العرض",
    colValidity: "التاريخ والصلاحية",
    colEstimatedAmount: "المبلغ التقديري",
    societyClient: "شركة / شخص معنوي",
    individualClient: "شخص طبيعي (خاص)",
    expiredOn: "انتهت الصلاحية في ",
    validUntil: "صالح لغاية ",
    statusSent: "مرسل للزبون",
    statusAccepted: "مقبول",
    statusConverted: "تمت الفوترة",
    statusRejected: "مرفوض",
    viewGeneratedInvoice: "الفاتورة المولدة",
    downloadPdf: "تحميل PDF",

    // Credit Notes List Page
    creditNotesTitle: "الفواتير الدائنة (سندات الإنقاص)",
    creditNotesSubtitle:
      "تصحيح محاسبي رسمي وتنزيل مبالغ • خصم مباشر من رقم الأعمال والضريبة الجزافية",
    totalCreditNotesStat: "إجمالي الفواتير الدائنة",
    refundedCreditNotesStat: "فواتير دائنة مخصومة / معوضة",
    pendingRefundStat: "في انتظار الخصم والتعويض",
    deductedFromTurnover: "تم خصمها من رقم الأعمال الخاضع للضريبة",
    searchCreditNotesPlaceholder: "بحث برقم الفاتورة الدائنة أو الفاتورة الأصلية أو الزبون...",
    filterRefunded: "معوضة (مخصومة)",
    colCreditNoteNumber: "رقم الفاتورة الدائنة",
    colLinkedInvoice: "الفاتورة الأصلية المرجعية",
    colReason: "سبب الإنقاص",
    colCreditedAmount: "المبلغ الدائن",
    colRefundStatus: "حالة التعويض",
    statusRefunded: "تم التعويض والخصم",
    statusPendingRefund: "في الانتظار",

    // Tax Summary Page
    taxSummaryTitle: "الرزنامة الجبائية والجدول التلخيصي IFU",
    taxSummarySubtitle:
      "تحضير التصريح الجبائي السنوي (سلسلة ج رقم 12 مكرر) لمفتشية الضرائب أو منصة جبايتك بكل ثقة.",
    fiscalComplianceBadge: "الامتثال الجبائي والضمان الاجتماعي",
    fiscalDecree: "المرسوم 23-197 والقانون 22-23",
    fiscalExerciseLabel: "السنة المالية :",
    printReport: "طباعة الكشف الرسمي",
    exportCsv: "تصدير بصيغة CSV",
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;
