"use client";

import React, { useState } from "react";
import { updateProfileAction, savePastTurnoverAction } from "@/app/actions";
import { formatDZD } from "@/lib/tax";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import {
  ShieldCheck,
  Building,
  User,
  FileText,
  Calendar,
  CreditCard,
  Save,
  CheckCircle,
  Plus,
  History,
  AlertCircle,
} from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profile";

interface ProfileData {
  fullName: string;
  rnaeNumber: string;
  nif: string;
  address: string;
  email: string;
  phone: string;
  activityCode: string;
  activityLabel: string;
  defaultCurrency: string;
  cardIssueDate: Date | string | null;
  activityStartDate: Date | string | null;
  cardValidityYears: number;
  casnosStatus: string;
  casnosScheme: string;
  vatExemptionNote: string;
  invoicePrefix: string;
}

interface PastTurnoverData {
  id: string;
  fiscalYear: number;
  turnoverDzd: number;
}

export function ProfileFormClient({
  profile,
  pastTurnovers,
}: {
  profile: ProfileData;
  pastTurnovers: PastTurnoverData[];
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Past turnover state
  const [turnoverYear, setTurnoverYear] = useState<number>(new Date().getFullYear() - 1);
  const [turnoverAmount, setTurnoverAmount] = useState<string>("");
  const [turnoverLoading, setTurnoverLoading] = useState(false);
  const [turnoverSuccess, setTurnoverSuccess] = useState(false);

  const handleSubmitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateProfileAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePastTurnover = async (e: React.FormEvent) => {
    e.preventDefault();
    setTurnoverLoading(true);
    setTurnoverSuccess(false);

    const formData = new FormData();
    formData.append("fiscalYear", String(turnoverYear));
    formData.append("turnoverDzd", String(turnoverAmount));

    try {
      const res = await savePastTurnoverAction(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        setTurnoverSuccess(true);
        setTurnoverAmount("");
        setTimeout(() => setTurnoverSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Erreur enregistrement historique");
    } finally {
      setTurnoverLoading(false);
    }
  };

  const formatDateValue = (d: Date | string | null) => {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
  };

  const completion = calculateProfileCompletion(profile);

  return (
    <div className="space-y-8">
      {/* Profile Completion Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  completion.isFullyComplete
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {completion.isFullyComplete
                  ? "Profil 100% Conforme"
                  : `Profil à ${completion.percentage}% de conformité`}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {completion.completedCount} sur {completion.totalCount} champs obligatoires validés
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Conformité du profil réglementaire (Loi 22-23)
            </h2>
            <p className="text-xs text-slate-500">
              Ces informations alimentent directement les mentions légales obligatoires de vos factures.
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {completion.percentage}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completion.isFullyComplete ? "bg-emerald-500" : "bg-emerald-600"
            }`}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>

        {/* Checklist Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {completion.items.map((item) => (
            <div
              key={item.key}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                item.isComplete
                  ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                  item.isComplete
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {item.isComplete ? "✓" : "•"}
              </div>
              <span className="font-medium truncate text-[11px]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profil et paramètres mis à jour avec succès.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Identification & Coordonnées */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Identité Légale & Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nom & Prénom légal *
              </label>
              <input
                type="text"
                name="fullName"
                required
                defaultValue={profile.fullName}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email de contact professionnel
              </label>
              <input
                type="email"
                name="email"
                defaultValue={profile.email}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Numéro de téléphone
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={profile.phone}
                placeholder="05 XX XX XX XX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Adresse de domiciliation de l'activité *
              </label>
              <input
                type="text"
                name="address"
                required
                defaultValue={profile.address}
                placeholder="Adresse complète en Algérie"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Identifiants Administratifs ANAE & DGI */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Identifiants Réglementaires (ANAE & Fiscalité)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                N° RNAE (Registre National de l'Auto-Entrepreneur) *
              </label>
              <input
                type="text"
                name="rnaeNumber"
                required
                defaultValue={profile.rnaeNumber}
                placeholder="Ex: 24-001234"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Figure sur la carte physique délivrée par l'ANAE (validité 5 ans).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                NIF (Numéro d'Identification Fiscale) *
              </label>
              <input
                type="text"
                name="nif"
                required
                defaultValue={profile.nif}
                placeholder="Ex: 198016010023456"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Obtenu après la déclaration d'existence auprès de la recette des impôts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Code Activité ANAE
              </label>
              <input
                type="text"
                name="activityCode"
                defaultValue={profile.activityCode}
                placeholder="Ex: 601101"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Libellé de l'Activité Éligible
              </label>
              <input
                type="text"
                name="activityLabel"
                defaultValue={profile.activityLabel}
                placeholder="Ex: Développement informatique et logiciels"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dates Clés & Sécurité Sociale (CASNOS) */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Dates Clés & Sécurité Sociale (CASNOS)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date de délivrance de la carte ANAE
              </label>
              <input
                type="date"
                name="cardIssueDate"
                defaultValue={formatDateValue(profile.cardIssueDate)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Sert au suivi du renouvellement quinquennal (5 ans) et du délai NIF de 30 jours.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date de début d'activité
              </label>
              <input
                type="date"
                name="activityStartDate"
                defaultValue={formatDateValue(profile.activityStartDate)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Sert au suivi du délai d'affiliation CASNOS de 10 jours.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Statut d'affiliation CASNOS
              </label>
              <select
                name="casnosStatus"
                defaultValue={profile.casnosStatus}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="AFFILIATED">Affilié (En règle)</option>
                <option value="PENDING">En cours d'affiliation</option>
                <option value="EXEMPT">Dispensé / Autre régime</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Régime de cotisation CASNOS
              </label>
              <select
                name="casnosScheme"
                defaultValue={profile.casnosScheme}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="FLAT_24000">Forfait préférentiel (24 000 DZD/an)</option>
                <option value="STANDARD">Régime général au pourcentage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Paramètres de Facturation & Mention Légale Obligatoire */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Paramètres de Facturation & Mention d'Exonération TVA
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Préfixe de numérotation des factures
              </label>
              <input
                type="text"
                name="invoicePrefix"
                defaultValue={profile.invoicePrefix || "FAC"}
                placeholder="Ex: FAC ou INV"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Format généré : <code>{profile.invoicePrefix || "FAC"}-{new Date().getFullYear()}-0001</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Devise par défaut
              </label>
              <input
                type="text"
                disabled
                value="Dinar Algérien (DZD)"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Modèle de texte pour la mention légale d'exonération de TVA (Obligatoire) *
            </label>
            <textarea
              name="vatExemptionNote"
              required
              rows={3}
              defaultValue={profile.vatExemptionNote}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Conformément à la section 2.5 du BRD, cette mention doit être présente sur chaque facture pour justifier l'absence de TVA auprès des services fiscaux et du client.
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Enregistrement..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </form>

      {/* Section 5: Historique des Exercices Passés (Règle des 3 ans - Décision #5) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Historique des Chiffres d'Affaires Antérieurs
            </h2>
            <p className="text-xs text-slate-500">
              Renseignez les exercices clos précédents (ex: 2024, 2025) pour alimenter le suivi automatique de la règle réglementaire des 3 années consécutives (Section 2.1).
            </p>
          </div>
        </div>

        {/* Existing Past Records Table */}
        {pastTurnovers.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">Année Fiscale</th>
                  <th className="py-2.5 px-4 text-right">Chiffre d'Affaires Déclaré</th>
                  <th className="py-2.5 px-4">Statut Réglementaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pastTurnovers.map((pt) => {
                  const isExceeded = pt.turnoverDzd > REGULATORY_CONFIG.turnoverCeiling.annualLimitDzd;
                  const isNearZero = pt.turnoverDzd <= REGULATORY_CONFIG.turnoverCeiling.nearZeroThresholdDzd;

                  return (
                    <tr key={pt.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{pt.fiscalYear}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatDZD(pt.turnoverDzd)}
                      </td>
                      <td className="py-3 px-4">
                        {isExceeded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            Plafond Dépassé ({">"} 5M DZD)
                          </span>
                        ) : isNearZero ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Activité quasi-nulle (≤ 50k DZD)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Conforme au statut
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Aucun chiffre d'affaires antérieur enregistré. Si vous avez commencé votre activité avant cette année, vous pouvez enregistrer vos années passées ci-dessous.
          </p>
        )}

        {/* Add/Update Year Form */}
        <form onSubmit={handleSavePastTurnover} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 block">
            Ajouter ou mettre à jour un exercice antérieur
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Année (ex: 2024, 2025)
              </label>
              <input
                type="number"
                min="2020"
                max={new Date().getFullYear() - 1}
                required
                value={turnoverYear}
                onChange={(e) => setTurnoverYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Chiffre d'Affaires Encaissé (DZD)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                placeholder="Ex: 2500000"
                value={turnoverAmount}
                onChange={(e) => setTurnoverAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={turnoverLoading}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{turnoverLoading ? "Enregistrement..." : "Enregistrer l'exercice"}</span>
            </button>
          </div>

          {turnoverSuccess && (
            <p className="text-[11px] text-emerald-700 font-medium">
              ✓ Exercice enregistré avec succès. Le tableau de bord a été recalculé.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
