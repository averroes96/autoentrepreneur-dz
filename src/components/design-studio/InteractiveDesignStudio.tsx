"use client";

import React, { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  Layout,
  Image as ImageIcon,
  Award,
  CreditCard,
  Printer,
  Download,
  Save,
  RotateCcw,
  Check,
  CheckCircle2,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Upload,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Landmark,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  BRAND_PALETTES,
  TEMPLATE_STYLES,
  BrandColorKey,
  TemplateStyleKey,
  LogoPositionKey,
  getBrandPalette,
  getTemplateStyle,
} from "@/lib/invoiceDesign";
import {
  ALGERIAN_BANKS,
  PAYMENT_TERMS_LIST,
  PAYMENT_INSTRUCTION_SUGGESTIONS,
  formatRip,
  cleanBankString,
} from "@/lib/banking";
import { saveDocumentDesignAction } from "@/app/actions";
import { BilingualInvoicePaper } from "@/components/invoices/BilingualInvoicePaper";
import { BilingualQuotePaper } from "@/components/quotes/BilingualQuotePaper";
import { BilingualCreditNotePaper } from "@/components/credit-notes/BilingualCreditNotePaper";
import { BilingualPaymentReceiptPaper } from "@/components/receipts/BilingualPaymentReceiptPaper";
import { OfficialSeal } from "@/components/common/OfficialSeal";
import { useI18n } from "@/lib/i18n/I18nContext";

export type DocumentType = "INVOICE" | "QUOTE" | "CREDIT_NOTE" | "RECEIPT";

interface InteractiveDesignStudioProps {
  profile: {
    fullName?: string | null;
    rnaeNumber?: string | null;
    nif?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    activityCode?: string | null;
    activityLabel?: string | null;
    vatExemptionNote?: string | null;
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
  };
}

const INK_COLORS = [
  { id: "BLUE", labelFr: "Bleu Administratif", labelAr: "أزرق إداري", hex: "#1e40af" },
  { id: "INDIGO", labelFr: "Indigo Notarial", labelAr: "بنفسجي رسمي", hex: "#4338ca" },
  { id: "EMERALD", labelFr: "Émeraude République", labelAr: "أخضر زمردي", hex: "#047857" },
  { id: "SLATE", labelFr: "Noir Carbone", labelAr: "حبر أسود داكن", hex: "#1e293b" },
];

const SPECIMEN_CLIENT = {
  name: "SARL Algiers Tech Innovations",
  clientType: "PROFESSIONAL",
  address: "15 Boulevard Zighoud Youcef, Alger Centre",
  nif: "001916012345678",
  nis: "001916012345678",
  rc: "16/00-1234567B22",
  email: "direction@algiers-tech.dz",
  phone: "021 73 00 00",
};

export function InteractiveDesignStudio({ profile }: InteractiveDesignStudioProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  // Control tabs
  const [activeTab, setActiveTab] = useState<"palette" | "logo" | "stamp" | "bank">("palette");

  // Canvas controls
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("INVOICE");
  const [previewLang, setPreviewLang] = useState<"fr" | "ar">("fr");
  const [zoom, setZoom] = useState<number>(100);

  // Live customizable design state (WYSIWYG)
  const [brandColor, setBrandColor] = useState<BrandColorKey>(
    (profile.brandColor?.toUpperCase() as BrandColorKey) || "EMERALD"
  );
  const [templateStyle, setTemplateStyle] = useState<TemplateStyleKey>(
    (profile.templateStyle?.toUpperCase() as TemplateStyleKey) || "MODERN"
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(profile.logoUrl || null);
  const [logoPosition, setLogoPosition] = useState<LogoPositionKey>(
    (profile.logoPosition?.toUpperCase() as LogoPositionKey) || "LEFT"
  );
  const [showStampSignature, setShowStampSignature] = useState<boolean>(
    profile.showStampSignature !== false
  );
  const [stampType, setStampType] = useState<string>(
    profile.stampType === "CUSTOM"
      ? "CUSTOM"
      : profile.stampType === "AUTO_ROUND"
      ? "AUTO_ROUND"
      : "AUTO"
  );
  const [stampUrl, setStampUrl] = useState<string | null>(profile.stampUrl || null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(profile.signatureUrl || null);
  const [selectedInkColor, setSelectedInkColor] = useState<string>("#1e40af");

  // Live banking state
  const [bankName, setBankName] = useState<string>(profile.bankName || "");
  const [bankRib, setBankRib] = useState<string>(profile.bankRib || "");
  const [bankIban, setBankIban] = useState<string>(profile.bankIban || "");
  const [bankBic, setBankBic] = useState<string>(profile.bankBic || "");
  const [ccpNumber, setCcpNumber] = useState<string>(profile.ccpNumber || "");
  const [ccpKey, setCcpKey] = useState<string>(profile.ccpKey || "");
  const [paymentTerms, setPaymentTerms] = useState<string>(profile.paymentTerms || "UPON_RECEIPT");
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    profile.paymentInstructions || ""
  );

  // Status & feedback
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  // Image compressor helper (keeps payload lightweight under 40KB)
  const processImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    callback: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      alert("Format non supporté. Veuillez sélectionner une image (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL("image/png", 0.92));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Revert back to original saved profile state
  const handleReset = () => {
    setBrandColor((profile.brandColor?.toUpperCase() as BrandColorKey) || "EMERALD");
    setTemplateStyle((profile.templateStyle?.toUpperCase() as TemplateStyleKey) || "MODERN");
    setLogoUrl(profile.logoUrl || null);
    setLogoPosition((profile.logoPosition?.toUpperCase() as LogoPositionKey) || "LEFT");
    setShowStampSignature(profile.showStampSignature !== false);
    setStampType(
      profile.stampType === "CUSTOM"
        ? "CUSTOM"
        : profile.stampType === "AUTO_ROUND"
        ? "AUTO_ROUND"
        : "AUTO"
    );
    setStampUrl(profile.stampUrl || null);
    setSignatureUrl(profile.signatureUrl || null);
    setBankName(profile.bankName || "");
    setBankRib(profile.bankRib || "");
    setBankIban(profile.bankIban || "");
    setBankBic(profile.bankBic || "");
    setCcpNumber(profile.ccpNumber || "");
    setCcpKey(profile.ccpKey || "");
    setPaymentTerms(profile.paymentTerms || "UPON_RECEIPT");
    setPaymentInstructions(profile.paymentInstructions || "");
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Save current design to database
  const handleSaveDesign = () => {
    startTransition(async () => {
      setSaveError(null);
      setSaveSuccess(false);

      const res = await saveDocumentDesignAction({
        brandColor,
        templateStyle,
        logoUrl,
        logoPosition,
        showStampSignature,
        stampType,
        stampUrl,
        signatureUrl,
        bankName,
        bankRib,
        bankIban,
        bankBic,
        ccpNumber,
        ccpKey,
        paymentTerms,
        paymentInstructions,
      });

      if (res?.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        router.refresh();
      }
    });
  };

  // Live seller snapshot object feeding the paper components
  const liveSeller = {
    fullName: profile.fullName || "Auto-Entrepreneur",
    rnaeNumber: profile.rnaeNumber || "24-001234",
    nif: profile.nif || "002416012345678",
    address: profile.address || "12 Rue Didouche Mourad, Alger",
    phone: profile.phone || "0550 12 34 56",
    email: profile.email || "contact@autoentrepreneur.dz",
    activityCode: profile.activityCode || "620101",
    activityLabel: profile.activityLabel || "Développement informatique & Solutions Cloud",
    brandColor,
    templateStyle,
    logoUrl,
    logoPosition,
    showStampSignature,
    stampType,
    stampUrl,
    signatureUrl,
    bankName,
    bankRib,
    bankIban,
    bankBic,
    accountHolder: profile.fullName || "Auto-Entrepreneur",
    bankAgency: profile.bankAgency || "Agence Alger-Centre",
    ccpNumber,
    ccpKey,
    paymentTerms,
    paymentInstructions,
  };

  // Specimen documents data for live real-time rendering
  const specimenInvoice = {
    id: "specimen-fac-42",
    invoiceNumber: "FAC-2026-0042",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 15 * 86400000),
    paymentTerms: paymentTerms || "UPON_RECEIPT",
    issuedAt: new Date(),
    status: "ISSUED",
    paymentStatus: "PENDING",
    total: 180000,
    currency: "DZD",
    exchangeRate: 1,
    totalDzd: 180000,
    vatExemptionNote:
      profile.vatExemptionNote ||
      "Facture exonérée de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
    notes:
      paymentInstructions ||
      "Règlement attendu selon les coordonnées bancaires / BaridiMob mentionnées ci-dessous.",
    showDetailedItems: true,
    lineItems: [
      {
        id: "li-1",
        description: "Audit d'architecture logicielle & refonte de l'infrastructure Cloud",
        quantity: 1,
        unitPrice: 120000,
        totalPrice: 120000,
      },
      {
        id: "li-2",
        description: "Optimisation des performances API et sécurisation des bases de données",
        quantity: 1,
        unitPrice: 60000,
        totalPrice: 60000,
      },
    ],
  };

  const specimenQuote = {
    id: "specimen-dev-18",
    quoteNumber: "DEV-2026-0018",
    issueDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 86400000),
    paymentTerms: paymentTerms || "UPON_RECEIPT",
    status: "SENT",
    total: 240000,
    currency: "DZD",
    exchangeRate: 1,
    totalDzd: 240000,
    vatExemptionNote:
      profile.vatExemptionNote ||
      "Devis exonéré de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
    notes: "Délai de réalisation estimé : 4 semaines à compter de la validation du devis.",
    showDetailedItems: true,
    lineItems: [
      {
        id: "li-q1",
        description: "Conception & développement d'une plateforme web moderne et sécurisée",
        quantity: 1,
        unitPrice: 180000,
        totalPrice: 180000,
      },
      {
        id: "li-q2",
        description: "Configuration de l'infrastructure cloud & intégration CI/CD",
        quantity: 1,
        unitPrice: 60000,
        totalPrice: 60000,
      },
    ],
  };

  const specimenCreditNote = {
    id: "specimen-avr-03",
    creditNoteNumber: "AVR-2026-0003",
    issueDate: new Date(),
    status: "ISSUED",
    refundStatus: "COMPLETED",
    reason: "Remise commerciale exceptionnelle suite à révision du périmètre",
    total: 35000,
    currency: "DZD",
    vatExemptionNote:
      profile.vatExemptionNote ||
      "Facture d'avoir exonérée de TVA en vertu de l'article 13 du Décret exécutif n° 23-197.",
    notes: "Avoir déductible de la prochaine situation comptable.",
    originalInvoice: {
      invoiceNumber: "FAC-2026-0040",
      issueDate: new Date(Date.now() - 14 * 86400000),
      total: 180000,
    },
    lineItems: [
      {
        id: "li-cn1",
        description: "Avoir commercial sur prestation d'audit logiciel",
        quantity: 1,
        unitPrice: 35000,
        totalPrice: 35000,
      },
    ],
  };

  const specimenReceipt = {
    receiptNumber: "REC-2026-0042",
    invoiceNumber: "FAC-2026-0042",
    invoiceId: "fac-42",
    invoiceIssueDate: new Date(Date.now() - 5 * 86400000),
    paymentDate: new Date(),
    paymentMethod: "BARIDIMOB",
    paymentReference: "TRX-BM-99887766",
    total: 180000,
    currency: "DZD",
    notes: "Règlement intégral reçu sans réserve.",
  };

  // Download Specimen PDF from server route (Vector PDFKit Engine)
  const handleDownloadSpecimenPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const res = await fetch("/api/settings/document-design/specimen-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: selectedDocType,
          lang: previewLang,
          seller: liveSeller,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la génération du PDF spécimen.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Specimen-${selectedDocType}-${previewLang.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Impossible de télécharger le PDF spécimen.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-100">
      {/* Studio Header (Breadcrumb, Title, Quick Actions) */}
      <div className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-2xs z-20">
        <div className="max-w-[1750px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs shadow-violet-500/20 shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/dashboard" className="hover:text-slate-800 transition">
                  Tableau de bord
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/profile" className="hover:text-slate-800 transition">
                  Paramètres
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-violet-700 font-semibold">Studio Graphique (WYSIWYG)</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>Studio de Personnalisation en Direct</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                  <Sparkles className="w-3 h-3 text-violet-600" />
                  WYSIWYG Parity
                </span>
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title="Réinitialiser aux valeurs enregistrées"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSpecimenPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer disabled:opacity-50"
              title="Télécharger le fichier PDF vectoriel généré par PDFKit"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? "animate-bounce" : ""}`} />
              <span>{isDownloadingPdf ? "Génération PDF..." : "Spécimen PDF"}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition cursor-pointer"
              title="Imprimer directement le document (window.print())"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer (A4)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDesign}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-xs shadow-violet-600/30 transition cursor-pointer disabled:opacity-60"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                  <span>{isPending ? "Sauvegarde..." : "Enregistrer le Design"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="max-w-[1750px] mx-auto mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* Main Split-Screen Studio UI */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1920px] w-full mx-auto overflow-hidden">
        {/* LEFT PANEL: Interactive Controls Sidebar */}
        <div className="no-print w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-slate-200 flex flex-col shrink-0 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
          {/* Controls Tabs Navigation */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 pt-3 pb-2">
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("palette")}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "palette"
                    ? "bg-white text-violet-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="truncate">Modèle</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("logo")}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "logo"
                    ? "bg-white text-violet-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="truncate">Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stamp")}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "stamp"
                    ? "bg-white text-violet-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="truncate">Cachet</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("bank")}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === "bank"
                    ? "bg-white text-violet-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="truncate">Banque</span>
              </button>
            </div>
          </div>

          {/* TAB 1: PALETTE & TEMPLATES */}
          {activeTab === "palette" && (
            <div className="p-5 space-y-6 animate-in fade-in duration-200">
              {/* Brand Colors */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Palette Chromatique Principale (5 nuances)
                </label>
                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                  Couleur appliquée aux bandeaux d&apos;en-tête, badges de statut, bordures
                  élégantes et totaux des documents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(BRAND_PALETTES).map((pal) => {
                    const isSelected = brandColor === pal.key;
                    return (
                      <button
                        key={pal.key}
                        type="button"
                        onClick={() => setBrandColor(pal.key)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white shadow-2xs"
                          style={{ backgroundColor: pal.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{pal.labelFr}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{pal.hex}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Styles */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Modèle de Mise en Page (4 styles)
                </label>
                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                  Architecture du document, styles des encadrements et densité d&apos;affichage.
                </p>

                <div className="space-y-3">
                  {Object.values(TEMPLATE_STYLES).map((tmpl) => {
                    const isSelected = templateStyle === tmpl.key;
                    return (
                      <button
                        key={tmpl.key}
                        type="button"
                        onClick={() => setTemplateStyle(tmpl.key)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">{tmpl.labelFr}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {tmpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            {tmpl.descFr}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & ALIGNMENT */}
          {activeTab === "logo" && (
            <div className="p-5 space-y-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Logo Commercial de l&apos;Entreprise
                </label>
                <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
                  Téléversez un logo haute résolution (PNG transparent recommandé). L&apos;image est
                  automatiquement compressée et intégrée dans vos impressions A4 et PDF vectoriels.
                </p>

                {logoUrl ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-slate-200 max-h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Logo actif & synchronisé
                      </span>
                      <button
                        type="button"
                        onClick={() => setLogoUrl(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-violet-50/20"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Cliquer pour téléverser votre logo
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG ou WebP (max 400x200)</p>
                  </div>
                )}

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processImage(file, 400, 200, (dataUrl) => {
                        setLogoUrl(dataUrl);
                      });
                    }
                  }}
                />
              </div>

              {/* Logo Alignment */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Positionnement & Alignement du Logo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "LEFT", label: "À gauche", icon: AlignLeft },
                      { key: "CENTER", label: "Centré", icon: AlignCenter },
                      { key: "RIGHT", label: "À droite", icon: AlignRight },
                    ] as const
                  ).map((pos) => {
                    const isSelected = logoPosition === pos.key;
                    const Icon = pos.icon;
                    return (
                      <button
                        key={pos.key}
                        type="button"
                        onClick={() => setLogoPosition(pos.key)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30 text-violet-700 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{pos.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAMP & SIGNATURE */}
          {activeTab === "stamp" && (
            <div className="p-5 space-y-6 animate-in fade-in duration-200">
              {/* Master toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Afficher le Cachet & Signature
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Présent au bas des factures, devis, avoirs et quittances.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStampSignature}
                    onChange={(e) => setShowStampSignature(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
                </label>
              </div>

              {showStampSignature && (
                <>
                  {/* Stamp Type: Auto vs Custom */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Type de Cachet Commercial
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setStampType("AUTO")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          stampType === "AUTO" || stampType === "AUTO_RECTANGLE"
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30 text-violet-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-xs">Rectangulaire B2B</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal leading-snug">
                          Standard Trodat (Recommandé). Lisibilité optimale.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStampType("AUTO_ROUND")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          stampType === "AUTO_ROUND"
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30 text-violet-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Award className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-xs">Circulaire Officiel</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal leading-snug">
                          Tampon rond 38mm avec arcs concentriques.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStampType("CUSTOM")}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          stampType === "CUSTOM"
                            ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30 text-violet-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Upload className="w-3.5 h-3.5 text-violet-600" />
                          <span className="text-xs">Scan Personnalisé</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-normal leading-snug">
                          Fichier PNG transparent scanné de votre tampon.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Procedural Ink Picker if AUTO or AUTO_ROUND */}
                  {stampType !== "CUSTOM" && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Teinte d&apos;Encre Administrative
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {INK_COLORS.map((ink) => {
                          const isSelected = selectedInkColor === ink.hex;
                          return (
                            <button
                              key={ink.id}
                              type="button"
                              onClick={() => setSelectedInkColor(ink.hex)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/30"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className="w-5 h-5 rounded-full shrink-0 shadow-2xs"
                                style={{ backgroundColor: ink.hex }}
                              />
                              <span className="text-xs font-medium text-slate-800">
                                {ink.labelFr}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Stamp Upload if CUSTOM */}
                  {stampType === "CUSTOM" && (
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Fichier du Tampon Scanné (PNG Transparent)
                      </label>
                      {stampUrl ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={stampUrl} alt="Tampon" className="w-12 h-12 object-contain" />
                            <span className="text-xs text-slate-700 font-medium">Tampon scanné actif</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStampUrl(null)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => stampInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50"
                        >
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-slate-800">
                            Sélectionner le scan PNG du tampon
                          </p>
                        </div>
                      )}
                      <input
                        ref={stampInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processImage(file, 260, 260, (url) => setStampUrl(url));
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Signature Upload */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Griffe & Signature Manuelle (Optionnel)
                    </label>
                    <p className="text-xs text-slate-500 mb-2.5">
                      Signature transparente superposée au cachet pour une approbation officielle
                      immédiate.
                    </p>

                    {signatureUrl ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={signatureUrl}
                            alt="Signature"
                            className="w-16 h-8 object-contain"
                          />
                          <span className="text-xs text-slate-700 font-medium">Signature active</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSignatureUrl(null)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => signatureInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50"
                      >
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-slate-700">
                          Téléverser un scan de signature (PNG)
                        </p>
                      </div>
                    )}
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          processImage(file, 280, 140, (url) => setSignatureUrl(url));
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: BANK & BARIDIMOB */}
          {activeTab === "bank" && (
            <div className="p-5 space-y-5 animate-in fade-in duration-200">
              {/* Financial Institution Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Établissement Financier
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Sélectionner une banque ou Algérie Poste</option>
                  {ALGERIAN_BANKS.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* RIP 20 Digits */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Relevé d&apos;Identité Postale / Bancaire (RIP - 20 Chiffres)
                </label>
                <input
                  type="text"
                  value={bankRib}
                  onChange={(e) => setBankRib(formatRip(e.target.value))}
                  placeholder="007 99999 0012345678 90"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* CCP Number & Key */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    N° Compte CCP
                  </label>
                  <input
                    type="text"
                    value={ccpNumber}
                    onChange={(e) => setCcpNumber(cleanBankString(e.target.value))}
                    placeholder="12345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Clé
                  </label>
                  <input
                    type="text"
                    value={ccpKey}
                    onChange={(e) => setCcpKey(cleanBankString(e.target.value).slice(0, 2))}
                    placeholder="90"
                    maxLength={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Default Payment Terms */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Échéancier & Conditions de Paiement
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {PAYMENT_TERMS_LIST.map((term) => (
                    <option key={term.key} value={term.key}>
                      {term.labelFr} ({term.labelAr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Payment / BaridiMob Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Instructions BaridiMob & Références de Virement
                </label>
                <textarea
                  rows={2}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="Ex: Mentionner impérativement le numéro de facture en référence du virement BaridiMob."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                <div className="mt-2 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Suggestions rapides :
                  </span>
                  {PAYMENT_INSTRUCTION_SUGGESTIONS.slice(0, 2).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPaymentInstructions(sug)}
                      className="block text-[11px] text-left text-violet-700 hover:text-violet-900 bg-violet-50/50 hover:bg-violet-100/60 p-1.5 rounded-lg transition-colors cursor-pointer w-full leading-tight"
                    >
                      &quot;{sug}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save reminder */}
          <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50/80">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Modifications réactives appliquées en direct.
              </span>
              <button
                type="button"
                onClick={handleSaveDesign}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 transition cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live WYSIWYG Real-Time Document Canvas */}
        <div className="flex-1 bg-slate-200/70 min-h-[calc(100vh-7.5rem)] flex flex-col overflow-y-auto">
          {/* Canvas Floating Topbar */}
          <div className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Document Type Selector Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { key: "INVOICE", label: "Facture (FAC)", icon: FileText },
                    { key: "QUOTE", label: "Devis (DEV)", icon: FileSpreadsheet },
                    { key: "CREDIT_NOTE", label: "Avoir (AVR)", icon: RotateCcw },
                    { key: "RECEIPT", label: "Quittance (REC)", icon: CreditCard },
                  ] as const
                ).map((doc) => {
                  const isSelected = selectedDocType === doc.key;
                  const Icon = doc.icon;
                  return (
                    <button
                      key={doc.key}
                      type="button"
                      onClick={() => setSelectedDocType(doc.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white text-violet-700 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{doc.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Language Switcher & Zoom */}
              <div className="flex items-center gap-2">
                {/* Language (FR / AR) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewLang("fr")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      previewLang === "fr"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang("ar")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      previewLang === "ar"
                        ? "bg-white text-slate-900 shadow-xs font-arabic"
                        : "text-slate-500 hover:text-slate-800 font-arabic"
                    }`}
                  >
                    🇩🇿 العربية
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(65, prev - 10))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-md transition"
                    title="Zoom arrière"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono font-semibold text-slate-700">
                    {zoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(130, prev + 10))}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded-md transition"
                    title="Zoom avant"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Parity Guarantee Callout Bar */}
          <div className="no-print mx-4 sm:mx-8 mt-4 p-3 bg-violet-50/80 border border-violet-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-violet-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
              <span>
                <strong>Parité de Rendu 100% Garantie :</strong> Ce que vous voyez ici correspond
                exactement à l&apos;impression papier A4 (<code>window.print()</code>) et au PDF
                vectoriel généré par le moteur PDFKit.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSpecimenPdf}
              disabled={isDownloadingPdf}
              className="hidden md:inline-flex items-center gap-1 font-bold text-violet-700 hover:text-violet-900 underline shrink-0 cursor-pointer"
            >
              <span>Vérifier en PDF</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Realistic A4 Drafting Board Canvas */}
          <div className="flex-1 p-4 sm:p-8 flex justify-center items-start overflow-x-auto">
            <div
              className="origin-top transition-transform duration-150 w-full max-w-[850px] shadow-2xl rounded-2xl bg-white"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
              }}
            >
              {/* Dynamic Paper Rendering */}
              {selectedDocType === "INVOICE" && (
                <BilingualInvoicePaper
                  invoice={specimenInvoice}
                  seller={liveSeller}
                  client={SPECIMEN_CLIENT}
                  defaultLanguage={previewLang}
                  hideToolbar={true}
                />
              )}

              {selectedDocType === "QUOTE" && (
                <BilingualQuotePaper
                  quote={specimenQuote}
                  seller={liveSeller}
                  client={SPECIMEN_CLIENT}
                  defaultLanguage={previewLang}
                  hideToolbar={true}
                />
              )}

              {selectedDocType === "CREDIT_NOTE" && (
                <BilingualCreditNotePaper
                  creditNote={specimenCreditNote}
                  seller={liveSeller}
                  client={SPECIMEN_CLIENT}
                  defaultLanguage={previewLang}
                  hideToolbar={true}
                />
              )}

              {selectedDocType === "RECEIPT" && (
                <BilingualPaymentReceiptPaper
                  receipt={specimenReceipt}
                  seller={liveSeller}
                  client={SPECIMEN_CLIENT}
                  defaultLanguage={previewLang}
                  hideToolbar={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveDesignStudio;
