/**
 * NOMENCLATURE OFFICIELLE DES ACTIVITÉS ÉLIGIBLES À L'AUTO-ENTREPRENEUR EN ALGÉRIE
 * Référence légale : Décret exécutif n° 23-197 du 25 mai 2023
 * Agence Nationale de l'Auto-Entrepreneur (ANAE)
 *
 * Structure des codes ANAE (6 chiffres) :
 * - Positions 1-2 : Code du Domaine / Branche d'activité (01 à 07)
 * - Positions 3-6 : Code individualisé de la spécialité
 */

export interface AnaeBranch {
  id: string; // "01" à "07"
  code: string;
  label: string;
  labelAr: string;
  description: string;
  iconName: string;
}

export interface AnaeActivity {
  code: string; // 6 chiffres
  label: string;
  labelAr: string;
  branchId: string;
  keywords: string[];
}

export const ANAE_BRANCHES: AnaeBranch[] = [
  {
    id: "01",
    code: "01",
    label: "Conseil, expertise et formation",
    labelAr: "الاستشارة والخبرة والتكوين",
    description: "Conseil stratégique, audit, gestion de projet, coaching professionnel et formation",
    iconName: "Briefcase",
  },
  {
    id: "02",
    code: "02",
    label: "Services numériques et activités connexes",
    labelAr: "الخدمات الرقمية والأنشطة ذات الصلة",
    description: "Développement web & mobile, UI/UX, Cloud, cybersécurité, IA et support informatique",
    iconName: "Code",
  },
  {
    id: "03",
    code: "03",
    label: "Prestations à domicile",
    labelAr: "الخدمات المنزلية",
    description: "Soutien scolaire, assistance technique à domicile, maintenance et petits travaux",
    iconName: "Home",
  },
  {
    id: "04",
    code: "04",
    label: "Services à la personne",
    labelAr: "الخدمات الموجهة للأشخاص",
    description: "Coaching sportif, bien-être, conciergerie privée et accompagnement individuel",
    iconName: "UserCheck",
  },
  {
    id: "05",
    code: "05",
    label: "Services de loisirs et de récréation",
    labelAr: "خدمات الترفيه والتسلية",
    description: "Animation d'activités récréatives, organisation d'ateliers et guidage de plein air",
    iconName: "Smile",
  },
  {
    id: "06",
    code: "06",
    label: "Services aux entreprises",
    labelAr: "الخدمات الموجهة للمؤسسات",
    description: "Assistance administrative, télésecrétariat, traduction, transcription et téléprospection",
    iconName: "Building2",
  },
  {
    id: "07",
    code: "07",
    label: "Services culturels, de communication et d'audiovisuel",
    labelAr: "الخدمات الثقافية والاتصال والسمعي البصري",
    description: "Design graphique, community management, marketing digital, vidéo, photo et rédaction",
    iconName: "Palette",
  },
];

export const ANAE_ACTIVITIES: AnaeActivity[] = [
  // --- BRANCHE 02 : SERVICES NUMÉRIQUES ET ACTIVITÉS CONNEXES ---
  {
    code: "020101",
    label: "Développement d'applications web et mobiles",
    labelAr: "تطوير تطبيقات الويب والهاتف المحمول",
    branchId: "02",
    keywords: ["frontend", "backend", "fullstack", "react", "next.js", "vue", "flutter", "ios", "android", "node"],
  },
  {
    code: "020102",
    label: "Conception d'interfaces et expérience utilisateur (UI/UX Design)",
    labelAr: "تصميم واجهات وتجربة المستخدم",
    branchId: "02",
    keywords: ["ui", "ux", "figma", "wireframe", "prototype", "ergonomie", "design system"],
  },
  {
    code: "020103",
    label: "Administration de systèmes, réseaux et infrastructure Cloud",
    labelAr: "إدارة الأنظمة والشبكات والبنية التحتية السحابية",
    branchId: "02",
    keywords: ["devops", "cloud", "aws", "docker", "kubernetes", "linux", "serveur", "cloudflare"],
  },
  {
    code: "020104",
    label: "Audit de sécurité des systèmes d'information et cybersécurité",
    labelAr: "تدقيق أمان نظم المعلومات والأمن السيبراني",
    branchId: "02",
    keywords: ["pentest", "sécurité", "cybersecurity", "vulnerability", "audit technique"],
  },
  {
    code: "020105",
    label: "Intégration de solutions logicielles et systèmes de gestion (CMS/ERP)",
    labelAr: "دمج الحلول البرمجية وأنظمة التسيير",
    branchId: "02",
    keywords: ["wordpress", "shopify", "odoo", "prestashop", "strapi", "cms"],
  },
  {
    code: "020106",
    label: "Analyse de données, Big Data et solutions d'Intelligence Artificielle",
    labelAr: "تحليل البيانات والذكاء الاصطناعي",
    branchId: "02",
    keywords: ["data science", "ia", "machine learning", "python", "power bi", "analytics"],
  },
  {
    code: "020107",
    label: "Optimisation pour les moteurs de recherche (SEO & Référencement technique)",
    labelAr: "تحسين محركات البحث والتهيئة التقنية",
    branchId: "02",
    keywords: ["seo", "référencement", "google search console", "semrush", "audit seo"],
  },
  {
    code: "020108",
    label: "Maintenance, assistance et dépannage informatique à distance",
    labelAr: "الصيانة والمساعدة والدعم التقني عن بعد",
    branchId: "02",
    keywords: ["support", "helpdesk", "maintenance", "dépannage informatique"],
  },
  {
    code: "020109",
    label: "Gestion, modélisation et administration de bases de données",
    labelAr: "إدارة ونمذجة قواعد البيانات",
    branchId: "02",
    keywords: ["postgresql", "mysql", "mongodb", "sql", "dba", "supabase"],
  },
  {
    code: "020110",
    label: "Assurance qualité logicielle et tests automatisés (QA Engineer)",
    labelAr: "ضمان جودة البرمجيات والاختبارات الآلية",
    branchId: "02",
    keywords: ["qa", "testing", "cypress", "playwright", "jest", "tests unitaires"],
  },

  // --- BRANCHE 07 : SERVICES CULTURELS, COMMUNICATION ET AUDIOVISUEL ---
  {
    code: "070101",
    label: "Création graphique, infographie et identité visuelle (Branding)",
    labelAr: "التصميم الغرافيكي والهوية البصرية",
    branchId: "07",
    keywords: ["graphisme", "logo", "photoshop", "illustrator", "charte graphique", "print"],
  },
  {
    code: "070102",
    label: "Gestion et animation des réseaux sociaux (Community Management)",
    labelAr: "إدارة وتنشيط شبكات التواصل الاجتماعي",
    branchId: "07",
    keywords: ["community manager", "social media", "instagram", "linkedin", "tiktok", "facebook"],
  },
  {
    code: "070103",
    label: "Stratégie de marketing digital et gestion de campagnes publicitaires (Media Buying)",
    labelAr: "التسويق الرقمي وإدارة الحملات الإعلانية",
    branchId: "07",
    keywords: ["meta ads", "google ads", "publicité", "growth marketing", "acquisition"],
  },
  {
    code: "070104",
    label: "Montage vidéo, animation 2D/3D et post-production audiovisuelle",
    labelAr: "تركيب الفيديو والرسوم المتحركة والمونتاج",
    branchId: "07",
    keywords: ["premiere pro", "after effects", "motion design", "vidéo", "animation", "reels"],
  },
  {
    code: "070105",
    label: "Photographie professionnelle, prise de vue et retouche d'images",
    labelAr: "التصوير الفوتوغرافي الاحترافي ومعالجة الصور",
    branchId: "07",
    keywords: ["photo", "shooting", "portrait", "packshot", "retouche photo", "lightroom"],
  },
  {
    code: "070106",
    label: "Rédaction web, copywriting, storytelling et création de contenu",
    labelAr: "التحرير وكتابة المحتوى الإعلاني",
    branchId: "07",
    keywords: ["copywriting", "rédaction", "articles", "storytelling", "contenu web"],
  },
  {
    code: "070107",
    label: "Enregistrement de voix off, doublage et conception sonore (Sound Design)",
    labelAr: "التعليق الصوتي والدبلجة وهندسة الصوت",
    branchId: "07",
    keywords: ["voix off", "voice over", "podcast", "audio", "doublage"],
  },
  {
    code: "070108",
    label: "Relations presse, communication événementielle et relations publiques",
    labelAr: "العلاقات العامة والتواصل الإعلامي",
    branchId: "07",
    keywords: ["communication", "relations publiques", "communiqué", "médias"],
  },

  // --- BRANCHE 01 : CONSEIL, EXPERTISE ET FORMATION ---
  {
    code: "010101",
    label: "Conseil en stratégie, organisation et développement d'entreprises",
    labelAr: "استشارات في الاستراتيجية وتنظيم المؤسسات",
    branchId: "01",
    keywords: ["consulting", "stratégie", "business plan", "management", "organisation"],
  },
  {
    code: "010102",
    label: "Conseil en transformation numérique et modernisation des processus",
    labelAr: "استشارات التحول الرقمي وعصرنة الإجراءات",
    branchId: "01",
    keywords: ["digital transformation", "numérique", "processus", "audit tech"],
  },
  {
    code: "010103",
    label: "Formation professionnelle continue et coaching d'équipes",
    labelAr: "التكوين المهني المستمر والتدريب",
    branchId: "01",
    keywords: ["formation", "formateur", "coaching", "ateliers", "workshop"],
  },
  {
    code: "010104",
    label: "Conseil en ressources humaines, gestion des talents et recrutement",
    labelAr: "استشارات الموارد البشرية وإدارة الكفاءات",
    branchId: "01",
    keywords: ["rh", "recrutement", "talent", "gestion des compétences"],
  },
  {
    code: "010105",
    label: "Gestion de projet, assistance à maîtrise d'ouvrage (AMOA)",
    labelAr: "إدارة المشاريع والمساعدة في التنفيذ",
    branchId: "01",
    keywords: ["scrum", "agile", "chef de projet", "amoa", "pmp"],
  },

  // --- BRANCHE 06 : SERVICES AUX ENTREPRISES ---
  {
    code: "060101",
    label: "Assistance administrative et télésecrétariat",
    labelAr: "المساعدة الإدارية والسكرتارية عن بعد",
    branchId: "06",
    keywords: ["secrétariat", "administratif", "télésecrétariat", "gestion de planning"],
  },
  {
    code: "060102",
    label: "Traduction de documents, interprétariat et relecture linguistique",
    labelAr: "ترجمة الوثائق والتدقيق اللغوي",
    branchId: "06",
    keywords: ["traduction", "arabe", "français", "anglais", "relecture", "correction"],
  },
  {
    code: "060103",
    label: "Transcription audio/vidéo et saisie de données",
    labelAr: "التفريغ الصوتي وإدخال البيانات",
    branchId: "06",
    keywords: ["transcription", "saisie", "data entry", "dactylographie"],
  },
  {
    code: "060104",
    label: "Prospection commerciale téléphonique et relation client à distance",
    labelAr: "التنقيب التجاري وخدمة العملاء عن بعد",
    branchId: "06",
    keywords: ["téléprospection", "call center", "service client", "support client"],
  },
  {
    code: "060105",
    label: "Veille stratégique, concurrentielle et études de marché",
    labelAr: "اليقظة الاستراتيجية ودراسات السوق",
    branchId: "06",
    keywords: ["veille", "benchmark", "étude de marché", "recherche documentaire"],
  },

  // --- BRANCHE 04 : SERVICES À LA PERSONNE ---
  {
    code: "040101",
    label: "Coaching sportif personnel et préparation physique individuelle",
    labelAr: "التدريب الرياضي الشخصي واللياقة البدنية",
    branchId: "04",
    keywords: ["coach sportif", "fitness", "remise en forme", "nutrition"],
  },
  {
    code: "040102",
    label: "Organisation d'événements privés et célébrations personnelles",
    labelAr: "تنظيم الفعاليات والمناسبات الخاصة",
    branchId: "04",
    keywords: ["event planner", "mariage", "fête", "anniversaire", "célébration"],
  },
  {
    code: "040103",
    label: "Conseil en image personnelle et stylisme individuel",
    labelAr: "استشارات المظهر والأناقة الشخصية",
    branchId: "04",
    keywords: ["relooking", "styliste", "image", "mode"],
  },

  // --- BRANCHE 03 : PRESTATIONS À DOMICILE ---
  {
    code: "030101",
    label: "Soutien scolaire, cours de langues et accompagnement pédagogique à domicile",
    labelAr: "الدعم المدرسي والدروس الخصوصية المنزلية",
    branchId: "03",
    keywords: ["cours particuliers", "soutien scolaire", "maths", "physique", "langues"],
  },
  {
    code: "030102",
    label: "Installation, maintenance et dépannage informatique à domicile",
    labelAr: "تركيب وصيانة أجهزة الإعلام الآلي في المنزل",
    branchId: "03",
    keywords: ["dépannage pc", "installation wifi", "domicile", "réparation"],
  },
  {
    code: "030103",
    label: "Conseil en aménagement, agencement et décoration d'intérieur résidentielle",
    labelAr: "استشارات التهيئة والديكور الداخلي المنزلي",
    branchId: "03",
    keywords: ["décoration", "design d'intérieur", "agencement", "home staging"],
  },

  // --- BRANCHE 05 : SERVICES DE LOISIRS ET DE RÉCRÉATION ---
  {
    code: "050101",
    label: "Animation d'activités récréatives, ateliers créatifs et événements ludiques",
    labelAr: "تنشيط الأنشطة الترفيهية والورشات الإبداعية",
    branchId: "05",
    keywords: ["animateur", "ateliers", "jeux", "animations enfants", "récréation"],
  },
  {
    code: "050102",
    label: "Guidage et organisation d'activités de plein air, randonnées et excursions",
    labelAr: "الإرشاد وتنظيم أنشطة الهواء الطلق والجولات",
    branchId: "05",
    keywords: ["randonnée", "guide", "excursion", "nature", "tourisme local"],
  },
  {
    code: "050103",
    label: "Organisation de compétitions e-sport et animation de jeux vidéo",
    labelAr: "تنظيم مسابقات الألعاب الإلكترونية وتنشيط الفعاليات",
    branchId: "05",
    keywords: ["esport", "gaming", "jeux vidéo", "tournoi"],
  },
];

export function getBranchById(id: string): AnaeBranch | undefined {
  return ANAE_BRANCHES.find((b) => b.id === id);
}

export function getActivityByCode(code: string): AnaeActivity | undefined {
  return ANAE_ACTIVITIES.find((a) => a.code === code);
}

export function searchAnaeActivities(query: string, branchId?: string): AnaeActivity[] {
  const q = query.trim().toLowerCase();
  return ANAE_ACTIVITIES.filter((activity) => {
    if (branchId && branchId !== "ALL" && activity.branchId !== branchId) {
      return false;
    }
    if (!q) return true;
    return (
      activity.code.toLowerCase().includes(q) ||
      activity.label.toLowerCase().includes(q) ||
      activity.labelAr.toLowerCase().includes(q) ||
      activity.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
}
