"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDZD } from "@/lib/tax";
import {
  formatDZD_AR,
  formatArabicDate,
  getArabicAmountInWords,
} from "@/lib/arabicNomenclature";
import { getFrenchAmountInWords } from "@/lib/numberToWordsFr";
import { formatPaymentMethodLabel } from "@/lib/clientLedger";
import {
  Printer,
  Download,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Building,
  User,
  Calendar,
  CreditCard,
  Hash,
  ShieldCheck,
  Globe,
} from "lucide-react";
import {
  getBrandPalette,
  getTemplateStyle,
} from "@/lib/invoiceDesign";

export interface BilingualPaymentReceiptPaperProps {
  receipt: {
    receiptNumber: string;
    invoiceNumber: string;
    invoiceId: string;
    invoiceIssueDate: Date | string;
    paymentDate: Date | string;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    total: number;
    currency?: string;
    notes?: string | null;
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
    bankName?: string | null;
    bankRib?: string | null;
    bankIban?: string | null;
    bankBic?: string | null;
    paymentTerms?: string | null;
    paymentInstructions?: string | null;
    showStampSignature?: boolean | null;
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
}

export function BilingualPaymentReceiptPaper({
  receipt,
  seller,
  client,
  defaultLanguage = "fr",
}: BilingualPaymentReceiptPaperProps) {
  const [lang, setLang] = useState<"fr" | "ar">(defaultLanguage);
  const isArabic = lang === "ar";

  const palette = getBrandPalette(seller.brandColor);
  const template = getTemplateStyle(seller.templateStyle);
  const logoPos = (seller.logoPosition?.toUpperCase() || "LEFT") as "LEFT" | "CENTER" | "RIGHT";

  const handlePrint = () => {
    window.print();
  };

  const formattedPaymentDateFr = new Date(receipt.paymentDate).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedPaymentDateAr = formatArabicDate(receipt.paymentDate);

  const formattedInvoiceDateFr = new Date(receipt.invoiceIssueDate).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedInvoiceDateAr = formatArabicDate(receipt.invoiceIssueDate);

  return (
    <div className="space-y-4">
      {/* Top Toolbar (Hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/${receipt.invoiceId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{isArabic ? "العودة إلى الفاتورة" : "Retour facture"}</span>
          </Link>

          <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          {/* Language Switcher */}
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
              🇩🇿 العربية
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{isArabic ? "طباعة الوصل (A4)" : "Imprimer le reçu"}</span>
          </button>

          <a
            href={`/api/invoices/${receipt.invoiceId}/receipt/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isArabic ? "تحميل PDF" : "Télécharger PDF"}</span>
          </a>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        id="payment-receipt-paper"
        dir={isArabic ? "rtl" : "ltr"}
        className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:p-0 print:border-none print:shadow-none ${
          isArabic ? "font-sans text-right" : "text-left"
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

        <div className="p-8 sm:p-12 space-y-8">
          {/* Centered Logo if position is CENTER */}
          {seller.logoUrl && logoPos === "CENTER" && (
            <div className="flex justify-center pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={seller.logoUrl}
                alt={seller.fullName || "Logo"}
                className="max-h-16 max-w-[220px] object-contain"
              />
            </div>
          )}

          {/* National Legal Header */}
          <div className="text-center border-b border-slate-100 pb-5 space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              الجمهورية الجزائرية الديمقراطية الشعبية
            </p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              République Algérienne Démocratique et Populaire
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: palette.hex }}>
              {isArabic
                ? "الوكالة الوطنية للمقاول الذاتي (ANAE) • القانون رقم 22-23"
                : "Agence Nationale de l'Auto-Entrepreneur (ANAE) • Loi n° 22-23"}
            </p>
          </div>

          {/* Receipt Header & Status Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 pb-6">
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

              <div className="space-y-2">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide"
                  style={{
                    backgroundColor: palette.lightBgHex,
                    borderColor: palette.borderHex,
                    color: palette.darkHex,
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: palette.hex }} />
                  <span>{isArabic ? "وصل خالص ومسدد بالكامل" : "QUITTANCE LIBÉRATOIRE / REÇU DE PAIEMENT"}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {isArabic ? "وصل تسديد مالي" : "Quittance de Paiement"}
                </h1>
                <p className="text-sm font-bold font-mono" style={{ color: palette.hex }}>
                  N° {receipt.receiptNumber}
                </p>
              </div>
            </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600 min-w-[240px]">
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 font-medium">
                {isArabic ? "تاريخ التسديد :" : "Date de paiement :"}
              </span>
              <span className="font-bold text-slate-900">
                {isArabic ? formattedPaymentDateAr : formattedPaymentDateFr}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-500 font-medium">
                {isArabic ? "طريقة الدفع :" : "Mode de règlement :"}
              </span>
              <span className="font-semibold text-slate-900">
                {formatPaymentMethodLabel(receipt.paymentMethod, isArabic ? "ar" : "fr")}
              </span>
            </div>
            {receipt.paymentReference && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-slate-500 font-medium">
                  {isArabic ? "مرجع المعاملة :" : "Réf. transaction :"}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {receipt.paymentReference}
                </span>
              </div>
            )}
              <div className="flex justify-between items-center gap-4 pt-1.5 border-t border-slate-200">
                <span className="text-slate-500 font-medium">
                  {isArabic ? "الفاتورة الأصلية :" : "Facture acquittée :"}
                </span>
                <span className="font-mono font-bold" style={{ color: palette.hex }}>
                  {receipt.invoiceNumber}
                </span>
              </div>
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

        {/* Parties (Seller / Beneficiary & Client / Debtor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller / Émetteur de la quittance */}
          <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              {isArabic ? "المستفيد (المقاول الذاتي)" : "Bénéficiaire (Auto-Entrepreneur)"}
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {seller.fullName || "Auto-Entrepreneur"}
            </h2>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong className="text-slate-700">
                  {isArabic ? "السجل الوطني (RNAE) :" : "N° RNAE :"}
                </strong>{" "}
                <span className="font-mono font-semibold">{seller.rnaeNumber || "—"}</span>
              </p>
              <p>
                <strong className="text-slate-700">
                  {isArabic ? "الرقم الجبائي (NIF) :" : "NIF :"}
                </strong>{" "}
                <span className="font-mono font-semibold">{seller.nif || "—"}</span>
              </p>
              {seller.activityCode && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "رمز النشاط :" : "Activité ANAE :"}
                  </strong>{" "}
                  <span className="font-mono">{seller.activityCode}</span>
                  {seller.activityLabel ? ` - ${seller.activityLabel}` : ""}
                </p>
              )}
              {seller.address && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "العنوان :" : "Adresse :"}
                  </strong>{" "}
                  {seller.address}
                </p>
              )}
              {seller.phone && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "الهاتف :" : "Tél :"}
                  </strong>{" "}
                  <span dir="ltr">{seller.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Client / Payeur */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isArabic ? "الدافع / العميل (المدين)" : "Débiteur / Client (Payeur)"}
            </span>
            <h2 className="text-base font-bold text-slate-900">{client.name}</h2>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong className="text-slate-700">
                  {isArabic ? "الصفة :" : "Type :"}
                </strong>{" "}
                {client.clientType === "PROFESSIONAL"
                  ? isArabic
                    ? "مؤسسة / شخص معنوي"
                    : "Professionnel / Entreprise"
                  : isArabic
                  ? "شخص طبيعي (خاص)"
                  : "Particulier"}
              </p>
              <p>
                <strong className="text-slate-700">
                  {isArabic ? "العنوان :" : "Adresse :"}
                </strong>{" "}
                {client.address || "—"}
              </p>
              {client.nif && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "الرقم الجبائي (NIF) :" : "NIF :"}
                  </strong>{" "}
                  <span className="font-mono">{client.nif}</span>
                </p>
              )}
              {client.rc && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "السجل التجاري (RC) :" : "RC :"}
                  </strong>{" "}
                  <span className="font-mono">{client.rc}</span>
                </p>
              )}
              {client.email && (
                <p>
                  <strong className="text-slate-700">
                    {isArabic ? "البريد الإلكتروني :" : "Email :"}
                  </strong>{" "}
                  <span dir="ltr">{client.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Cross-Reference Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {isArabic ? "موضوع الدفع والتسديد" : "Objet du versement"}
          </span>
          <p className="text-slate-800 leading-relaxed font-medium">
            {isArabic ? (
              <>
                تسديد مالي كلي ونهائي لمستحقات الفاتورة التجارية رقم{" "}
                <strong className="font-mono text-emerald-800">{receipt.invoiceNumber}</strong> المؤرخة في{" "}
                <strong>{formattedInvoiceDateAr}</strong>.
              </>
            ) : (
              <>
                Règlement intégral et libératoire de la facture commerciale N°{" "}
                <strong className="font-mono text-emerald-800">{receipt.invoiceNumber}</strong> émise en date du{" "}
                <strong>{formattedInvoiceDateFr}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Financial Amount Box */}
        <div
          className="p-6 rounded-2xl border-2 space-y-3"
          style={{
            backgroundColor: palette.lightBgHex,
            borderColor: palette.borderHex,
          }}
        >
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3"
            style={{ borderColor: palette.borderHex }}
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: palette.darkHex }}>
              {isArabic ? "المبلغ الإجمالي المسدد بالأرقام :" : "Montant Total Encaissé (Chiffres) :"}
            </span>
            <span
              className="text-2xl sm:text-3xl font-black font-mono"
              style={{ color: palette.darkHex }}
            >
              {isArabic ? formatDZD_AR(receipt.total) : formatDZD(receipt.total)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: palette.hex }}>
              {isArabic ? "المبلغ المقبوض بالأحرف الكاملة :" : "Montant Reçu en Toutes Lettres :"}
            </span>
            <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
              {isArabic
                ? getArabicAmountInWords(receipt.total)
                : `« ${getFrenchAmountInWords(receipt.total)} »`}
            </p>
          </div>
        </div>

        {/* Official Statutory Exemption & Discharge Clause */}
        <div
          className="p-4 rounded-xl border-l-4 text-xs text-slate-700 space-y-1"
          style={{
            backgroundColor: palette.lightBgHex,
            borderLeftColor: palette.hex,
          }}
        >
          <span className="font-bold block uppercase tracking-wider text-[11px]" style={{ color: palette.darkHex }}>
            {isArabic
              ? "الإبراء القانوني والإعفاء الضريبي (Loi 22-23) :"
              : "Décharge libératoire & Mentions légales :"}
          </span>
          <p className="leading-relaxed">
            {isArabic
              ? "يشهد المقاول الذاتي الموقع أدناه بأنه تسلم من العميل المذكور أعلاه المبلغ المحدد في هذا الوصل، ويعتبر هذا الوصل إبراءً كلياً ومخالصة نهائية لذمة العميل عن الفاتورة المشار إليها. النشاط خاضع للضريبة الجزافية الوحيدة (IFU) ومعفى قانوناً من الرسم على القيمة المضافة (TVA) بموجب القانون رقم 22-23."
              : "Le soussigné atteste avoir reçu du client désigné ci-dessus le montant stipulé. La présente quittance vaut décharge définitive et libératoire pour l'exécution des prestations de la facture citée. Activité exercée sous le régime de l'auto-entrepreneur (Loi 22-23), soumise à l'Impôt Forfaitaire Unique (IFU) et exonérée de TVA conformément à l'article 13 du Décret exécutif n° 23-197."}
          </p>
        </div>

        {/* Optional Notes */}
        {receipt.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">
              {isArabic ? "ملاحظات إضافية :" : "Observations :"}
            </span>
            <p className="whitespace-pre-line">{receipt.notes}</p>
          </div>
        )}

        {/* Administrative Circular Seal & Signature Block */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-slate-200">
          <div className="text-[11px] text-slate-400 space-y-0.5 max-w-md">
            <p>
              {isArabic
                ? "وثيقة رسمية صادرة إلكترونياً عن منصة المقاول الذاتي Auto Entrepreneur DZ"
                : "Document certifié édité sous la plateforme de facturation réglementaire Auto Entrepreneur DZ."}
            </p>
            <p className="font-mono text-[10px]">
              {isArabic ? "المعرف الفريد للمستند: " : "Empreinte documentaire : "}
              {receipt.receiptNumber} • {receipt.invoiceNumber}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Algerian Circular Administrative Stamp */}
            {seller.showStampSignature !== false && (
              <div
                className="flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed p-2 text-center rotate-[-4deg] select-none"
                style={{
                  borderColor: `${palette.hex}66`,
                  backgroundColor: `${palette.lightBgHex}44`,
                  color: palette.darkHex,
                }}
              >
                <div
                  className="w-full h-full rounded-full border flex flex-col items-center justify-center p-1 text-[8.5px] font-bold leading-tight uppercase"
                  style={{ borderColor: `${palette.hex}55` }}
                >
                  <span className="text-[7.5px]" style={{ color: palette.hex }}>
                    الجمهورية الجزائرية
                  </span>
                  <span className="text-[9.5px] font-extrabold my-0.5" style={{ color: palette.darkHex }}>
                    وصل مسدد وخالص
                  </span>
                  <span className="text-[7.5px]" style={{ color: palette.darkHex }}>
                    المقاول الذاتي
                  </span>
                  <span className="text-[7.5px] font-mono mt-0.5" style={{ color: palette.hex }}>
                    LOI 22-23
                  </span>
                </div>
              </div>
            )}

            {/* Signature Box */}
            <div className="w-48 h-32 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {isArabic ? "توقيع المقاول الذاتي" : "Signature & Cachet"}
              </span>
              <div className="text-[11px] font-bold text-slate-700 italic">
                {seller.fullName}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BilingualPaymentReceiptPaper;
