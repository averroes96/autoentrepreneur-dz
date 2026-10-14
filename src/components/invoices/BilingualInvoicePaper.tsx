"use client";

import React, { useState } from "react";
import { formatDZD } from "@/lib/tax";
import {
  ARABIC_NOMENCLATURE,
  formatDZD_AR,
  formatArabicDate,
  getArabicAmountInWords,
} from "@/lib/arabicNomenclature";
import {
  formatCurrencyAmount,
  getCurrencyDef,
  calculateDzdEquivalent,
  getAmountInWordsWithCurrency,
  getExchangeRateNotice,
} from "@/lib/currencies";
import {
  Printer,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Building,
  User,
  Calendar,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Copy,
  Check,
  Smartphone,
  Landmark,
  CreditCard,
} from "lucide-react";
import {
  getBrandPalette,
  getTemplateStyle,
} from "@/lib/invoiceDesign";
import {
  formatRip,
  formatIban,
  PAYMENT_TERMS_CONFIG,
} from "@/lib/banking";
import { OfficialSeal } from "@/components/common/OfficialSeal";

interface BilingualInvoicePaperProps {
  invoice: {
    id: string;
    invoiceNumber: string | null;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    paymentTerms?: string | null;
    issuedAt?: Date | string | null;
    status: string;
    paymentStatus: string;
    total: number;
    currency?: string;
    exchangeRate?: number | null;
    totalDzd?: number | null;
    vatExemptionNote: string;
    notes?: string | null;
    showDetailedItems?: boolean;
    showBankDetails?: boolean;
    showStampSignature?: boolean | null;
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  seller: {
    fullName?: string | null;
    rnaeNumber?: string | null;
    nif?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    activityCode?: string | null;
    activityLabel?: string | null;
    logoUrl?: string | null;
    logoPosition?: string | null;
    brandColor?: string | null;
    templateStyle?: string | null;
    showBankDetails?: boolean | null;
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
  client: {
    name: string;
    clientType: string;
    address?: string | null;
    nif?: string | null;
    nis?: string | null;
    rc?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  defaultLanguage?: "fr" | "ar";
  hideToolbar?: boolean;
}

export function BilingualInvoicePaper({
  invoice,
  seller,
  client,
  defaultLanguage = "fr",
  hideToolbar = false,
}: BilingualInvoicePaperProps) {
  const [lang, setLang] = useState<"fr" | "ar">(defaultLanguage);

  React.useEffect(() => {
    if (defaultLanguage) {
      setLang(defaultLanguage);
    }
  }, [defaultLanguage]);
  const isArabic = lang === "ar";
  const ar = ARABIC_NOMENCLATURE;

  const palette = getBrandPalette(seller.brandColor);
  const template = getTemplateStyle(seller.templateStyle);
  const logoPos = (seller.logoPosition?.toUpperCase() || "LEFT") as "LEFT" | "CENTER" | "RIGHT";

  const invoiceCurrency = invoice.currency || "DZD";
  const isForeign = invoiceCurrency !== "DZD";
  const exchangeRate = invoice.exchangeRate || getCurrencyDef(invoiceCurrency).defaultRate;
  const totalDzd = invoice.totalDzd || calculateDzdEquivalent(invoice.total, invoiceCurrency, exchangeRate);

  React.useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e.detail?.lang === "ar" || e.detail?.lang === "fr") {
        setLang(e.detail.lang);
      }
    };
    window.addEventListener("autoentrepreneur:language-change", handleGlobalLang);
    window.addEventListener("moukawil:language-change", handleGlobalLang);
    return () => {
      window.removeEventListener("autoentrepreneur:language-change", handleGlobalLang);
      window.removeEventListener("moukawil:language-change", handleGlobalLang);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const [copiedRip, setCopiedRip] = useState(false);
  const handleCopyRip = (text: string) => {
    try {
      navigator.clipboard.writeText(text.replace(/\s/g, ""));
      setCopiedRip(true);
      setTimeout(() => setCopiedRip(false), 2000);
    } catch (e) {
      console.warn("Failed to copy RIP:", e);
    }
  };

  const showBankSection =
    invoice.showBankDetails !== false &&
    seller.showBankDetails !== false;

  const hasConfiguredBank = Boolean(
    seller.bankRib ||
    seller.ccpNumber ||
    (seller.bankName && !seller.bankName.toLowerCase().includes("algérie poste") && !seller.bankName.toLowerCase().includes("banque")) ||
    seller.paymentInstructions
  );

  const hasPaymentDetails = showBankSection && Boolean(
    hasConfiguredBank ||
    (invoice.showBankDetails === true && (seller.bankRib || seller.bankName || seller.ccpNumber))
  );

  const showStamp =
    invoice.showStampSignature !== undefined && invoice.showStampSignature !== null
      ? Boolean(invoice.showStampSignature)
      : seller.showStampSignature !== false;

  const isPostalOrBaridi = Boolean(
    seller.bankName?.toLowerCase().includes("poste") ||
    seller.bankName?.toLowerCase().includes("ccp") ||
    seller.bankName?.toLowerCase().includes("baridi") ||
    seller.ccpNumber ||
    seller.bankRib?.replace(/\s/g, "").startsWith("007")
  );

  const termsKey = invoice.paymentTerms || seller.paymentTerms || "UPON_RECEIPT";
  const termsDef = PAYMENT_TERMS_CONFIG[termsKey] || PAYMENT_TERMS_CONFIG.UPON_RECEIPT;

  return (
    <div className="space-y-4">
      {/* Language Switcher & Print Toolbar (Hidden on print) */}
      {!hideToolbar && (
        <div className="no-print flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">
            {isArabic ? "لغة الوثيقة :" : "Langue du document :"}
          </span>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLang("fr")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                !isArabic
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🇫🇷 Français
            </button>
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                isArabic
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🇩🇿 العربية (رسمية)
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isArabic ? "طباعة الوثيقة (A4)" : "Imprimer le document (A4)"}</span>
        </button>
      </div>
      )}

      {/* Invoice Paper Card (WYSIWYG layout conforming to JORADP & Loi 22-23) */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden print:shadow-none print:border-none ${
          isArabic ? "font-arabic" : ""
        }`}
      >
        {/* Top Decorative Brand Accent Strip */}
        {template.key === "MODERN" && (
          <div
            className="h-2.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${palette.hex}, ${palette.darkHex})`,
            }}
          />
        )}
        {template.key === "CLASSIC" && (
          <div
            className="h-2 w-full"
            style={{ backgroundColor: palette.darkHex }}
          />
        )}
        {template.key === "MINIMALIST" && (
          <div
            className="h-0.5 w-full"
            style={{ backgroundColor: palette.borderHex }}
          />
        )}
        {template.key === "COMPACT" && (
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: palette.hex }}
          />
        )}

        <div className="p-8 sm:p-12 min-h-[1050px] flex flex-col justify-between print:min-h-0 print:p-0">
          <div className="space-y-8 flex-1">
            {/* Top Algerian Republic Header in Arabic mode */}
            {isArabic && (
              <div className="text-center pb-6 border-b border-slate-100 space-y-1">
                <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                  {ar.republicTitle}
                </h3>
                <p className="text-xs font-semibold" style={{ color: palette.darkHex }}>
                  {ar.autoEntrepreneurRegime}
                </p>
              </div>
            )}

            {/* Main Document Header */}
            {logoPos === "CENTER" ? (
              <div className="flex flex-col items-center text-center pb-8 border-b-2 border-slate-100 gap-3">
                {seller.logoUrl && (
                  <div className="flex justify-center pb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={seller.logoUrl}
                      alt={seller.fullName || "Logo"}
                      className="max-h-16 max-w-[220px] object-contain"
                    />
                  </div>
                )}
                <div>
                  <span
                    className="text-3xl font-extrabold tracking-tight block"
                    style={{ color: palette.darkHex }}
                  >
                    {isArabic ? ar.invoiceTitle : "FACTURE"}
                  </span>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mt-1"
                    style={{ color: palette.hex }}
                  >
                    {isArabic
                      ? "معفاة من الرسم على القيمة المضافة (TVA)"
                      : "Régime de l'Auto-Entrepreneur — Algérie (Loi 22-23)"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">
                      {isArabic ? `${ar.invoiceNumberLabel} : ` : "N° de facture : "}
                    </span>
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      {invoice.invoiceNumber || (isArabic ? ar.draftBadge : "BROUILLON")}
                    </span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div>
                    <span className="text-slate-400 font-medium">
                      {isArabic ? `${ar.issueDateLabel} : ` : "Date d'émission : "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {isArabic
                        ? formatArabicDate(invoice.issueDate)
                        : new Date(invoice.issueDate).toLocaleDateString("fr-DZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                  {invoice.issuedAt && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div>
                        <span className="text-slate-400 font-medium">
                          {isArabic ? `${ar.timestampLabel} : ` : "Horodatage : "}
                        </span>
                        <span className="text-slate-600 font-mono">
                          {new Date(invoice.issuedAt).toLocaleTimeString("fr-DZ")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
                <div className="flex items-center gap-4">
                  {seller.logoUrl && logoPos === "LEFT" && (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={seller.logoUrl}
                        alt={seller.fullName || "Logo"}
                        className="max-h-14 max-w-[180px] object-contain"
                      />
                    </div>
                  )}

                  <div>
                    <span
                      className="text-3xl font-extrabold tracking-tight"
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? ar.invoiceTitle : "FACTURE"}
                    </span>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mt-1"
                      style={{ color: palette.hex }}
                    >
                      {isArabic
                        ? "معفاة من الرسم على القيمة المضافة (TVA)"
                        : "Régime de l'Auto-Entrepreneur — Algérie (Loi 22-23)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`space-y-1 text-xs ${isArabic ? "text-right sm:text-left" : "text-left sm:text-right"}`}>
                    <div>
                      <span className="text-slate-400 font-medium">
                        {isArabic ? `${ar.invoiceNumberLabel} : ` : "N° de facture : "}
                      </span>
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {invoice.invoiceNumber || (isArabic ? ar.draftBadge : "BROUILLON")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">
                        {isArabic ? `${ar.issueDateLabel} : ` : "Date d'émission : "}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {isArabic
                          ? formatArabicDate(invoice.issueDate)
                          : new Date(invoice.issueDate).toLocaleDateString("fr-DZ", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                      </span>
                    </div>
                    {invoice.issuedAt && (
                      <div>
                        <span className="text-slate-400 font-medium">
                          {isArabic ? `${ar.timestampLabel} : ` : "Horodatage officiel : "}
                        </span>
                        <span className="text-slate-600 font-mono">
                          {new Date(invoice.issuedAt).toLocaleTimeString("fr-DZ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {seller.logoUrl && logoPos === "RIGHT" && (
                    <div className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={seller.logoUrl}
                        alt={seller.fullName || "Logo"}
                        className="max-h-14 max-w-[180px] object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Seller and Client Blocks (RTL aware) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Auto-entrepreneur (Seller) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isArabic ? ar.sellerTitle : "Émetteur (Auto-Entrepreneur)"}
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {seller.fullName || "Auto-Entrepreneur"}
              </h2>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.rnaeNumberLabel : "N° RNAE"} :
                  </strong>{" "}
                  <span className="font-mono">{seller.rnaeNumber || "—"}</span>
                </p>
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.nifLabel : "NIF"} :
                  </strong>{" "}
                  <span className="font-mono">{seller.nif || "—"}</span>
                </p>
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.activityCodeLabel : "Activité"} :
                  </strong>{" "}
                  {seller.activityCode ? `[${seller.activityCode}] ` : ""}
                  {seller.activityLabel || (isArabic ? "خدمات رقمية ومعلوماتية" : "Prestations de services")}
                </p>
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.addressLabel : "Adresse"} :
                  </strong>{" "}
                  {seller.address || "—"}
                </p>
                {seller.phone && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.phoneLabel : "Tél"} :
                    </strong>{" "}
                    <span dir="ltr">{seller.phone}</span>
                  </p>
                )}
                {seller.email && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.emailLabel : "Email"} :
                    </strong>{" "}
                    <span dir="ltr">{seller.email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Client Block */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isArabic ? ar.clientTitle : "Client (Destinataire)"}
              </span>
              <h2 className="text-base font-bold text-slate-900">{client.name}</h2>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.clientTypeLabel : "Type"} :
                  </strong>{" "}
                  {client.clientType === "PROFESSIONAL"
                    ? isArabic
                      ? ar.clientTypeProfessional
                      : "Professionnel / Entreprise"
                    : isArabic
                    ? ar.clientTypeIndividual
                    : "Particulier"}
                </p>
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? ar.addressLabel : "Adresse"} :
                  </strong>{" "}
                  {client.address || "—"}
                </p>
                {client.nif && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.nifLabel : "NIF"} :
                    </strong>{" "}
                    <span className="font-mono">{client.nif}</span>
                  </p>
                )}
                {client.nis && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.nisLabel : "NIS"} :
                    </strong>{" "}
                    <span className="font-mono">{client.nis}</span>
                  </p>
                )}
                {client.rc && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.rcLabel : "RC"} :
                    </strong>{" "}
                    <span className="font-mono">{client.rc}</span>
                  </p>
                )}
                {client.email && (
                  <p>
                    <strong className="text-slate-700">
                      {isArabic ? ar.emailLabel : "Email"} :
                    </strong>{" "}
                    <span dir="ltr">{client.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead
                style={{
                  backgroundColor:
                    template.key === "MINIMALIST" ? "#ffffff" : palette.lightBgHex,
                  borderBottom: `2px solid ${palette.borderHex}`,
                }}
                className="text-slate-500 font-semibold uppercase tracking-wider"
              >
                {invoice.showDetailedItems ? (
                  <tr>
                    <th
                      className={`py-3 px-5 ${isArabic ? "text-right" : "text-left"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? ar.descriptionHeader : "Désignation des prestations"}
                    </th>
                    <th
                      className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? ar.quantityHeader : "Quantité"}
                    </th>
                    <th
                      className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? `${ar.unitPriceHeader} (${invoiceCurrency})` : `Prix Unitaire (${invoiceCurrency})`}
                    </th>
                    <th
                      className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? `${ar.totalHeader} (${invoiceCurrency})` : `Montant Total (${invoiceCurrency})`}
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th
                      className={`py-3.5 px-6 ${isArabic ? "text-right" : "text-left"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? ar.descriptionHeader : "Désignation de la prestation / tâche"}
                    </th>
                    <th
                      className={`py-3.5 px-6 ${isArabic ? "text-left" : "text-right"}`}
                      style={{ color: palette.darkHex }}
                    >
                      {isArabic ? `${ar.totalHeader} (${invoiceCurrency})` : `Montant (${invoiceCurrency})`}
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id}>
                    {invoice.showDetailedItems ? (
                      <>
                        <td className={`py-3.5 px-5 font-medium text-slate-900 ${isArabic ? "text-right" : "text-left"}`}>
                          {item.description}
                        </td>
                        <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                          {item.quantity}
                        </td>
                        <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                          {formatCurrencyAmount(item.unitPrice, invoiceCurrency, lang)}
                        </td>
                        <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-bold text-slate-900 font-mono`}>
                          {formatCurrencyAmount(item.totalPrice, invoiceCurrency, lang)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={`py-4 px-6 font-medium text-slate-900 text-sm ${isArabic ? "text-right" : "text-left"}`}>
                          {item.description}
                        </td>
                        <td className={`py-4 px-6 ${isArabic ? "text-left" : "text-right"} font-bold text-slate-900 text-sm font-mono`}>
                          {formatCurrencyAmount(item.totalPrice, invoiceCurrency, lang)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className={`flex flex-col ${isArabic ? "items-start" : "items-end"}`}>
            <div className="w-full sm:w-80 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>{isArabic ? ar.totalServicesLabel : "Total des services :"}</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatCurrencyAmount(invoice.total, invoiceCurrency, lang)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>{isArabic ? ar.vatRateLabel : "Taux de TVA :"}</span>
                <span className="font-semibold" style={{ color: palette.hex }}>
                  {isArabic ? ar.vatExemptValue : "0% (Non applicable)"}
                </span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  {isArabic ? ar.netPayableLabel : "Total Net à Payer :"}
                </span>
                <span
                  className="text-lg font-extrabold font-mono"
                  style={{ color: palette.darkHex }}
                >
                  {formatCurrencyAmount(invoice.total, invoiceCurrency, lang)}
                </span>
              </div>

              {/* Foreign Currency Conversion & Statutory Notice */}
              {isForeign && (
                <div className="pt-2.5 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>{isArabic ? "سعر الصرف (بنك الجزائر) :" : "Cours (Banque d'Algérie) :"}</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      1 {invoiceCurrency} = {exchangeRate.toFixed(2)} DZD
                    </span>
                  </div>
                  <div
                    className="flex justify-between items-center p-2 rounded-lg border"
                    style={{
                      backgroundColor: palette.lightBgHex,
                      borderColor: palette.borderHex,
                    }}
                  >
                    <span className="font-bold text-[11px]" style={{ color: palette.darkHex }}>
                      {isArabic ? "المقابل الجبائي (IFU) :" : "Contre-valeur (IFU) :"}
                    </span>
                    <span className="font-extrabold font-mono" style={{ color: palette.darkHex }}>
                      {formatCurrencyAmount(totalDzd, "DZD", lang)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
            <span className="text-slate-500 font-semibold block text-[11px] mb-1">
              {isArabic ? ar.amountInWordsPrefix : "Montant arrêté en toutes lettres :"}
            </span>
            <p className="text-slate-900 font-bold leading-relaxed">
              {getAmountInWordsWithCurrency(invoice.total, invoiceCurrency, lang)}
            </p>
            {isForeign && (
              <p className="text-[11px] font-semibold mt-1" style={{ color: palette.darkHex }}>
                {getExchangeRateNotice(invoiceCurrency, exchangeRate, totalDzd, lang)}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Section Anchored to Page Bottom */}
        <div className="mt-auto pt-6 space-y-4">
          {/* Payment Coordinates & BaridiMob Block */}
          {hasPaymentDetails && (
            <div
              className="p-5 rounded-2xl border transition-all"
              style={{
                backgroundColor: template.key === "MINIMALIST" ? "#f8fafc" : "#fafafa",
                borderColor: isPostalOrBaridi ? "#fde047" : palette.borderHex,
              }}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isPostalOrBaridi ? "#fef08a" : palette.lightBgHex,
                      color: isPostalOrBaridi ? "#854d0e" : palette.darkHex,
                    }}
                  >
                    {isPostalOrBaridi ? (
                      <Smartphone className="w-4 h-4 text-amber-700" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {isArabic
                        ? "بيانات التسديد، الحساب البريدي / البنكي وبريدي موب"
                        : "Modalités de Règlement & Coordonnées Bancaires / BaridiMob"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isArabic
                        ? "يرجى تسوية المستحقات وفق المعلومات أدناه"
                        : "Règlement par virement postal, bancaire ou application BaridiMob"}
                    </p>
                  </div>
                </div>

                {isPostalOrBaridi && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    ⚡ {isArabic ? "متوافق مع تطبيق بريدي موب" : "Compatible BaridiMob (Algérie Poste)"}
                  </span>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                {/* Bank & Beneficiary */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isArabic ? "المؤسسة المالية / البنك" : "Établissement Financier"}
                  </span>
                  <p className="font-bold text-slate-900">
                    {seller.bankName || (isPostalOrBaridi ? "Algérie Poste (CCP)" : "Banque")}
                  </p>
                  {seller.bankAgency && (
                    <p className="text-[11px] text-slate-600">
                      <span className="font-medium text-slate-500">{isArabic ? "الوكالة :" : "Agence :"}</span> {seller.bankAgency}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600">
                    <span className="font-medium text-slate-500">{isArabic ? "المستفيد :" : "Bénéficiaire :"}</span>{" "}
                    <strong className="text-slate-800">{seller.accountHolder || seller.fullName}</strong>
                  </p>
                </div>

                {/* RIP / CCP Account */}
                <div className="space-y-1 sm:col-span-1 lg:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isArabic ? "رقم التعريف البنكي / البريدي (RIP - 20 رقماً)" : "Relevé d'Identité Postale / Bancaire (RIP - 20 chiffres)"}
                  </span>
                  {seller.bankRib ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        dir="ltr"
                        className="font-mono text-sm font-extrabold tracking-wider px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 select-all shadow-2xs"
                      >
                        {formatRip(seller.bankRib)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyRip(seller.bankRib!)}
                        className="no-print inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Copier le RIP"
                      >
                        {copiedRip ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">{isArabic ? "تم النسخ !" : "Copié !"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isArabic ? "نسخ RIP" : "Copier"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400 font-mono">—</p>
                  )}

                  {isPostalOrBaridi && seller.ccpNumber && (
                    <p className="text-[11px] text-slate-600 pt-0.5">
                      <span className="font-medium text-slate-500">{isArabic ? "حساب CCP :" : "Compte CCP :"}</span>{" "}
                      <span className="font-mono font-bold text-slate-800" dir="ltr">{seller.ccpNumber}</span>
                      {seller.ccpKey && (
                        <>
                          {" "}
                          <span className="font-medium text-slate-500">{isArabic ? "المفتاح :" : "Clé :"}</span>{" "}
                          <span className="font-mono font-bold text-slate-800" dir="ltr">{seller.ccpKey}</span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Payment Terms & Due Date */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isArabic ? "شروط وأجل الدفع" : "Conditions & Échéance"}
                  </span>
                  <p className="font-semibold text-slate-900">
                    {isArabic ? termsDef.labelAr : termsDef.labelFr}
                  </p>
                  {invoice.dueDate && (
                    <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {isArabic ? "تاريخ الاستحقاق : " : "Échéance le : "}
                        {isArabic
                          ? formatArabicDate(invoice.dueDate)
                          : new Date(invoice.dueDate).toLocaleDateString("fr-DZ", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                      </span>
                    </p>
                  )}
                </div>

                {/* International (IBAN / SWIFT) */}
                {(isForeign || seller.bankIban || seller.bankBic) && (
                  <div className="space-y-1 sm:col-span-1 lg:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isArabic ? "التحويل الدولي (IBAN / SWIFT)" : "Virement International (IBAN & SWIFT / BIC)"}
                    </span>
                    <div className="text-[11px] space-y-0.5 text-slate-700">
                      {seller.bankIban && (
                        <p>
                          <span className="text-slate-500 font-medium">IBAN : </span>
                          <span className="font-mono font-bold select-all" dir="ltr">{formatIban(seller.bankIban)}</span>
                        </p>
                      )}
                      {seller.bankBic && (
                        <p>
                          <span className="text-slate-500 font-medium">SWIFT / BIC : </span>
                          <span className="font-mono font-bold select-all" dir="ltr">{seller.bankBic}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Payment Instruction note */}
              {seller.paymentInstructions && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-700 flex items-start gap-1.5">
                  <span className="font-bold text-slate-900 shrink-0">
                    {isArabic ? "ملاحظة الدفع :" : "Consigne de règlement :"}
                  </span>
                  <span className="italic">{seller.paymentInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Row: Legal VAT Exemption (Left) & Dedicated Cadre Cachet & Signature (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div
              className={`${showStamp ? "md:col-span-7" : "md:col-span-12"} p-4 rounded-xl border-l-4 text-xs flex flex-col justify-between`}
              style={{
                backgroundColor: palette.lightBgHex,
                borderLeftColor: palette.hex,
              }}
            >
              <div className="space-y-1">
                <span
                  className="font-bold block uppercase tracking-wider text-[11px]"
                  style={{ color: palette.darkHex }}
                >
                  {isArabic
                    ? "السند القانوني للإعفاء من الرسم على القيمة المضافة :"
                    : "Mention légale d'exonération de TVA :"}
                </span>
                <p className="italic leading-relaxed text-xs" style={{ color: palette.darkHex }}>
                  « {isArabic ? ar.vatExemptionClause : invoice.vatExemptionNote} »
                </p>
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 mt-3">
                {isArabic ? ar.legalFooterClause : "Facture établie conformément à la législation algérienne (Loi 22-23)."}
              </div>
            </div>

            {showStamp && (
              <div className="md:col-span-5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between text-center min-h-[110px]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isArabic ? "إطار مخصص للختم والتوقيع" : "Cadre réservé au Cachet & Signature"}
                </span>
                <div className="py-0.5">
                  <OfficialSeal
                    fullName={seller.fullName}
                    rnaeNumber={seller.rnaeNumber}
                    nif={seller.nif}
                    activityLabel={seller.activityLabel}
                    stampType={seller.stampType}
                    stampUrl={seller.stampUrl}
                    signatureUrl={seller.signatureUrl}
                    inkColor={palette.hex}
                    size="md"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Statutory Registration Footer */}
          <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
            <p>
              {isArabic
                ? `القيد بالسجل الوطني للمقاول الذاتي: ${seller.rnaeNumber || "—"} — الرقم الضريبي: ${seller.nif || "—"}`
                : `Titulaire inscrit au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}.`}
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default BilingualInvoicePaper;
