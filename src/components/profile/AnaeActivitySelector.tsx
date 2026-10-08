"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ANAE_BRANCHES,
  ANAE_ACTIVITIES,
  searchAnaeActivities,
  getActivityByCode,
  getBranchById,
  AnaeActivity,
} from "@/data/anaeActivities";
import {
  Search,
  Check,
  ChevronDown,
  Sparkles,
  Briefcase,
  Code,
  Home,
  UserCheck,
  Smile,
  Building2,
  Palette,
  ExternalLink,
  Edit3,
} from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nContext";

interface AnaeActivitySelectorProps {
  initialCode?: string;
  initialLabel?: string;
}

export function AnaeActivitySelector({
  initialCode = "",
  initialLabel = "",
}: AnaeActivitySelectorProps) {
  const { t, locale, dir } = useI18n();
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredActivities = useMemo(() => {
    return searchAnaeActivities(searchQuery, selectedBranch);
  }, [searchQuery, selectedBranch]);

  const currentActivity = useMemo(() => {
    return getActivityByCode(selectedCode);
  }, [selectedCode]);

  const currentBranch = useMemo(() => {
    if (currentActivity) {
      return getBranchById(currentActivity.branchId);
    }
    if (selectedCode && selectedCode.length >= 2) {
      return getBranchById(selectedCode.slice(0, 2));
    }
    return undefined;
  }, [currentActivity, selectedCode]);

  const handleSelect = (activity: AnaeActivity) => {
    setSelectedCode(activity.code);
    setSelectedLabel(activity.label);
    setIsCustomMode(false);
    setIsOpen(false);
  };

  const getBranchIcon = (branchId: string) => {
    switch (branchId) {
      case "01": return Briefcase;
      case "02": return Code;
      case "03": return Home;
      case "04": return UserCheck;
      case "05": return Smile;
      case "06": return Building2;
      case "07": return Palette;
      default: return Briefcase;
    }
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="activityCode" value={selectedCode} />
      <input type="hidden" name="activityLabel" value={selectedLabel} />

      {/* Selected Activity Preview Card */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t("anaeDomainNational")}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              {t("anaeOfficialNomenclature")}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-[11px] font-medium text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isCustomMode ? t("btnChooseFromList") : t("btnManualEntry")}</span>
          </button>
        </div>

        {/* If Custom Mode */}
        {isCustomMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t("lblAnaeCode6")}
              </label>
              <input
                type="text"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Ex: 020101"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {t("lblExactServiceLabel")}
              </label>
              <input
                type="text"
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value)}
                placeholder="Ex: Développement d'applications web"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        ) : (
          /* Nomenclature Selector Display */
          <div className="space-y-2">
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between cursor-pointer shadow-2xs transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  {currentBranch ? (
                    (() => {
                      const Icon = getBranchIcon(currentBranch.id);
                      return <Icon className="w-4 h-4" />;
                    })()
                  ) : (
                    <Briefcase className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {selectedCode || (locale === "ar" ? "رمز غير محدد" : "Code non défini")}
                    </span>
                    {currentBranch && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {locale === "ar" ? currentBranch.labelAr : currentBranch.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                    {selectedLabel || (locale === "ar" ? "انقر لاختيار نشاطك الرسمي من القائمة..." : "Cliquez pour sélectionner votre métier officiel...")}
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Nomenclature Menu */}
      {isOpen && !isCustomMode && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchAnaePlaceholder")}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 7 Official Branches Filter Pills */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {locale === "ar" ? "تصفية حسب فروع الوكالة (المرسوم 23-197) :" : "Filtrer par Domaine ANAE (Décret 23-197) :"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBranch("ALL")}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  selectedBranch === "ALL"
                    ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("allBranches")} ({ANAE_ACTIVITIES.length})
              </button>

              {ANAE_BRANCHES.map((b) => {
                const Icon = getBranchIcon(b.id);
                const isActive = selectedBranch === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b.id)}
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>
                      {b.code} - {locale === "ar" ? b.labelAr : b.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activities list */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
            {filteredActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {locale === "ar"
                  ? "لم يتم العثور على أي نشاط يطابق هذا البحث. يمكنك استخدام الإدخال اليدوي أعلاه."
                  : "Aucune activité trouvée pour cette recherche. Vous pouvez utiliser la saisie manuelle ci-dessus."}
              </div>
            ) : (
              filteredActivities.map((act) => {
                const isSelected = selectedCode === act.code;
                const branch = getBranchById(act.branchId);
                const Icon = getBranchIcon(act.branchId);

                return (
                  <div
                    key={act.code}
                    onClick={() => handleSelect(act)}
                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? "bg-emerald-50/80 border border-emerald-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-100">
                            {act.code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {locale === "ar" ? branch?.labelAr : branch?.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-900 mt-0.5 leading-snug">
                          {act.label}
                        </p>
                        <p className="text-[11px] text-slate-500 font-arabic mt-0.5" dir="rtl">
                          {act.labelAr}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with official link */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <span>
              {locale === "ar"
                ? "المرجع: المرسوم التنفيذي رقم 23-197 المؤرخ في 25 مايو 2023"
                : "Réf : Décret exécutif n° 23-197 du 25 mai 2023"}
            </span>
            <a
              href="https://anae.dz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
            >
              <span>{locale === "ar" ? "البوابة الرسمية anae.dz" : "Portail officiel anae.dz"}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnaeActivitySelector;
