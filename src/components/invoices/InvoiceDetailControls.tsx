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
} from "lucide-react";

interface InvoiceData {
  id: string;
  invoiceNumber: string | null;
  status: string;
  paymentStatus: string;
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

  const [cancelReason, setCancelReason] = useState("");

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
    setLoading(true);
    try {
      const nextPaid = invoice.paymentStatus !== "PAID";
      await toggleInvoicePaymentAction(invoice.id, nextPaid);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour du statut de paiement");
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* If DRAFT */}
      {invoice.status === "DRAFT" && (
        <>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </Link>

          <button
            type="button"
            onClick={() => deleteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>

          <button
            type="button"
            onClick={() => issueModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Émettre la facture</span>
          </button>
        </>
      )}

      {/* If ISSUED */}
      {invoice.status === "ISSUED" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={handleTogglePayment}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              invoice.paymentStatus === "PAID"
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              {invoice.paymentStatus === "PAID"
                ? "Marquer comme Impayée"
                : "Marquer comme Payée (Encaissée)"}
            </span>
          </button>

          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setEmailFeedback(null);
              emailModalRef.current?.showModal();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Envoyer par email</span>
          </button>

          <button
            type="button"
            onClick={() => cancelModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Télécharger le PDF d'archive</span>
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
    </div>
  );
}
