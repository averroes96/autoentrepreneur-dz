"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  finalizeAndSendQuoteAction,
  updateQuoteStatusAction,
  convertQuoteToInvoiceAction,
  deleteQuoteAction,
  emailQuoteAction,
} from "@/app/actions";
import {
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Send,
  Sparkles,
  ArrowRight,
  FileCheck2,
  FileText,
  AlertTriangle,
  X,
} from "lucide-react";

interface QuoteData {
  id: string;
  quoteNumber: string | null;
  status: string;
  client?: {
    email?: string | null;
    name?: string;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string | null;
  }>;
}

export function QuoteDetailControls({ quote }: { quote: QuoteData }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteModalRef = useRef<HTMLDialogElement>(null);
  const sendModalRef = useRef<HTMLDialogElement>(null);
  const convertModalRef = useRef<HTMLDialogElement>(null);
  const emailModalRef = useRef<HTMLDialogElement>(null);

  const [recipientEmail, setRecipientEmail] = useState(quote.client?.email || "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;
    setEmailLoading(true);
    setEmailFeedback(null);
    try {
      const res = await emailQuoteAction(quote.id, recipientEmail);
      if (res?.error) {
        setEmailFeedback({ success: false, message: res.error });
      } else {
        const note = res.mocked ? " (Mode Dev : simulation Resend sans clé API)" : "";
        setEmailFeedback({
          success: true,
          message: `Devis transmis avec succès à ${res.recipient}${note} !`,
        });
      }
    } catch (err: any) {
      setEmailFeedback({ success: false, message: err.message || "Erreur lors de l'envoi" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await finalizeAndSendQuoteAction(quote.id);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      sendModalRef.current?.close();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la validation du devis");
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: "ACCEPTED" | "REJECTED") => {
    setLoading(true);
    try {
      const res = await updateQuoteStatusAction(quote.id, status);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Erreur lors du changement de statut");
      setLoading(false);
    }
  };

  const handleConvertConfirm = async () => {
    setLoading(true);
    try {
      const res = await convertQuoteToInvoiceAction(quote.id);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      convertModalRef.current?.close();
      router.push(`/invoices/${res.invoiceId}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la conversion en facture");
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const res = await deleteQuoteAction(quote.id);
      if (res?.error) {
        alert(res.error);
        setLoading(false);
        return;
      }
      deleteModalRef.current?.close();
      router.push("/quotes");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression");
      setLoading(false);
    }
  };

  const generatedInvoice = quote.invoices?.[0];

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
      {/* If DRAFT */}
      {quote.status === "DRAFT" && (
        <>
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Modifier</span>
          </Link>

          <button
            type="button"
            disabled={loading}
            onClick={() => sendModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-2xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Valider & Émettre</span>
          </button>

          <button
            type="button"
            onClick={() => deleteModalRef.current?.showModal()}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
            title="Supprimer le devis"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        </>
      )}

      {/* If SENT */}
      {quote.status === "SENT" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleStatusChange("ACCEPTED")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium transition shadow-2xs cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Marquer Accepté</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleStatusChange("REJECTED")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Refusé</span>
          </button>

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

          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>
        </>
      )}

      {/* If ACCEPTED */}
      {quote.status === "ACCEPTED" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => convertModalRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Convertir en Facture</span>
          </button>

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

          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>
        </>
      )}

      {/* If CONVERTED */}
      {quote.status === "CONVERTED" && (
        <>
          {generatedInvoice && (
            <Link
              href={`/invoices/${generatedInvoice.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold shadow-2xs transition"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Voir Facture ({generatedInvoice.invoiceNumber || "Brouillon"})</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
            </Link>
          )}

          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>
        </>
      )}

      {/* If REJECTED */}
      {quote.status === "REJECTED" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleStatusChange("ACCEPTED")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium transition cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Réactiver & Accepter</span>
          </button>

          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger PDF</span>
          </a>
        </>
      )}

      {/* Modal: Finalize & Send Quote */}
      <dialog
        ref={sendModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-sky-700 mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Validation officielle du devis</h2>
              <p className="text-xs text-slate-500">Attribution du numéro séquentiel DEV-YYYY-XXXX</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Cette action va attribuer le prochain numéro officiel séquentiel et figer les données du devis pour transmission au client.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => sendModalRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalize}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Validation..." : "Valider & Émettre"}
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal: Convert to Invoice */}
      <dialog
        ref={convertModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-emerald-700 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Conversion en Facture</h2>
              <p className="text-xs text-slate-500">Génération automatique du projet de facture</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Un nouveau projet de facture sera créé avec l'ensemble des prestations, du montant et des informations de ce devis. Le devis sera marqué comme <strong>Facturé</strong>.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => convertModalRef.current?.close()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleConvertConfirm}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? "Création..." : "Confirmer la conversion"}
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal: Delete Quote */}
      <dialog
        ref={deleteModalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-md w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6">
          <div className="flex items-center gap-3 text-rose-700 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Supprimer ce projet de devis ?</h2>
              <p className="text-xs text-slate-500">Cette action est irréversible.</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
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

      {/* Modal: Send Quote via Resend */}
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
                <h2 className="text-sm font-bold text-slate-900">Transmettre le devis par email</h2>
                <p className="text-xs text-slate-500">Transmission directe avec PDF conforme en pièce jointe</p>
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
                Le devis au format officiel PDF sera joint au message.
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
export default QuoteDetailControls;
