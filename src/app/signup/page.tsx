"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/app/actions";
import { ShieldCheck, ArrowRight, Lock, Mail, User, Building, AlertCircle, FileText, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

export default function SignupPage() {
  const router = useRouter();
  const { t, locale, dir } = useI18n();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await signupAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (res?.success) {
        setIsRedirecting(true);
        router.push("/dashboard");
        router.refresh();
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.replace("/dashboard");
          }
        }, 150);
      } else {
        setError(locale === "ar" ? "حدث خطأ غير متوقع." : "Une réponse inattendue est survenue.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || (locale === "ar" ? "خطأ في إنشاء الحساب." : "Erreur lors de la création du compte."));
      setLoading(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Language Switcher in Top Corner */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
        <LanguageToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 items-center justify-center text-emerald-400 shadow-xl mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {t("signupTitleBadge")}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {t("signupSubtitleDetail")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("businessNameLabel")} *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="businessName"
                  required
                  placeholder={t("businessNamePlaceholder")}
                  className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("fullNameInputLabel")}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder={t("fullNamePlaceholder")}
                  className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t("rnaeCardLabel")}
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="rnaeNumber"
                    placeholder="Ex: 24-001234"
                    className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t("nifFiscalLabel")}
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="nif"
                    placeholder="Ex: 198016010023456"
                    className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("emailInputLabel")} *
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="votre.email@exemple.dz"
                  className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("passwordMinLengthLabel")}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className={`absolute inset-y-0 ${dir === "rtl" ? "right-0 pr-3.5" : "left-0 pl-3.5"} flex items-center pointer-events-none text-slate-400`}>
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className={`block w-full ${dir === "rtl" ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isRedirecting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("accountCreatedRedirect")}</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("creatingSpace")}</span>
                </>
              ) : (
                <>
                  <span>{t("btnCreateMySpace")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition"
              >
                {t("btnSignIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
