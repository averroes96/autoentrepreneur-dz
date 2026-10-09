"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction, savePastTurnoverAction } from "@/app/actions";
import { formatDZD } from "@/lib/tax";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import Link from "next/link";
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
  Database,
} from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profile";
import { NifInputWithValidation } from "./NifInputWithValidation";
import { AnaeActivitySelector } from "./AnaeActivitySelector";
import { CasnosSchemeSelector } from "./CasnosSchemeSelector";
import { useI18n } from "@/lib/i18n/I18nContext";

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
  quotePrefix?: string | null;
  creditNotePrefix?: string | null;
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
  const router = useRouter();
  const { t, locale, dir, formatAmount } = useI18n();
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
        router.refresh();
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
        router.refresh();
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {locale === "ar" ? "الملف الشخصي والإعدادات القانونية" : "Profil & Paramètres Réglementaires"}
          </h1>
          <p className="text-sm text-slate-500">
            {locale === "ar"
              ? "ضبط البيانات القانونية الإلزامية، أرقام التعريف المعتمدة ANAE/DGI، وسجل نشاطك التجاري."
              : "Configurez vos mentions légales obligatoires, vos identifiants ANAE/DGI et l'historique de votre statut."}
          </p>
        </div>

        <Link
          href="/backup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold shadow-2xs transition self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-purple-600" />
          <span>{locale === "ar" ? "الخزنة الرقمية والنسخ الاحتياطي" : "Coffre-fort & Sauvegardes"}</span>
        </Link>
      </div>

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
                  ? t("profile100Compliant")
                  : t("profilePercentCompliant", { percent: completion.percentage })}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {t("profileValidatedFields", {
                  completed: completion.completedCount,
                  total: completion.totalCount,
                })}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {t("regulatoryProfileCompliance")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("regulatoryProfileComplianceDesc")}
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
              <span className="font-medium truncate text-[11px]">
                {item.key === "fullName"
                  ? t("chkFullName")
                  : item.key === "rnaeNumber"
                  ? t("chkRnae")
                  : item.key === "nif"
                  ? t("chkNif")
                  : item.key === "activityCode"
                  ? t("chkActivity")
                  : item.key === "address"
                  ? t("chkAddress")
                  : t("chkStartDate")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t("profileUpdatedSuccess")}</span>
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
              {t("secIdentityContact")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblFullName")}
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
                {t("lblEmail")}
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
                {t("lblPhone")}
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
                {t("lblAddress")}
              </label>
              <input
                type="text"
                name="address"
                required
                defaultValue={profile.address}
                placeholder={t("lblAddressPlaceholder")}
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
              {t("secAdminIdentifiers")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblRnae")}
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
                {t("hintRnae")}
              </span>
            </div>

            {/* NIF avec Validation Automatique 15 Chiffres & Détection Wilaya */}
            <div>
              <NifInputWithValidation defaultValue={profile.nif} name="nif" />
            </div>
          </div>

          {/* 7 Domaines Officiels ANAE : Menu Déroulant Recherchable (Décret exécutif n° 23-197) */}
          <div className="pt-2 border-t border-slate-100">
            <AnaeActivitySelector
              initialCode={profile.activityCode}
              initialLabel={profile.activityLabel}
            />
          </div>
        </div>

        {/* Section 3: Dates Clés & Sécurité Sociale (CASNOS) */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t("secDatesCasnos")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblCardIssueDate")}
              </label>
              <input
                type="date"
                name="cardIssueDate"
                defaultValue={formatDateValue(profile.cardIssueDate)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t("hintCardIssueDate")}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblActivityStartDate")}
              </label>
              <input
                type="date"
                name="activityStartDate"
                defaultValue={formatDateValue(profile.activityStartDate)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t("hintActivityStartDate")}
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblCasnosStatus")}
              </label>
              <select
                name="casnosStatus"
                defaultValue={profile.casnosStatus}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="AFFILIATED">{t("optAffiliated")}</option>
                <option value="PENDING">{t("optPendingAffiliation")}</option>
                <option value="EXEMPT">{t("optExemptAffiliation")}</option>
              </select>
            </div>
          </div>

          {/* Sélecteur Double Régime CASNOS & Simulateur d'Économie */}
          <div className="pt-2 border-t border-slate-100">
            <CasnosSchemeSelector defaultScheme={profile.casnosScheme} />
          </div>
        </div>

        {/* Section 4: Paramètres de Facturation & Mention Légale Obligatoire */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {t("secInvoicingSettings")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblInvoicePrefix")}
              </label>
              <input
                type="text"
                name="invoicePrefix"
                defaultValue={profile.invoicePrefix || "FAC"}
                placeholder="Ex: FAC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: <code>{profile.invoicePrefix || "FAC"}-{new Date().getFullYear()}-0001</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblQuotePrefix")}
              </label>
              <input
                type="text"
                name="quotePrefix"
                defaultValue={profile.quotePrefix || "DEV"}
                placeholder="Ex: DEV"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: <code>{profile.quotePrefix || "DEV"}-{new Date().getFullYear()}-0001</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("lblCreditNotePrefix")}
              </label>
              <input
                type="text"
                name="creditNotePrefix"
                defaultValue={profile.creditNotePrefix || "AVR"}
                placeholder="Ex: AVR"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: <code>{profile.creditNotePrefix || "AVR"}-{new Date().getFullYear()}-0001</code>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("lblVatExemptionNote")}
            </label>
            <textarea
              name="vatExemptionNote"
              required
              rows={3}
              defaultValue={profile.vatExemptionNote}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {t("hintVatExemptionNote")}
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
            <span>{loading ? t("btnSaving") : t("btnSaveProfile")}</span>
          </button>
        </div>
      </form>

      {/* Section 5: Historique des Exercices Passés (Règle des 3 ans - Décision #5) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("secPastTurnover")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("secPastTurnoverDesc")}
            </p>
          </div>
        </div>

        {/* Existing Past Records Table */}
        {pastTurnovers.length > 0 ? (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">{t("colFiscalYear")}</th>
                  <th className="py-2.5 px-4 text-right">{t("colDeclaredTurnover")}</th>
                  <th className="py-2.5 px-4">{t("colRegulatoryStatus")}</th>
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
                        {formatAmount(pt.turnoverDzd)}
                      </td>
                      <td className="py-3 px-4">
                        {isExceeded ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                            {t("statusCeilingExceeded")}
                          </span>
                        ) : isNearZero ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                            {t("statusNearZeroActivity")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            {t("statusStatusCompliant")}
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
            {t("noPastTurnover")}
          </p>
        )}

        {/* Add/Update Year Form */}
        <form onSubmit={handleSavePastTurnover} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 block">
            {t("addOrUpdateYear")}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t("lblYear")}
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
                {t("lblCollectedTurnoverDzd")}
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
              <span>{turnoverLoading ? t("btnSaving") : t("btnSaveYear")}</span>
            </button>
          </div>

          {turnoverSuccess && (
            <p className="text-[11px] text-emerald-700 font-medium">
              {t("yearSavedSuccess")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
