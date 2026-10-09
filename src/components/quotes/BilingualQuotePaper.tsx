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
import { Printer, Globe } from "lucide-react";

interface BilingualQuotePaperProps {
  quote: {
    id: string;
    quoteNumber: string | null;
    issueDate: Date | string;
    validUntil?: Date | string | null;
    status: string;
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

export function BilingualQuotePaper({
  quote,
  seller,
  client,
  defaultLanguage = "fr",
}: BilingualQuotePaperProps) {
  const [lang, setLang] = useState<"fr" | "ar">(defaultLanguage);
  const isArabic = lang === "ar";
  const ar = ARABIC_NOMENCLATURE;

  const quoteCurrency = quote.currency || "DZD";
  const isForeign = quoteCurrency !== "DZD";
  const exchangeRate = quote.exchangeRate || getCurrencyDef(quoteCurrency).defaultRate;
  const totalDzd = quote.totalDzd || calculateDzdEquivalent(quote.total, quoteCurrency, exchangeRate);

  React.useEffect(() => {
    const handleGlobalLang = (e: any) => {
      if (e.detail?.lang === "ar" || e.detail?.lang === "fr") {
        setLang(e.detail.lang);
      }
    };
    window.addEventListener("moukawil:language-change", handleGlobalLang);
    return () => window.removeEventListener("moukawil:language-change", handleGlobalLang);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Language Switcher & Print Toolbar */}
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

      {/* Quote Paper Card */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md space-y-8 print:shadow-none print:border-none print:p-0 ${
          isArabic ? "font-arabic" : ""
        }`}
      >
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
              {isArabic ? ar.quoteTitle : "DEVIS COMMERCIAL"}
            </span>
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">
              {isArabic
                ? "عرض أسعار تقديري — معفى من الرسم على القيمة المضافة (TVA)"
                : "Proposition Tarifaire — Régime Auto-Entrepreneur (Loi 22-23)"}
            </p>
          </div>

          <div className={`space-y-1 text-xs ${isArabic ? "text-right sm:text-left" : "text-left sm:text-right"}`}>
            <div>
              <span className="text-slate-400 font-medium">
                {isArabic ? `${ar.quoteNumberLabel} : ` : "N° de devis : "}
              </span>
              <span className="font-bold text-slate-900 text-sm font-mono">
                {quote.quoteNumber || (isArabic ? ar.draftBadge : "BROUILLON")}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">
                {isArabic ? `${ar.issueDateLabel} : ` : "Date d'émission : "}
              </span>
              <span className="font-semibold text-slate-900">
                {isArabic
                  ? formatArabicDate(quote.issueDate)
                  : new Date(quote.issueDate).toLocaleDateString("fr-DZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
            </div>
            {quote.validUntil && (
              <div>
                <span className="text-slate-400 font-medium">
                  {isArabic ? `${ar.validUntilLabel} : ` : "Valable jusqu'au : "}
                </span>
                <span className="font-semibold text-emerald-700">
                  {isArabic
                    ? formatArabicDate(quote.validUntil)
                    : new Date(quote.validUntil).toLocaleDateString("fr-DZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Seller and Client Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seller */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isArabic ? ar.sellerTitle : "Prestataire (Auto-Entrepreneur)"}
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
                {seller.activityLabel || "Prestations de services"}
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
            </div>
          </div>

          {/* Client */}
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
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              {quote.showDetailedItems ? (
                <tr>
                  <th className={`py-3 px-5 ${isArabic ? "text-right" : "text-left"}`}>
                    {isArabic ? ar.descriptionHeader : "Désignation des prestations"}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? ar.quantityHeader : "Quantité"}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? `${ar.unitPriceHeader} (${quoteCurrency})` : `Prix Unitaire (${quoteCurrency})`}
                  </th>
                  <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? `${ar.totalHeader} (${quoteCurrency})` : `Montant Total (${quoteCurrency})`}
                  </th>
                </tr>
              ) : (
                <tr>
                  <th className={`py-3.5 px-6 ${isArabic ? "text-right" : "text-left"}`}>
                    {isArabic ? ar.descriptionHeader : "Désignation de la prestation / tâche"}
                  </th>
                  <th className={`py-3.5 px-6 ${isArabic ? "text-left" : "text-right"}`}>
                    {isArabic ? `${ar.totalHeader} (${quoteCurrency})` : `Montant (${quoteCurrency})`}
                  </th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {quote.lineItems.map((item) => (
                <tr key={item.id}>
                  {quote.showDetailedItems ? (
                    <>
                      <td className={`py-3.5 px-5 font-medium text-slate-900 ${isArabic ? "text-right" : "text-left"}`}>
                        {item.description}
                      </td>
                      <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                        {item.quantity}
                      </td>
                      <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                        {formatCurrencyAmount(item.unitPrice, quoteCurrency, lang)}
                      </td>
                      <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-bold text-slate-900 font-mono`}>
                        {formatCurrencyAmount(item.totalPrice, quoteCurrency, lang)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={`py-4 px-6 font-medium text-slate-900 text-sm ${isArabic ? "text-right" : "text-left"}`}>
                        {item.description}
                      </td>
                      <td className={`py-4 px-6 ${isArabic ? "text-left" : "text-right"} font-bold text-slate-900 text-sm font-mono`}>
                        {formatCurrencyAmount(item.totalPrice, quoteCurrency, lang)}
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
                {formatCurrencyAmount(quote.total, quoteCurrency, lang)}
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
                {isArabic ? ar.netPayableLabel : "Total Net Estimé :"}
              </span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
                {formatCurrencyAmount(quote.total, quoteCurrency, lang)}
              </span>
            </div>

            {/* Foreign Currency Conversion & Statutory Notice */}
            {isForeign && (
              <div className="pt-2.5 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>{isArabic ? "سعر الصرف (بنك الجزائر) :" : "Cours (Banque d'Algérie) :"}</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    1 {quoteCurrency} = {exchangeRate.toFixed(2)} DZD
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
            {isArabic ? ar.amountInWordsPrefix : "Montant estimé en toutes lettres :"}
          </span>
          <p className="text-slate-900 font-bold leading-relaxed">
            {getAmountInWordsWithCurrency(quote.total, quoteCurrency, lang)}
          </p>
          {isForeign && (
            <p className="text-emerald-800 text-[11px] font-semibold mt-1">
              {getExchangeRateNotice(quoteCurrency, exchangeRate, totalDzd, lang)}
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
            « {isArabic ? ar.vatExemptionClause : quote.vatExemptionNote} »
          </p>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
              {isArabic ? ar.notesTitle : "Conditions commerciales & Remarques :"}
            </span>
            <p className="whitespace-pre-line">{quote.notes}</p>
          </div>
        )}

        {/* Signature & Seal Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
          <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center min-h-[120px] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isArabic ? "توقيع وموافقة العميل (مسبوقة بعبارة قرأت ووافقت)" : "Bon pour accord (Signature & Cachet du client)"}
            </span>
            <span className="text-[10px] text-slate-400 italic">
              {isArabic ? "التاريخ : ...................." : "Date : ...................."}
            </span>
          </div>

          <div className="border border-dashed border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 text-center min-h-[120px] flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">
              {isArabic ? "توقيع وخاتم المقاول الذاتي" : "Signature & Cachet du Prestataire"}
            </span>
            <div className="text-[10px] text-slate-500">
              <p>{seller.fullName}</p>
              <p>RNAE: {seller.rnaeNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BilingualQuotePaper;
