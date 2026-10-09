"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  createAccountantAccessAction,
  revokeAccountantAccessAction,
  deleteAccountantAccessAction,
} from "@/app/actions";
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Ban,
  Download,
  Plus,
  FileText,
  AlertCircle,
  FileArchive,
  RefreshCw,
  Info,
  CheckCircle2,
} from "lucide-react";

export interface SerializedAccountantAccess {
  id: string;
  token: string;
  name: string;
  email: string | null;
  fiscalYear: number | null;
  hasPin: boolean;
  expiresAt: string | null;
  isRevoked: boolean;
  lastAccessedAt: string | null;
  accessCount: number;
  notes: string | null;
  createdAt: string;
}

interface AccountantManagementClientProps {
  initialAccesses: SerializedAccountantAccess[];
  availableYears: number[];
  currentYear: number;
  tenantName: string;
}

export function AccountantManagementClient({
  initialAccesses,
  availableYears,
  currentYear,
  tenantName,
}: AccountantManagementClientProps) {
  const { t, dir } = useI18n();

  const [accesses, setAccesses] = useState<SerializedAccountantAccess[]>(initialAccesses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [duration, setDuration] = useState("30");
  const [fiscalYear, setFiscalYear] = useState<string>("all");
  const [notes, setNotes] = useState("");

  // Newly created link showcase banner
  const [newlyCreated, setNewlyCreated] = useState<{
    token: string;
    pin: string | null;
    name: string;
  } | null>(null);

  // Copied feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Quick direct zip download state
  const [downloadYear, setDownloadYear] = useState<number>(currentYear);
  const [isDownloadingDirectZip, setIsDownloadingDirectZip] = useState(false);

  // Loading actions tracker
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const getPortalUrl = (token: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/portal/accountant/${token}`;
    }
    return `/portal/accountant/${token}`;
  };

  const handleCopyLink = async (token: string) => {
    const url = getPortalUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch {
      // Fallback
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    }
  };

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(randomPin);
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      if (email.trim()) formData.set("email", email.trim());
      if (pin.trim()) formData.set("pin", pin.trim());
      if (notes.trim()) formData.set("notes", notes.trim());
      formData.set("expiresInDays", duration === "permanent" ? "0" : duration);
      if (fiscalYear !== "all") {
        formData.set("fiscalYear", fiscalYear);
      }

      const res = await createAccountantAccessAction(formData);

      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.access) {
        const newAccess: SerializedAccountantAccess = {
          id: res.access.id,
          token: res.access.token,
          name: res.access.name,
          email: res.access.email,
          fiscalYear: res.access.fiscalYear,
          hasPin: !!res.access.pinHash,
          expiresAt: res.access.expiresAt ? new Date(res.access.expiresAt).toISOString() : null,
          isRevoked: res.access.isRevoked,
          lastAccessedAt: null,
          accessCount: 0,
          notes: res.access.notes,
          createdAt: new Date().toISOString(),
        };

        setAccesses([newAccess, ...accesses]);
        setNewlyCreated({
          token: res.access.token,
          pin: res.rawPin || null,
          name: res.access.name,
        });

        // Reset form
        setName("");
        setEmail("");
        setPin("");
        setDuration("30");
        setFiscalYear("all");
        setNotes("");
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la création.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (accessId: string) => {
    if (!confirm(t("confirmRevokeAccess"))) return;
    setLoadingActionId(accessId);
    try {
      const res = await revokeAccountantAccessAction(accessId);
      if (!res.error) {
        setAccesses(
          accesses.map((a) => (a.id === accessId ? { ...a, isRevoked: true } : a))
        );
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (accessId: string) => {
    if (!confirm("Voulez-vous supprimer définitivement cet accès comptable ?")) return;
    setLoadingActionId(accessId);
    try {
      const res = await deleteAccountantAccessAction(accessId);
      if (!res.error) {
        setAccesses(accesses.filter((a) => a.id !== accessId));
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDownloadDirectZip = () => {
    setIsDownloadingDirectZip(true);
    const link = document.createElement("a");
    link.href = `/api/accountant/export-zip?year=${downloadYear}`;
    link.download = `Pack_Audit_${downloadYear}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloadingDirectZip(false), 2000);
  };

  return (
    <div className="space-y-8" dir={dir}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LOI N° 22-23 — CONTRÔLE & AUDIT FISCAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("accountantAccessTitle")}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-2xl">
            {t("accountantAccessSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("btnNewAccountantInvite")}</span>
          </button>
        </div>
      </div>

      {/* Direct Audit Archive Download Card for the Auto-Entrepreneur */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-800/50">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              <FileArchive className="w-3.5 h-3.5" />
              <span>PACK D&apos;AUDIT FISCAL COMPLET (ZIP)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Téléchargement direct de votre dossier comptable annuel
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Générez en un clic l&apos;archive officielle certifiée contenant :
              <br />
              • <strong className="text-white">Bilan Fiscal Série G n° 12 bis (PDF)</strong> avec code de contrôle
              <br />
              • <strong className="text-white">Livre des Recettes (CSV)</strong> conforme au décret d&apos;application
              <br />
              • <strong className="text-white">Registre des Dépenses d&apos;Exploitation (CSV)</strong>
              <br />
              • <strong className="text-white">Grand Livre Clients (CSV)</strong> et{" "}
              <strong className="text-white">Attestation d&apos;Audit Loi 22-23 (TXT)</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/15">
            <div className="flex items-center gap-2 px-3 py-1 text-xs text-slate-200">
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span>Exercice :</span>
            </div>
            <select
              value={downloadYear}
              onChange={(e) => setDownloadYear(parseInt(e.target.value, 10))}
              className="bg-slate-800 text-white text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Exercice {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleDownloadDirectZip}
              disabled={isDownloadingDirectZip}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isDownloadingDirectZip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t("downloadingAuditZip")}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t("downloadAuditZipBtn")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Newly Created Access Link Showcase */}
      {newlyCreated && (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-emerald-950">
                Invitation créée avec succès pour {newlyCreated.name} !
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Partagez ce lien sécurisé avec votre expert-comptable ou commissaire aux comptes.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={getPortalUrl(newlyCreated.token)}
                  className="flex-1 bg-white border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-mono rounded-xl px-3.5 py-2.5 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyLink(newlyCreated.token)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  {copiedToken === newlyCreated.token ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t("copyAccessLink")}</span>
                    </>
                  )}
                </button>
                <a
                  href={getPortalUrl(newlyCreated.token)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Tester le portail</span>
                </a>
              </div>

              {newlyCreated.pin && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-xs text-emerald-900 font-medium">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Code PIN requis pour cet auditeur :{" "}
                    <strong className="font-mono text-emerald-950 text-sm tracking-wider">
                      {newlyCreated.pin}
                    </strong>{" "}
                    (Transmettez ce code confidentiellement à l&apos;auditeur).
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Invites List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("activeInvitesTitle")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("activeInvitesDesc")}
            </p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {accesses.length} {accesses.length === 1 ? "invitation enregistrée" : "invitations enregistrées"}
          </div>
        </div>

        {accesses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {t("noAccountantInvites")}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Invitez votre expert-comptable pour qu&apos;il puisse vérifier votre conformité légale, auditer vos recettes et préparer vos attestations.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("btnNewAccountantInvite")}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Expert-Comptable / Cabinet</th>
                  <th className="py-3 px-4">Exercice</th>
                  <th className="py-3 px-4">Sécurité</th>
                  <th className="py-3 px-4">Validité</th>
                  <th className="py-3 px-4">Activité</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accesses.map((acc) => {
                  const isExpired = acc.expiresAt && new Date(acc.expiresAt) < new Date();
                  const isRevoked = acc.isRevoked;
                  const isActive = !isRevoked && !isExpired;

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        !isActive ? "bg-slate-50/40 opacity-70" : ""
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{acc.name}</span>
                        </div>
                        {acc.email && (
                          <div className="text-slate-500 text-xs mt-0.5">{acc.email}</div>
                        )}
                        {acc.notes && (
                          <div className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                            &quot;{acc.notes}&quot;
                          </div>
                        )}
                      </td>

                      {/* Fiscal Year */}
                      <td className="py-4 px-4 font-medium text-slate-700">
                        {acc.fiscalYear ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                            {acc.fiscalYear}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">{t("allFiscalYears")}</span>
                        )}
                      </td>

                      {/* Security (PIN vs Open) */}
                      <td className="py-4 px-4">
                        {acc.hasPin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>{t("pinProtectedBadge")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                            <span>{t("openAccessBadge")}</span>
                          </span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {acc.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(acc.expiresAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Permanente</span>
                        )}
                      </td>

                      {/* Activity / Telemetry */}
                      <td className="py-4 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {acc.accessCount} {acc.accessCount === 1 ? "vue" : "vues"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {acc.lastAccessedAt
                            ? new Date(acc.lastAccessedAt).toLocaleDateString()
                            : t("neverAccessed")}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                            {t("statusRevokedInvite")}
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                            {t("statusExpiredInvite")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            {t("statusActiveInvite")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(acc.token)}
                            title={t("copyAccessLink")}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            {copiedToken === acc.token ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Open Portal Link */}
                          <a
                            href={getPortalUrl(acc.token)}
                            target="_blank"
                            rel="noreferrer"
                            title="Consulter le portail"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Revoke button */}
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(acc.id)}
                              disabled={loadingActionId === acc.id}
                              title={t("btnRevokeAccess")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer disabled:opacity-50"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(acc.id)}
                            disabled={loadingActionId === acc.id}
                            title={t("btnDeleteAccess")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Invitation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t("btnNewAccountantInvite")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Accès sécurisé en lecture seule pour votre auditeur légal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAccess} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Accountant Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("accountantNameLabel")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("accountantNamePlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("accountantEmailLabel")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("accountantEmailPlaceholder")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                />
              </div>

              {/* PIN Code with Random Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("accountantPinLabel")}
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Générer un PIN à 6 chiffres
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\s+/g, ""))}
                    placeholder={t("accountantPinPlaceholder")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-sm text-slate-900"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t("accountantPinHelp")}
                </p>
              </div>

              {/* Duration and Fiscal Year grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("accountantDurationLabel")}
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                  >
                    <option value="7">{t("duration7Days")}</option>
                    <option value="30">{t("duration30Days")}</option>
                    <option value="90">{t("duration90Days")}</option>
                    <option value="permanent">{t("durationPermanent")}</option>
                  </select>
                </div>

                {/* Fiscal Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("accountantFiscalYearLabel")}
                  </label>
                  <select
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
                  >
                    <option value="all">{t("allFiscalYears")}</option>
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr.toString()}>
                        Exercice {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("accountantNotesLabel")}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("accountantNotesPlaceholder")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-900 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Générer le lien sécurisé</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
