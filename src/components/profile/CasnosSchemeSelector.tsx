"use client";

import React, { useState } from "react";
import { formatDZD } from "@/lib/tax";
import { REGULATORY_CONFIG } from "@/config/regulatory";
import { Shield, Sparkles, CheckCircle2, TrendingDown, HelpCircle, Calculator } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nContext";

interface CasnosSchemeSelectorProps {
  defaultScheme?: string;
}

export function CasnosSchemeSelector({
  defaultScheme = "FLAT_24000",
}: CasnosSchemeSelectorProps) {
  const { t, locale, dir, formatAmount } = useI18n();
  const [selectedScheme, setSelectedScheme] = useState(defaultScheme);
  const [estimatedRevenue, setEstimatedRevenue] = useState<number>(1_000_000);
  const [showSimulator, setShowSimulator] = useState(false);

  const flatAnnual = REGULATORY_CONFIG.casnos.defaultAnnualContributionDzd; // 24,000 DZD
  const standardRate = REGULATORY_CONFIG.casnos.standardRate; // 15%
  const standardMin = REGULATORY_CONFIG.casnos.standardMinimumAnnualDzd; // 36,000 DZD

  // Standard calculation: 15% of estimated revenue with statutory minimum
  const standardCalculated = Math.max(standardMin, Math.round(estimatedRevenue * standardRate));
  const annualSavings = Math.max(0, standardCalculated - flatAnnual);

  return (
    <div className="space-y-4">
      {/* Hidden input for form submission */}
      <input type="hidden" name="casnosScheme" value={selectedScheme} />

      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {t("lblCasnosScheme")}
        </label>
        <button
          type="button"
          onClick={() => setShowSimulator(!showSimulator)}
          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{showSimulator ? t("btnHideSimulator") : t("btnToggleSimulator")}</span>
        </button>
      </div>

      {/* Dual Scheme Radio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Scheme 1: Forfait Auto-Entrepreneur 24,000 DZD */}
        <div
          onClick={() => setSelectedScheme("FLAT_24000")}
          className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
            selectedScheme === "FLAT_24000"
              ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                <Sparkles className="w-3 h-3" />
                {locale === "ar" ? "موصى به • القانون 22-23" : "Recommandé • Loi 22-23"}
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedScheme === "FLAT_24000"
                    ? "border-emerald-600 bg-emerald-600"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedScheme === "FLAT_24000" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("schemeFlatTitle")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("schemeFlatDesc")}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xl font-extrabold text-emerald-700">
                {formatAmount(flatAnnual)}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  {locale === "ar" ? "/ سنويًا" : "/ an"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {locale === "ar"
                  ? `أي ما يعادل ${formatAmount(flatAnnual / 12)} شهرياً، دون ارتباط بحجم المبيعات.`
                  : `Soit ${formatAmount(flatAnnual / 12)} / mois, sans lien avec le chiffre d'affaires.`}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 mt-3 text-[11px] text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {locale === "ar"
                  ? "بطاقة الشفاء والتغطية الصحية والتأمينية الشاملة"
                  : "Carte Chifa & couverture médicale complète"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {locale === "ar"
                  ? "تأمين الأمومة واحتساب فصول التقاعد القانونية"
                  : "Assurance maternité et validation des trimestres retraite"}
              </span>
            </div>
          </div>
        </div>

        {/* Scheme 2: Régime Général 15% */}
        <div
          onClick={() => setSelectedScheme("STANDARD")}
          className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
            selectedScheme === "STANDARD"
              ? "bg-slate-100 border-slate-600 ring-2 ring-slate-400/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {locale === "ar" ? "النظام العام لغير الأجراء" : "Régime Standard Non-Salarié"}
              </span>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedScheme === "STANDARD"
                    ? "border-slate-800 bg-slate-800"
                    : "border-slate-300 bg-white"
                }`}
              >
                {selectedScheme === "STANDARD" && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("schemeStandardTitle")}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("schemeStandardDesc")}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xl font-extrabold text-slate-800">
                15%{" "}
                <span className="text-xs font-semibold text-slate-500">
                  {locale === "ar" ? "من الدخل السنوي المصرح به" : "du revenu annuel"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {locale === "ar"
                  ? `الحد الأدنى القانوني ${formatAmount(standardMin)} سنوياً.`
                  : `Plancher minimum légal de ${formatAmount(standardMin)} / an.`}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 mt-3 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                {locale === "ar"
                  ? "وعاء اشتراك متغير يُصرح به سنوياً"
                  : "Assiette variable déclarée annuellement"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                {locale === "ar"
                  ? "يتطلب الاحتفاظ بمبررات ودفاتر محاسبية للأرباح"
                  : "Nécessite la tenue de justificatifs comptables de revenu"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Savings Simulator */}
      {showSimulator && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                {locale === "ar"
                  ? "محاكي توفير اشتراكات CASNOS (امتيازات النظام)"
                  : "Simulateur d'économie CASNOS (Avantage Statut)"}
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {locale === "ar" ? "التوفير السنوي :" : "Économie annuelle :"}{" "}
              <strong className="text-emerald-800 text-sm">+{formatAmount(annualSavings)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {t("simRevenueLabel")}
              </label>
              <input
                type="number"
                step="50000"
                min="0"
                max="5000000"
                value={estimatedRevenue}
                onChange={(e) => setEstimatedRevenue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>{locale === "ar" ? "النظام العام 15% :" : "Régime 15% :"}</span>
                <span className="font-semibold">{formatAmount(standardCalculated)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>{locale === "ar" ? "نظام المقاول الذاتي :" : "Forfait ANAE :"}</span>
                <span>{formatAmount(flatAnnual)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-teal-700 pt-1 border-t border-slate-100 font-semibold">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  {locale === "ar" ? "قيمة التوفير :" : "Vous économisez :"}
                </span>
                <span>{formatAmount(annualSavings)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CasnosSchemeSelector;
