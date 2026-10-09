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
} from "lucide-react";

interface BilingualInvoicePaperProps {
  invoice: {
    id: string;
    invoiceNumber: string | null;
    issueDate: Date | string;
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
}

export function BilingualInvoicePaper({
  invoice,
  seller,
  client,
  defaultLanguage = "fr",
}: BilingualInvoicePaperProps) {
  const [lang, setLang] = useState<"fr" | "ar">(defaultLanguage);
  const isArabic = lang === "ar";
  const ar = ARABIC_NOMENCLATURE;

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

  return (
    <div className="space-y-4">
      {/* Language Switcher & Print Toolbar (Hidden on print) */}
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

      {/* Invoice Paper Card (WYSIWYG layout conforming to JORADP & Loi 22-23) */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8 print:shadow-none print:border-none print:p-0 ${
          isArabic ? "font-arabic" : ""
        }`}
      >
        {/* Top Algerian Republic Header in Arabic mode */}
        {isArabic && (
          <div className="text-center pb-6 border-b border-slate-100 space-y-1">
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              {ar.republicTitle}
            </h3>
            <p className="text-xs font-semibold text-emerald-800">
              {ar.autoEntrepreneurRegime}
            </p>
          </div>
        )}

        {/* Main Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
          <div>
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isArabic ? ar.invoiceTitle : "FACTURE"}
            </span>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">
              {isArabic
                ? "معفاة من الرسم على القيمة المضافة (TVA)"
                : "Régime de l'Auto-Entrepreneur — Algérie (Loi 22-23)"}
            </p>
          </div>

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
        </div>

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
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              {invoice.showDetailedItems ? (
                <tr>
                  <th className={`py-3 px-5 ${isArabic ? "text-right" : "text-left"}`}>
                    {isArabic ? ar.descriptionHeader : "Désignation des prestations"}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? ar.quantityHeader : "Quantité"}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? `${ar.unitPriceHeader} (${invoiceCurrency})` : `Prix Unitaire (${invoiceCurrency})`}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? `${ar.totalHeader} (${invoiceCurrency})` : `Montant Total (${invoiceCurrency})`}
                  </th>
                </tr>
              ) : (
                <tr>
                  <th className={`py-3.5 px-6 ${isArabic ? "text-right" : "text-left"}`}>
                    {isArabic ? ar.descriptionHeader : "Désignation de la prestation / tâche"}
                  </th>
                  <th className={`py-3.5 px-6 ${isArabic ? "text-left" : "text-right"}`}>
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
              <span className="font-semibold text-emerald-700">
                {isArabic ? ar.vatExemptValue : "0% (Non applicable)"}
              </span>
            </div>
            <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase">
                {isArabic ? ar.netPayableLabel : "Total Net à Payer :"}
              </span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
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
                <div className="flex justify-between items-center text-slate-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="font-bold text-emerald-950 text-[11px]">
                    {isArabic ? "المقابل الجبائي (IFU) :" : "Contre-valeur (IFU) :"}
                  </span>
                  <span className="font-extrabold text-emerald-800 font-mono">
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
            <p className="text-emerald-800 text-[11px] font-semibold mt-1">
              {getExchangeRateNotice(invoiceCurrency, exchangeRate, totalDzd, lang)}
            </p>
          )}
        </div>

        {/* Mandatory VAT Exemption Note */}
        <div className="p-4 rounded-xl bg-emerald-50/80 border-l-4 border-emerald-600 text-xs text-emerald-950 space-y-1">
          <span className="font-bold block text-emerald-900 uppercase tracking-wider text-[11px]">
            {isArabic
              ? "السند القانوني للإعفاء من الرسم على القيمة المضافة :"
              : "Mention légale d'exonération de TVA :"}
          </span>
          <p className="italic text-emerald-800 leading-relaxed">
            « {isArabic ? ar.vatExemptionClause : invoice.vatExemptionNote} »
          </p>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
              {isArabic ? ar.notesTitle : "Modalités de règlement & Remarques :"}
            </span>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Official Visual Seal / Stamp */}
        <div className="flex justify-between items-end pt-4">
          <div className="text-[11px] text-slate-400 space-y-0.5 max-w-md">
            <p>
              {isArabic
                ? ar.legalFooterClause
                : "Facture établie conformément à la législation algérienne régissant le statut de l'auto-entrepreneur (Loi n° 22-23)."}
            </p>
            <p>
              {isArabic
                ? `القيد بالسجل الوطني: ${seller.rnaeNumber || "—"}`
                : `Titulaire inscrit au Registre National de l'Auto-Entrepreneur sous le N° ${seller.rnaeNumber || "—"}.`}
            </p>
          </div>

          {/* Stamp Badge */}
          <div className="hidden sm:flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed border-emerald-600/40 p-2 text-center text-emerald-800 bg-emerald-50/20 rotate-[-6deg] select-none">
            <div className="w-full h-full rounded-full border border-emerald-600/30 flex flex-col items-center justify-center p-1 text-[9px] font-bold leading-tight uppercase">
              <span className="text-[8px] text-emerald-600">الجمهورية الجزائرية</span>
              <span className="text-[10px] text-emerald-700 font-extrabold my-0.5">المقاول الذاتي</span>
              <span className="text-[8px] text-emerald-800">معفى من TVA</span>
              <span className="text-[8px] font-mono text-emerald-600 mt-0.5">Loi 22-23</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BilingualInvoicePaper;
