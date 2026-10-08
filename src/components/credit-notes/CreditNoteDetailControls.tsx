"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toggleCreditNoteRefundAction,
  emailCreditNoteAction,
} from "@/app/actions";
import {
  Download,
  Mail,
  Send,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface CreditNoteData {
  id: string;
  creditNoteNumber: string | null;
  status: string;
  refundStatus: string;
  originalInvoiceId: string;
  originalInvoice?: {
    id: string;
    invoiceNumber: string | null;
  };
  client?: {
    email?: string | null;
    name?: string;
  };
}

export function CreditNoteDetailControls({
  creditNote,
}: {
  creditNote: CreditNoteData;
}) {
  const router = useRouter();
  const { t, locale, dir } = useI18n();

  const [loading, setLoading] = useState(false);
  const emailModalRef = useRef<HTMLDialogElement>(null);
  const [recipientEmail, setRecipientEmail] = useState(creditNote.client?.email || "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleToggleRefund = async () => {
    setLoading(true);
    try {
      const nextRefunded = creditNote.refundStatus !== "REFUNDED";
      const res = await toggleCreditNoteRefundAction(creditNote.id, nextRefunded);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur");
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setEmailLoading(true);
    setEmailFeedback(null);
    try {
      const res = await emailCreditNoteAction(creditNote.id, recipientEmail);
      if (res?.error) {
        setEmailFeedback({ success: false, message: res.error });
      } else {
        const note = res.mocked ? " (Mode Dev)" : "";
        setEmailFeedback({
          success: true,
          message: locale === "ar"
            ? `تم إرسال إشعار الدائن بنجاح إلى ${res.recipient}${note} !`
            : `Avoir transmis avec succès à ${res.recipient}${note} !`,
        });
      }
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err.message || "Erreur" });
    } finally {
      setEmailLoading(false);
    }
  };

  const originalInvoiceNumber = creditNote.originalInvoice?.invoiceNumber || (locale === "ar" ? "الفاتورة الأصلية" : "Facture d'origine");

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
      {/* Toggle Refund Status */}
      <button
        type="button"
        disabled={loading}
        onClick={handleToggleRefund}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer shadow-2xs ${
          creditNote.refundStatus === "REFUNDED"
            ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
        }`}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>
          {creditNote.refundStatus === "REFUNDED"
            ? t("btnMarkUnrefunded")
            : t("btnMarkRefunded")}
        </span>
      </button>

      {/* Link to Original Invoice */}
      <Link
        href={`/invoices/${creditNote.originalInvoiceId}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition"
        title={locale === "ar" ? "معاينة الفاتورة المصححة" : "Consulter la facture rectifiée"}
      >
        <FileText className="w-3.5 h-3.5 text-slate-500" />
        <span>{t("linkedInvoiceLabel", { number: originalInvoiceNumber })}</span>
      </Link>

      {/* Send Email Action */}
      <button
        type="button"
        onClick={() => {
          setEmailFeedback(null);
          emailModalRef.current?.showModal();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition cursor-pointer"
      >
        <Mail className="w-3.5 h-3.5 text-slate-500" />
        <span>{t("btnSendEmail")}</span>
      </button>

      {/* Download PDF Action */}
      <a
        href={`/api/credit-notes/${creditNote.id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{t("downloadPdf")}</span>
      </a>

      {/* Modal: Send Credit Note via Resend */}
      <dialog
        ref={emailModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t("sendCreditNoteEmailTitle")}</h2>
                <p className="text-xs text-slate-500">{t("sendCreditNoteEmailSubtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => emailModalRef.current?.close()}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("recipientEmailLabel")}
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@entreprise.dz"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {t("sendCreditNotePdfHint")}
              </p>
            </div>

            {emailFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  emailFeedback.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {emailFeedback.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{emailFeedback.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => emailModalRef.current?.close()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t("btnClose")}
              </button>
              <button
                type="submit"
                disabled={emailLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{emailLoading ? t("btnSending") : t("btnSend")}</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
export default CreditNoteDetailControls;
