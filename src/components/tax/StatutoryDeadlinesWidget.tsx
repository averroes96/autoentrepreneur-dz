"use client";

import React from "react";
import {
  StatutoryDeadline,
  getStatutoryDeadlines,
  ProfileDatesInput,
} from "@/lib/statutoryCalendar";
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Building,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface StatutoryDeadlinesWidgetProps {
  fiscalYear: number;
  profile?: ProfileDatesInput;
  deadlines?: StatutoryDeadline[];
  showTitle?: boolean;
}

export function StatutoryDeadlinesWidget({
  fiscalYear,
  profile,
  deadlines: propDeadlines,
  showTitle = true,
}: StatutoryDeadlinesWidgetProps) {
  const { t, locale, formatDate } = useI18n();
  const rawDeadlines = propDeadlines || getStatutoryDeadlines(fiscalYear, profile);

  // In Arabic mode, provide authentic Algerian administrative translations for each statutory deadline
  const deadlines = rawDeadlines.map((dl) => {
    if (locale === "ar") {
      let title = dl.title;
      let description = dl.description;
      let recipient = dl.recipient;
      let badgeLabel = dl.badgeLabel;

      if (dl.id === "ifu-declaration") {
        title = `التصريح السنوي ودفع الضريبة الجزافية الوحيدة (IFU ${fiscalYear})`;
        description = `التصريح برقم الأعمال السنوي المحصل لـ ${fiscalYear} ودفع نسبة 0.5% (أو الحد الأدنى 10 000 دج) قبل 31 جانفي لدى قباضة الضرائب.`;
        recipient = "قباضة الضرائب التابع لها (DGI)";
      } else if (dl.id === "casnos-annual") {
        title = `دفع الاشتراك السنوي للضمان الاجتماعي (CASNOS ${fiscalYear})`;
        description = `آخر أجل لتسوية الاشتراك السنوي للمقاول الذاتي (24 000 دج) قبل 30 جوان لتفادي غرامات التأخير والحفاظ على بطاقة الشفاء.`;
        recipient = "الصندوق الوطني للضمان الاجتماعي لغير الأجراء (CASNOS)";
      } else if (dl.id === "casnos-affiliation") {
        title = "الانتساب الأولي لصندوق الضمان الاجتماعي (CASNOS)";
        description = "إيداع ملف الانتساب الإلزامي خلال 10 أيام من الحصول على بطاقة المقاول الذاتي للاستفادة من التغطية الصحية والتأمين.";
        recipient = "وكالة CASNOS المختصة إقليميًا";
      } else if (dl.id === "dgi-existence") {
        title = "التصريح بالوجود الجبائي واستخراج رقم NIF (DGI)";
        description = "إيداع التصريح بالوجود (الاستمارة G n° 8) لدى مفتشية الضرائب خلال 30 يومًا من بدء النشاط.";
        recipient = "مفتشية الضرائب (DGI)";
      } else if (dl.id === "anae-renewal") {
        title = "تجديد بطاقة المقاول الذاتي كل 5 سنوات (ANAE)";
        description = "تجديد بطاقة المقاول الذاتي سارية المفعول لمدة 5 سنوات قابلة للتجديد وفقًا للمرسوم التنفيذي 23-197.";
        recipient = "الوكالة الوطنية للمقاول الذاتي (ANAE)";
      }

      // Translate countdown badge
      if (dl.daysRemaining !== undefined) {
        if (dl.daysRemaining < 0) {
          badgeLabel = `فات الأجل بـ ${Math.abs(dl.daysRemaining)} يوم`;
        } else if (dl.daysRemaining === 0) {
          badgeLabel = "اليوم الأخير !";
        } else {
          badgeLabel = `${dl.daysRemaining} يوم متبقي`;
        }
      } else if (dl.urgency === "COMPLETED") {
        if (dl.id === "casnos-affiliation") badgeLabel = "مؤمّن (بطاقة الشفاء نشطة) ✓";
        else if (dl.id === "dgi-existence") badgeLabel = "تم منح رقم NIF بنجاح ✓";
        else badgeLabel = "تمت التسوية بنجاح ✓";
      }

      return {
        ...dl,
        title,
        description,
        recipient,
        badgeLabel,
      };
    }

    return dl;
  });

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {t("statutoryCalendarTitle")}
              </h2>
              <p className="text-xs text-slate-500">
                {t("statutoryCalendarSubtitle")}
              </p>
            </div>
          </div>
          <a
            href="https://jibayatic.mfdgi.gov.dz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
          >
            <span>{t("jibayaticPortal")}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {deadlines.map((dl) => {
          const isFiscal = dl.category === "FISCAL";
          const isSocial = dl.category === "SOCIAL";

          return (
            <div
              key={dl.id}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                dl.urgency === "URGENT" || dl.urgency === "OVERDUE"
                  ? "bg-rose-50/50 border-rose-200 ring-1 ring-rose-300/40"
                  : dl.urgency === "WARNING"
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isFiscal
                        ? "bg-emerald-100 text-emerald-800"
                        : isSocial
                        ? "bg-sky-100 text-sky-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isFiscal ? t("catFiscal") : isSocial ? t("catSocial") : t("catAnae")}
                  </span>

                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${dl.badgeColor}`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{dl.badgeLabel}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {dl.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {dl.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t("legalDeadlineLimit")}</span>
                  <span className="font-bold text-slate-800">
                    {formatDate(dl.targetDate)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 truncate" title={dl.recipient}>
                  {t("organismLabel")} {dl.recipient}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StatutoryDeadlinesWidget;
