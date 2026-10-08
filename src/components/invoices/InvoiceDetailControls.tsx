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
  XCircle,
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
  const [creditNoteReason, setCreditNoteReason] = useState("Annulation de mission / prestation");
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
        const note = res.mocked ? " (Mode Dev : simulation Resend sans clé API)" : "";
        setEmailFeedback({
          success: true,
          message: `Facture transmise avec succès à ${res.recipient}${note} !`,
        });
      }
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err.message || "Erreur lors de l'envoi" });
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
      setError(err.message || "Erreur lors de l'émission");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async () => {
    if (invoice.paymentStatus !== "PAID") {
      // Open detailed payment recording modal
      paymentModalRef.current?.showModal();
      return;
    }

    if (!confirm("Voulez-vous marquer cette facture comme impayée ? Le reçu associé sera désactivé.")) {
      return;
    }

    setLoading(true);
    try {
      await toggleInvoicePaymentAction(invoice.id, false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour du statut de paiement");
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
      alert(err.message || "Erreur lors de l'enregistrement du paiement");
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
      setError(err.message || "Erreur lors de l'annulation");
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
      alert(err.message || "Erreur lors de la suppression");
      setLoading(false);
    }
  };

  const handleCreateCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteReason.trim()) {
      alert("Le motif de l'avoir est obligatoire.");
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
      alert(err.message || "Erreur lors de la création de l'avoir");
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
            <span>Modifier</span>
          </Link>

          <button
            type="button"
            onClick={() => issueModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs transition cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Émettre la facture</span>
          </button>

          <button
            type="button"
            onClick={() => deleteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            title="Supprimer le brouillon"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
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
                ? "Marquer impayée"
                : "Marquer payée"}
            </span>
          </button>

          {/* Receipt Link Button when Paid */}
          {invoice.paymentStatus === "PAID" && (
            <Link
              href={`/invoices/${invoice.id}/receipt`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition"
              title="Consulter et imprimer la quittance de paiement officielle"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Quittance / Reçu</span>
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
            <span>Envoyer email</span>
          </button>

          {/* Download PDF Action */}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>

          {/* Create Credit Note Action */}
          <button
            type="button"
            onClick={() => creditNoteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 text-xs font-medium border border-rose-200/80 shadow-2xs transition cursor-pointer"
            title="Émettre une facture d'avoir pour rectifier ou rembourser cette facture"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Créer un Avoir</span>
          </button>

          {/* Cancel Action */}
          <button
            type="button"
            onClick={() => cancelModalRef.current?.showModal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            title="Annuler cette facture"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Annuler</span>
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
          <span>Télécharger archive PDF</span>
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
            <h2 className="text-base font-bold text-slate-900">Émission définitive de la facture</h2>
          </div>

          <div className="text-xs text-slate-600 space-y-2 mb-6">
            <p>
              Êtes-vous sûr de vouloir officialiser cette facture ?
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-800">Conséquences légales :</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Attribution du numéro séquentiel chronologique suivant sans rupture.</li>
                <li>Verrouillage des données (le document devient permanent et immuable).</li>
                <li>Génération de l'empreinte fiscale horodatée.</li>
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
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleIssueConfirm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Émission en cours..." : "Confirmer et Émettre"}
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
            <h2 className="text-base font-bold text-slate-900">Annuler la facture émise</h2>
          </div>

          <form onSubmit={handleCancelConfirm} className="space-y-4">
            <p className="text-xs text-slate-600">
              Conformément à la réglementation fiscale, une facture émise ne peut pas être supprimée. Son annulation est enregistrée avec un motif justificatif obligatoire et son montant est déduit de votre chiffre d'affaires.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Motif d'annulation obligatoire *
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Erreur sur le montant de la prestation convenu avec le client, accord amiable pour réémission..."
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
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? "Annulation..." : "Confirmer l'annulation"}
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
            <h2 className="text-base font-bold text-slate-900">Supprimer le brouillon</h2>
          </div>
          <p className="text-xs text-slate-600 mb-6">
            Êtes-vous certain de vouloir supprimer définitivement ce projet de facture ? Cette action est irréversible.
          </p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => deleteModalRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDeleteConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Suppression..." : "Supprimer"}
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
                <h2 className="text-sm font-bold text-slate-900">Transmettre la facture</h2>
                <p className="text-xs text-slate-500">Transmission par email direct avec PDF conforme</p>
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
                Adresse email du destinataire
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
                La facture sera jointe au format PDF officiel et archivée sur le Cloud.
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
                Fermer
              </button>
              <button
                type="submit"
                disabled={emailLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{emailLoading ? "Envoi en cours..." : "Envoyez"}</span>
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
                <h2 className="text-sm font-bold text-slate-900">Émettre une Facture d'Avoir</h2>
                <p className="text-xs text-slate-500">Rattachée à la facture {invoice.invoiceNumber || "en cours"}</p>
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
              <strong>Obligation réglementaire :</strong> L'émission d'un avoir génère un document comptable officiel avec numéro séquentiel unique (AVR-YYYY-XXXX). Il rectifie la facture d'origine et déduit le montant de votre chiffre d'affaires imposable au titre de l'IFU.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Motif légal de l'avoir <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  "Annulation de mission / prestation",
                  "Remise commerciale accordée",
                  "Erreur de facturation sur montant",
                  "Prestation partielle non exécutée",
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
                placeholder="Précisez le motif légal..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Modalités de remboursement ou remarques (facultatif)
              </label>
              <textarea
                rows={2}
                value={creditNoteNotes}
                onChange={(e) => setCreditNoteNotes(e.target.value)}
                placeholder="Ex : Virement de remboursement émis le..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => creditNoteModalRef.current?.close()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creditNoteLoading || !creditNoteReason.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{creditNoteLoading ? "Génération..." : "Émettre l'Avoir officiel"}</span>
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
                  Enregistrer l&apos;encaissement
                </h3>
                <p className="text-[11px] text-slate-500">
                  Génération de la quittance officielle de paiement
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
              <strong>Quittance libératoire :</strong> Marquer cette facture comme payée générera un reçu officiel avec numéro séquentiel (REC-YYYY-XXXX) certifiant l&apos;encaissement des fonds.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Date d&apos;encaissement / règlement <span className="text-emerald-600">*</span>
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
                Mode de règlement <span className="text-emerald-600">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="CCP_BARIDIMOB">Virement CCP / BaridiMob</option>
                <option value="CASH">Espèces (Cash)</option>
                <option value="CHEQUE">Chèque bancaire</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Référence de transaction / N° chèque (facultatif)
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
                Annuler
              </button>
              <button
                type="submit"
                disabled={paymentLoading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{paymentLoading ? "Enregistrement..." : "Valider & Générer le reçu"}</span>
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
