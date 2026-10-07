"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction, updateQuoteAction } from "@/app/actions";
import { formatDZD } from "@/lib/tax";
import {
  Plus,
  Trash2,
  Calendar,
  Building,
  AlertCircle,
  Clock,
  ArrowRight,
  Layers,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

interface ClientOption {
  id: string;
  name: string;
  clientType: string;
}

interface LineItemState {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

interface QuoteFormProps {
  clients: ClientOption[];
  defaultCurrency: string;
  vatExemptionNote: string;
  existingQuote?: {
    id: string;
    clientId: string;
    issueDate: Date | string;
    validUntil?: Date | string | null;
    notes?: string | null;
    showDetailedItems?: boolean;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
}

export function QuoteForm({
  clients,
  defaultCurrency,
  vatExemptionNote,
  existingQuote,
}: QuoteFormProps) {
  const router = useRouter();

  const [clientId, setClientId] = useState(existingQuote?.clientId || (clients[0]?.id ?? ""));
  const [issueDate, setIssueDate] = useState(
    existingQuote?.issueDate
      ? new Date(existingQuote.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  // Default validity date: +30 days
  const defaultValidUntilDate = new Date();
  defaultValidUntilDate.setDate(defaultValidUntilDate.getDate() + 30);

  const [validUntil, setValidUntil] = useState(
    existingQuote?.validUntil
      ? new Date(existingQuote.validUntil).toISOString().split("T")[0]
      : defaultValidUntilDate.toISOString().split("T")[0]
  );

  const [notes, setNotes] = useState(
    existingQuote?.notes ||
      "Validité de l'offre : 30 jours à compter de la date d'émission.\nModalités de paiement : 30% d'acompte à la commande, solde à la livraison."
  );
  const [isDetailed, setIsDetailed] = useState(existingQuote?.showDetailedItems ?? false);

  const [lineItems, setLineItems] = useState<LineItemState[]>(
    existingQuote?.lineItems && existingQuote.lineItems.length > 0
      ? existingQuote.lineItems.map((li) => ({
          description: li.description,
          amount: li.totalPrice,
          quantity: li.quantity || 1,
          unitPrice: li.unitPrice || li.totalPrice,
        }))
      : [{ description: "", amount: 0, quantity: 1, unitPrice: 0 }]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimpleAmountChange = (index: number, val: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        amount: val,
        unitPrice: val,
        quantity: 1,
      };
      return updated;
    });
  };

  const handleDetailedChange = (
    index: number,
    field: "quantity" | "unitPrice",
    val: number
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      const qty = field === "quantity" ? val : item.quantity;
      const unit = field === "unitPrice" ? val : item.unitPrice;
      item.amount = (qty || 0) * (unit || 0);
      updated[index] = item;
      return updated;
    });
  };

  const handleDescriptionChange = (index: number, text: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description: text };
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: "", amount: 0, quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = lineItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const setValidityDays = (days: number) => {
    const base = new Date(issueDate);
    base.setDate(base.getDate() + days);
    setValidUntil(base.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Veuillez sélectionner ou créer un client.");
      return;
    }

    const validItems = lineItems.filter(
      (item) => item.description.trim() !== "" && item.amount > 0
    );

    if (validItems.length === 0) {
      setError("Veuillez renseigner au moins une prestation avec un montant valide (> 0).");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        clientId,
        issueDate,
        validUntil: validUntil || null,
        notes: notes.trim(),
        showDetailedItems: isDetailed,
        lineItems: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: isDetailed ? item.quantity : 1,
          unitPrice: isDetailed ? item.unitPrice : item.amount,
          totalPrice: item.amount,
        })),
      };

      if (existingQuote) {
        const res = await updateQuoteAction(existingQuote.id, payload);
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        router.push(`/quotes/${existingQuote.id}`);
      } else {
        const res = await createQuoteAction(payload);
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        router.push(`/quotes/${res.quoteId}`);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement du devis.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-rose-900">Information requise</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Quote Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Détails du Devis / Proforma</h2>
            <p className="text-xs text-slate-500">
              Établissez une proposition commerciale conforme à la Loi 22-23 (sans TVA).
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            {existingQuote ? "Mode Édition" : "Nouveau Devis"}
          </span>
        </div>

        {/* Client & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Client Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Client destinataire <span className="text-rose-500">*</span>
              </label>
              <Link
                href="/clients"
                target="_blank"
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                + Nouveau client
              </Link>
            </div>
            {clients.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Aucun client enregistré.{" "}
                <Link href="/clients" className="font-bold underline">
                  Créez un client
                </Link>{" "}
                avant de faire un devis.
              </div>
            ) : (
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clientType === "PROFESSIONAL" ? "Entreprise" : "Particulier"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Issue Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date d'émission <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Valid Until */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Date de validité de l'offre
              </label>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setValidityDays(15)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  15j
                </button>
                <button
                  type="button"
                  onClick={() => setValidityDays(30)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  30j
                </button>
                <button
                  type="button"
                  onClick={() => setValidityDays(60)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  60j
                </button>
              </div>
            </div>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Line Items Mode Toggle */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Prestations chiffrées</span>
            <span className="text-[11px] text-slate-400">
              (Dinars Algériens • DZD • Exonéré de TVA)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDetailed(!isDetailed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
          >
            <Layers className="w-3 h-3 text-slate-500" />
            <span>
              {isDetailed ? "Passer en montant forfaitaire direct" : "Détailler quantité et prix unitaire"}
            </span>
          </button>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80"
            >
              <div className="flex-1 w-full">
                <input
                  type="text"
                  required
                  placeholder="Ex : Conception graphique et développement web sur mesure..."
                  value={item.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {isDetailed ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-20">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      placeholder="Qté"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleDetailedChange(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-center font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="Prix Unit. (DZD)"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        handleDetailedChange(index, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-right font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div className="w-32 px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 text-right truncate">
                    {formatDZD(item.amount)}
                  </div>
                </div>
              ) : (
                <div className="w-full sm:w-44 flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Montant (DZD)"
                    value={item.amount || ""}
                    onChange={(e) =>
                      handleSimpleAmountChange(index, parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-right text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-400 shrink-0">DZD</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => removeLineItem(index)}
                disabled={lineItems.length <= 1}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Supprimer la ligne"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLineItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une prestation</span>
          </button>
        </div>

        {/* Total Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-900 text-white">
          <div>
            <span className="text-xs text-slate-400 font-medium">TOTAL ESTIMÉ DU DEVIS (NET)</span>
            <p className="text-[11px] text-emerald-400 font-medium">
              Conformité Loi 22-23 : Exonéré de TVA (Régime IFU)
            </p>
          </div>
          <div className="text-2xl font-black text-white tracking-tight mt-2 sm:mt-0">
            {formatDZD(totalAmount)}
          </div>
        </div>

        {/* Notes & Conditions */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">
            Conditions de réalisation, validité & modalités particulières
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex : Validité 30 jours. Acompte de 30% requis. Délais prévus de 15 jours ouvrables."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/quotes"
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={loading || clients.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>{loading ? "Enregistrement..." : existingQuote ? "Enregistrer les modifications" : "Créer le projet de devis"}</span>
        </button>
      </div>
    </form>
  );
}
export default QuoteForm;
