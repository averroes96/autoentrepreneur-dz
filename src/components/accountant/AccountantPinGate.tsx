"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { verifyAccountantPinAction } from "@/app/actions";
import { Lock, ShieldCheck, KeyRound, AlertCircle, RefreshCw } from "lucide-react";

interface AccountantPinGateProps {
  token: string;
  accountantName: string;
  tenantName: string;
  notes?: string | null;
}

export function AccountantPinGate({
  token,
  accountantName,
  tenantName,
  notes,
}: AccountantPinGateProps) {
  const { t, dir } = useI18n();
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await verifyAccountantPinAction(token, pin.trim());
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        // Reload to let server read HTTP-only cookie
        window.location.reload();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la vérification du code PIN.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-6"
      dir={dir}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Badge */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-600/30">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold tracking-wider uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t("portalHeaderBadge")}</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t("portalPinRequiredTitle")}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Dossier d&apos;audit légal de <strong className="text-slate-800">{tenantName}</strong> préparé pour{" "}
            <strong className="text-indigo-600">{accountantName}</strong>.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <p className="text-xs text-slate-600 mb-6 text-center leading-relaxed">
            {t("portalPinRequiredDesc")}
          </p>

          {notes && (
            <div className="mb-6 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
              <span className="font-semibold not-italic block text-slate-900 mb-0.5">
                Note de l&apos;auto-entrepreneur :
              </span>
              &quot;{notes}&quot;
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                {t("portalPinInputLabel")}
              </label>
              <div className="relative max-w-xs mx-auto">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  required
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\s+/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || pin.trim().length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification en cours...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t("btnUnlockAudit")}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Plateforme certifiée Moukawil.dz • Conforme Décret exécutif n° 23-197
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
