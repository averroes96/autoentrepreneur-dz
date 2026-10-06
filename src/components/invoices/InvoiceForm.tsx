"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceAction, updateInvoiceAction } from "@/app/actions";
import { formatDZD } from "@/lib/tax";
import {
  Plus,
  Trash2,
  Calendar,
  Building,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Layers,
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

interface InvoiceFormProps {
  clients: ClientOption[];
  defaultCurrency: string;
  vatExemptionNote: string;
  existingInvoice?: {
    id: string;
    clientId: string;
    issueDate: Date | string;
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

export function InvoiceForm({
  clients,
  defaultCurrency,
  vatExemptionNote,
  existingInvoice,
}: InvoiceFormProps) {
  const router = useRouter();

  const [clientId, setClientId] = useState(existingInvoice?.clientId || (clients[0]?.id ?? ""));
  const [issueDate, setIssueDate] = useState(
    existingInvoice?.issueDate
      ? new Date(existingInvoice.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(existingInvoice?.notes || "");
  const [isDetailed, setIsDetailed] = useState(existingInvoice?.showDetailedItems ?? false);

  const [lineItems, setLineItems] = useState<LineItemState[]>(
    existingInvoice?.lineItems && existingInvoice.lineItems.length > 0
      ? existingInvoice.lineItems.map((li) => ({
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
      const cur = updated[index];
      const qty = field === "quantity" ? val : cur.quantity;
      const unit = field === "unitPrice" ? val : cur.unitPrice;
      const amt = qty * unit;
      updated[index] = {
        ...cur,
        quantity: qty,
        unitPrice: unit,
        amount: amt,
      };
      return updated;
    });
  };

  const handleDescriptionChange = (index: number, desc: string) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description: desc };
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

  const total = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clientId) {
      setError("Veuillez sélectionner un client.");
      setLoading(false);
      return;
    }

    const invalidItem = lineItems.find(
      (item) => !item.description.trim() || item.amount <= 0
    );
    if (invalidItem) {
      setError("Veuillez renseigner une description et un montant valide (> 0 DZD) pour chaque prestation.");
      setLoading(false);
      return;
    }

    const payloadItems = lineItems.map((item) => ({
      description: item.description,
      totalPrice: item.amount,
      quantity: isDetailed ? item.quantity : 1,
      unitPrice: isDetailed ? item.unitPrice : item.amount,
    }));

    try {
      if (existingInvoice) {
        const res = await updateInvoiceAction(existingInvoice.id, {
          clientId,
          issueDate,
          notes,
          showDetailedItems: isDetailed,
          lineItems: payloadItems,
        });
        if (res?.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        router.push(`/invoices/${existingInvoice.id}`);
        router.refresh();
      } else {
        const res = await createInvoiceAction({
          clientId,
          issueDate,
          notes,
          showDetailedItems: isDetailed,
          lineItems: payloadItems,
        });
        if (res?.error) {
          setError(res.error);
          setLoading(false);
          return;
        }
        router.push(`/invoices/${res.invoiceId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
      setLoading(false);
    }
  };

  if (clients.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Building className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Aucun client disponible</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Pour créer une facture, vous devez d'abord enregistrer les coordonnées de votre client (nom, adresse, type).
        </p>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un client d'abord</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Invoice Meta Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Client destinataire *
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.clientType === "PROFESSIONAL" ? "Pro" : "Particulier"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Date d'émission *
          </label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Devise de facturation
          </label>
          <input
            type="text"
            disabled
            value="Dinar Algérien (DZD)"
            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">
            Devise réglementaire active (DZD)
          </span>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Prestations de services</h3>
            <p className="text-xs text-slate-500">
              {isDetailed
                ? "Mode détaillé actif : vous pouvez renseigner des quantités et prix unitaires (ex: jours, heures)."
                : "Par défaut : définissez directement le montant total pour chaque tâche sans calcul de quantité."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Detailed Mode */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={isDetailed}
                onChange={(e) => setIsDetailed(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-700 select-none">
                Détailler quantité & prix unitaire
              </span>
            </label>

            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une prestation</span>
            </button>
          </div>
        </div>

        {/* Prestations List */}
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3"
            >
              {isDetailed ? (
                /* DETAILED MODE (Quantity + Unit Price) */
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Désignation de la prestation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Prestation de développement logiciel, maintenance..."
                      value={item.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleDetailedChange(index, "quantity", Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Prix Unitaire (DZD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleDetailedChange(index, "unitPrice", Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2 flex items-center justify-between pl-2">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                      <span className="text-xs font-bold text-slate-900">{formatDZD(item.amount)}</span>
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* DEFAULT FLAT MODE (Direct Task Total) */
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-8">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Désignation de la tâche / prestation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Développement du module d'authentification, mission de conseil..."
                      value={item.description}
                      onChange={(e) => handleDescriptionChange(index, e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-10 sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Montant de la prestation (DZD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      placeholder="Ex: 150000"
                      value={item.amount || ""}
                      onChange={(e) => handleSimpleAmountChange(index, Number(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex justify-end items-end pt-5">
                    {lineItems.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Supprimer la prestation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals Summary Card (STRICTLY NO VAT, NO HT/TTC SPLIT) */}
        <div className="pt-4 border-t border-slate-100 flex flex-col items-end">
          <div className="w-full sm:w-80 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Total des prestations :</span>
              <span className="font-semibold text-slate-700">{formatDZD(total)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Taux TVA :</span>
              <span className="font-semibold text-emerald-700">0% (Non applicable)</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase">Total Net à Payer :</span>
              <span className="text-base font-extrabold text-emerald-700">{formatDZD(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory VAT Exemption Legal String Box */}
      <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-emerald-900">
          <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Mention légale obligatoire sur la facture (Régime IFU) :</span>
        </div>
        <p className="italic text-emerald-800 bg-white/70 p-3 rounded-xl border border-emerald-200/60">
          « {vatExemptionNote} »
        </p>
        <span className="text-[11px] text-emerald-700 block">
          * Vous pouvez personnaliser ce modèle de mention légale à tout moment dans les paramètres de votre Profil.
        </span>
      </div>

      {/* Notes / Modalités de paiement */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Notes & Modalités de règlement (Optionnel)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Règlement attendu par virement bancaire sur le compte CCP / RIB N° 00799999... dans un délai de 30 jours."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/invoices"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>
            {loading
              ? "Enregistrement..."
              : existingInvoice
              ? "Mettre à jour le brouillon"
              : "Enregistrer comme Brouillon"}
          </span>
        </button>
      </div>
    </form>
  );
}
export default InvoiceForm;
