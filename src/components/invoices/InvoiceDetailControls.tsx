"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  issueInvoiceAction,
  toggleInvoicePaymentAction,
  cancelInvoiceAction,
  deleteInvoiceAction,
  emailInvoiceAction,
  createCreditNoteAction,
} from "@/app/actions";
import {
  Download,
  Edit,
  Trash2,
  CheckCircle,
  Ban,
  FileCheck,
  AlertTriangle,
  X,
  CreditCard,
  Mail,
  Send,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface InvoiceData {
  id: string;
  invoiceNumber: string | null;
  status: string;
  paymentStatus: string;
  total?: number;
  client?: {
    email?: string | null;
    name?: string;
  };
}

export function InvoiceDetailControls({ invoice }: { invoice: InvoiceData }) {
  const router = useRouter();
  const { t, locale, dir } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueModalRef = useRef<HTMLDialogElement>(null);
  const cancelModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);
  const creditNoteModalRef = useRef<HTMLDialogElement>(null);
  const paymentModalRef = useRef<HTMLDialogElement>(null);

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [cancelReason, setCancelReason] = useState("");
  const [creditNoteReason, setCreditNoteReason] = useState(t("creditNoteReasonPreset1"));
  const [creditNoteNotes, setCreditNoteNotes] = useState("");
  const [creditNoteLoading, setCreditNoteLoading] = useState(false);

  const emailModalRef = useRef<HTMLDialogElement>(null);
  const [recipientEmail, setRecipientEmail] = useState(invoice.client?.email || "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setEmailLoading(true);
    setEmailFeedback(null);
    try {
      const res = await emailInvoiceAction(invoice.id, recipientEmail);
      if (res?.error) {
        setEmailFeedback({ success: false, message: res.error });
      } else {
        const note = res.mocked ? " (Mode Dev)" : "";
        setEmailFeedback({
          success: true,
          message: locale === "ar"
            ? `تم إرسال الفاتورة بنجاح إلى ${res.recipient}${note} !`
            : `Facture transmise avec succès à ${res.recipient}${note} !`,
        });
      }
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err.message || "Erreur" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleIssueConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await issueInvoiceAction(invoice.id);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      issueModalRef.current?.close();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async () => {
    if (invoice.paymentStatus !== "PAID") {
      paymentModalRef.current?.showModal();
      return;
    }

    const confirmMsg = locale === "ar"
      ? "هل تريد تعيين هذه الفاتورة كغير مدفوعة؟ سيتم تعطيل وصل الدفع المرتبط بها."
      : "Voulez-vous marquer cette facture comme impayée ? Le reçu associé sera désactivé.";

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      await toggleInvoicePaymentAction(invoice.id, false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPaymentConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const res = await toggleInvoicePaymentAction(invoice.id, true, {
        paidAt: paymentDate,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      });

      if (res?.error) {
        alert(res.error);
        setPaymentLoading(false);
        return;
      }

      paymentModalRef.current?.close();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur");
      setPaymentLoading(false);
    }
  };

  const handleCancelConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await cancelInvoiceAction(invoice.id, cancelReason);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      cancelModalRef.current?.close();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const res = await deleteInvoiceAction(invoice.id);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      deleteModalRef.current?.close();
      router.push("/invoices");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erreur");
      setLoading(false);
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteReason.trim()) {
      alert(locale === "ar" ? "سبب الإشعار الدائن إلزامي." : "Le motif de l'avoir est obligatoire.");
      return;
    }
    setCreditNoteLoading(true);
    try {
      const res = await createCreditNoteAction({
        originalInvoiceId: invoice.id,
        reason: creditNoteReason.trim(),
        notes: creditNoteNotes.trim() || undefined,
      });

      if (res?.error) {
        alert(res.error);
        setCreditNoteLoading(false);
        return;
      }

      creditNoteModalRef.current?.close();
      router.push(`/credit-notes/${res.creditNoteId}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erreur");
      setCreditNoteLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
      {/* If DRAFT */}
      {invoice.status === "DRAFT" && (
        <>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("btnEdit")}</span>
          </Link>

          <button
            type="button"
            onClick={() => issueModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs transition cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{t("btnIssueInvoice")}</span>
          </button>

          <button
            type="button"
            onClick={() => deleteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            title={t("btnDeleteDraft")}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("btnDeleteDraft")}</span>
          </button>
        </>
      )}

      {/* If ISSUED */}
      {invoice.status === "ISSUED" && (
        <>
          {/* Payment Toggle */}
          <button
            type="button"
            disabled={loading}
            onClick={handleTogglePayment}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer shadow-2xs ${
              invoice.paymentStatus === "PAID"
                ? "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80"
                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              {invoice.paymentStatus === "PAID"
                ? t("btnMarkUnpaid")
                : t("btnMarkPaid")}
            </span>
          </button>

          {/* Receipt Link Button when Paid */}
          {invoice.paymentStatus === "PAID" && (
            <Link
              href={`/invoices/${invoice.id}/receipt`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition"
              title={locale === "ar" ? "معاينة وطباعة وصل الدفع الرسمي" : "Consulter et imprimer la quittance de paiement officielle"}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t("btnReceipt")}</span>
            </Link>
          )}

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
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("downloadPdf")}</span>
          </a>

          {/* Create Credit Note Action */}
          <button
            type="button"
            onClick={() => creditNoteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 text-xs font-medium border border-rose-200/80 shadow-2xs transition cursor-pointer"
            title={locale === "ar" ? "إصدار فاتورة دائنة لتصحيح أو تعويض هذه الفاتورة" : "Émettre une facture d'avoir pour rectifier ou rembourser cette facture"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("btnCreditNoteCreate")}</span>
          </button>

          {/* Cancel Action */}
          <button
            type="button"
            onClick={() => cancelModalRef.current?.showModal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            title={t("btnCancel")}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{t("btnCancel")}</span>
          </button>
        </>
      )}

      {/* If CANCELLED */}
      {invoice.status === "CANCELLED" && (
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t("btnDownloadArchivePdf")}</span>
        </a>
      )}

      {/* Modal: Issue Invoice Confirmation */}
      <dialog
        ref={issueModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-emerald-700 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{t("confirmIssueModalTitle")}</h2>
          </div>

          <div className="text-xs text-slate-600 space-y-2 mb-6">
            <p>{t("confirmIssueQuestion")}</p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-800">{t("legalConsequencesTitle")}</p>
              <ul className="list-disc pl-4 rtl:pr-4 rtl:pl-0 space-y-0.5 text-slate-600">
                <li>{t("legalConsequence1")}</li>
                <li>{t("legalConsequence2")}</li>
                <li>{t("legalConsequence3")}</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => issueModalRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {t("btnCancel")}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleIssueConfirm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? t("btnIssuing") : t("btnConfirmIssue")}
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal: Cancel Invoice */}
      <dialog
        ref={cancelModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-rose-700 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5 text-rose-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{t("cancelInvoiceModalTitle")}</h2>
          </div>

          <form onSubmit={handleCancelConfirm} className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("cancelInvoiceNotice")}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("cancelReasonLabel")}
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t("cancelReasonPlaceholder")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => cancelModalRef.current?.close()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t("btnBack")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? t("btnCancelling") : t("btnConfirmCancel")}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Modal: Delete Draft */}
      <dialog
        ref={deleteModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-sm w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-rose-700 mb-3">
            <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">{t("deleteDraftModalTitle")}</h2>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            {t("deleteDraftQuestion")}
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => deleteModalRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {t("btnCancel")}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? t("btnDeleting") : t("btnDeleteDraft")}
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal: Send Invoice via Resend */}
      <dialog
        ref={emailModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t("sendEmailModalTitle")}</h2>
                <p className="text-xs text-slate-500">{t("sendEmailModalSubtitle")}</p>
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {t("sendEmailPdfHint")}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{emailLoading ? t("btnSending") : t("btnSend")}</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Modal: Create Credit Note */}
      <dialog
        ref={creditNoteModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-lg w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{t("createCreditNoteModalTitle")}</h2>
                <p className="text-xs text-slate-500">
                  {t("creditNoteLinkedInvoice", { number: invoice.invoiceNumber || "..." })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => creditNoteModalRef.current?.close()}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCreditNote} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>{locale === "ar" ? "الالتزام التنظيمي :" : "Obligation réglementaire :"}</strong> {t("creditNoteNotice")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("creditNoteReasonLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  t("creditNoteReasonPreset1"),
                  t("creditNoteReasonPreset2"),
                  t("creditNoteReasonPreset3"),
                  t("creditNoteReasonPreset4"),
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCreditNoteReason(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      creditNoteReason === preset
                        ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={creditNoteReason}
                onChange={(e) => setCreditNoteReason(e.target.value)}
                placeholder={t("creditNoteReasonPlaceholder")}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("creditNoteRemarksLabel")}
              </label>
              <textarea
                rows={2}
                value={creditNoteNotes}
                onChange={(e) => setCreditNoteNotes(e.target.value)}
                placeholder={t("creditNoteRemarksPlaceholder")}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => creditNoteModalRef.current?.close()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t("btnCancel")}
              </button>
              <button
                type="submit"
                disabled={creditNoteLoading || !creditNoteReason.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{creditNoteLoading ? t("btnGenerating") : t("btnIssueOfficialCreditNote")}</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Payment Recording Modal */}
      <dialog
        ref={paymentModalRef}
        className="backdrop:bg-slate-900/40 p-0 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md m-auto"
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t("recordPaymentModalTitle")}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {t("recordPaymentModalSubtitle")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => paymentModalRef.current?.close()}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRecordPaymentConfirm} className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs leading-relaxed">
              {t("recordPaymentNotice")}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("paymentDateLabel")}
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("paymentMethodLabel")}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">{t("methodBankTransfer")}</option>
                <option value="CCP_BARIDIMOB">{t("methodCcpBaridiMob")}</option>
                <option value="CASH">{t("methodCash")}</option>
                <option value="CHEQUE">{t("methodCheque")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("paymentRefLabel")}
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ex : VIR-948201 / TXN-BARIDIMOB-8392"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => paymentModalRef.current?.close()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {t("btnCancel")}
              </button>
              <button
                type="submit"
                disabled={paymentLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{paymentLoading ? t("paymentRecordingLoading") : t("validateAndGenerateReceipt")}</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
