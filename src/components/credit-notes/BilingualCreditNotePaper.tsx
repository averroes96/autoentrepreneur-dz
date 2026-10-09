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
import { Printer, Globe, RotateCcw } from "lucide-react";

interface BilingualCreditNotePaperProps {
  creditNote: {
    id: string;
    creditNoteNumber: string | null;
    issueDate: Date | string;
    refundedAt?: Date | string | null;
    status: string;
    refundStatus: string;
    total: number;
    currency?: string;
    exchangeRate?: number | null;
    totalDzd?: number | null;
    reason: string;
    notes?: string | null;
    originalInvoice: {
      invoiceNumber: string | null;
      issueDate: Date | string;
      total: number;
    };
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

export function BilingualCreditNotePaper({
  creditNote,
  seller,
  client,
  defaultLanguage = "fr",
}: BilingualCreditNotePaperProps) {
  const [lang, setLang] = useState<"fr" | "ar">(defaultLanguage);
  const isArabic = lang === "ar";
  const ar = ARABIC_NOMENCLATURE;

  const creditCurrency = creditNote.currency || "DZD";
  const isForeign = creditCurrency !== "DZD";
  const exchangeRate = creditNote.exchangeRate || getCurrencyDef(creditCurrency).defaultRate;
  const totalDzd = creditNote.totalDzd || calculateDzdEquivalent(creditNote.total, creditCurrency, exchangeRate);

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

      {/* Credit Note Paper Card */}
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className={`bg-white p-8 sm:p-12 rounded-2xl border border-rose-200/80 shadow-md space-y-8 print:shadow-none print:border-none print:p-0 ${
          isArabic ? "font-arabic" : ""
        }`}
      >
        {isArabic && (
          <div className="text-center pb-6 border-b border-slate-100 space-y-1">
            <h3 className="text-sm font-bold text-slate-900 tracking-wide">
              {ar.republicTitle}
            </h3>
            <p className="text-xs font-semibold text-rose-800">
              {ar.autoEntrepreneurRegime}
            </p>
          </div>
        )}

        {/* Main Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-8 border-b-2 border-slate-100 gap-4">
          <div>
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight flex items-center gap-2">
              <RotateCcw className="w-7 h-7 text-rose-600 inline" />
              <span>{isArabic ? ar.creditNoteTitle : "FACTURE D'AVOIR"}</span>
            </span>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mt-1">
              {isArabic
                ? "سند إنقاص وتعديل محاسبي — معفى من الرسم على القيمة المضافة (TVA)"
                : "Rectification Comptable — Régime Auto-Entrepreneur (Loi 22-23)"}
            </p>
          </div>

          <div className={`space-y-1 text-xs ${isArabic ? "text-right sm:text-left" : "text-left sm:text-right"}`}>
            <div>
              <span className="text-slate-400 font-medium">
                {isArabic ? `${ar.creditNoteNumberLabel} : ` : "N° d'avoir : "}
              </span>
              <span className="font-bold text-rose-700 text-sm font-mono">
                {creditNote.creditNoteNumber || (isArabic ? ar.draftBadge : "BROUILLON")}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">
                {isArabic ? `${ar.issueDateLabel} : ` : "Date d'émission : "}
              </span>
              <span className="font-semibold text-slate-900">
                {isArabic
                  ? formatArabicDate(creditNote.issueDate)
                  : new Date(creditNote.issueDate).toLocaleDateString("fr-DZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">
                {isArabic ? `${ar.linkedInvoiceLabel} : ` : "Facture rattachée : "}
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {creditNote.originalInvoice.invoiceNumber || "Facture"}
              </span>
            </div>
          </div>
        </div>

        {/* Seller and Client Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seller */}
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
                  {isArabic ? ar.addressLabel : "Adresse"} :
                </strong>{" "}
                {seller.address || "—"}
              </p>
            </div>
          </div>

          {/* Client */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isArabic ? ar.clientTitle : "Client (Bénéficiaire de l'avoir)"}
            </span>
            <h2 className="text-base font-bold text-slate-900">{client.name}</h2>
            <div className="text-xs text-slate-600 space-y-1">
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

        {/* Reason Box */}
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <strong className="block font-semibold">
            {isArabic ? "سبب التحرير والإنقاص المحاسبي :" : "Motif de l'avoir :"}
          </strong>
          <p>{creditNote.reason}</p>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className={`py-3 px-5 ${isArabic ? "text-right" : "text-left"}`}>
                  {isArabic ? ar.descriptionHeader : "Désignation des prestations annulées ou remisées"}
                </th>
                <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                  {isArabic ? ar.quantityHeader : "Quantité"}
                </th>
                <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                  {isArabic ? `${ar.unitPriceHeader} (${creditCurrency})` : `Prix Unitaire (${creditCurrency})`}
                </th>
                <th className={`py-3 px-5 ${isArabic ? "text-left" : "text-right"}`}>
                  {isArabic ? `${ar.totalHeader} (${creditCurrency})` : `Montant à Déduire (${creditCurrency})`}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {creditNote.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className={`py-3.5 px-5 font-medium text-slate-900 ${isArabic ? "text-right" : "text-left"}`}>
                    {item.description}
                  </td>
                  <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                    {item.quantity}
                  </td>
                  <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-mono`}>
                    {formatCurrencyAmount(item.unitPrice, creditCurrency, lang)}
                  </td>
                  <td className={`py-3.5 px-5 ${isArabic ? "text-left" : "text-right"} font-bold text-rose-700 font-mono`}>
                    - {formatCurrencyAmount(item.totalPrice, creditCurrency, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className={`flex flex-col ${isArabic ? "items-start" : "items-end"}`}>
          <div className="w-full sm:w-80 p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-rose-900">
              <span>{isArabic ? "المبلغ الإجمالي للإنقاص :" : "Total à déduire :"}</span>
              <span className="font-semibold text-rose-800 font-mono">
                - {formatCurrencyAmount(creditNote.total, creditCurrency, lang)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-rose-800">
              <span>{isArabic ? ar.vatRateLabel : "Taux de TVA :"}</span>
              <span className="font-semibold text-emerald-700">0% (معفى)</span>
            </div>
            <div className="pt-3 border-t-2 border-rose-200 flex justify-between items-center">
              <span className="text-xs font-bold text-rose-950 uppercase">
                {isArabic ? "المبلغ الصافي المسترد :" : "Net à rembourser :"}
              </span>
              <span className="text-lg font-extrabold text-rose-700 font-mono">
                - {formatCurrencyAmount(creditNote.total, creditCurrency, lang)}
              </span>
            </div>

            {/* Foreign Currency Conversion & Statutory Notice */}
            {isForeign && (
              <div className="pt-2.5 border-t border-rose-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-rose-800 text-[11px]">
                  <span>{isArabic ? "سعر الصرف (بنك الجزائر) :" : "Cours (Banque d'Algérie) :"}</span>
                  <span className="font-semibold text-rose-900 font-mono">
                    1 {creditCurrency} = {exchangeRate.toFixed(2)} DZD
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-900 bg-rose-100/70 p-2 rounded-lg border border-rose-300">
                  <span className="font-bold text-rose-950 text-[11px]">
                    {isArabic ? "المقابل الجبائي (IFU) :" : "Contre-valeur (IFU) :"}
                  </span>
                  <span className="font-extrabold text-rose-900 font-mono">
                    - {formatCurrencyAmount(totalDzd, "DZD", lang)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
          <span className="text-slate-500 font-semibold block text-[11px] mb-1">
            {isArabic ? ar.amountInWordsPrefix : "Montant d'avoir arrêté en toutes lettres :"}
          </span>
          <p className="text-slate-900 font-bold leading-relaxed">
            {getAmountInWordsWithCurrency(creditNote.total, creditCurrency, lang)}
          </p>
          {isForeign && (
            <p className="text-rose-800 text-[11px] font-semibold mt-1">
              {getExchangeRateNotice(creditCurrency, exchangeRate, totalDzd, lang)}
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
            « {ar.vatExemptionClause} »
          </p>
        </div>

        {/* Official Statutory Footer */}
        <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p>{isArabic ? ar.legalFooterClause : "Facture d'avoir établie conformément à la Loi 22-23."}</p>
        </div>
      </div>
    </div>
  );
}

export default BilingualCreditNotePaper;
