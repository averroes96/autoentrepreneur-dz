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
  FileSpreadsheet,
  Building,
} from "lucide-react";

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
  const deadlines = propDeadlines || getStatutoryDeadlines(fiscalYear, profile);

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
                Calendrier des Obligations Statutaires & Échéances Légales
              </h2>
              <p className="text-xs text-slate-500">
                Comptes à rebours officiels pour l'administration fiscale (DGI / IFU) et la sécurité sociale (CASNOS)
              </p>
            </div>
          </div>
          <a
            href="https://jibayatic.mfdgi.gov.dz"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
          >
            <span>Portail Jibayatic</span>
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
                    {isFiscal ? "Fiscalité (DGI)" : isSocial ? "Sécurité Sociale" : "Statut ANAE"}
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
                  <span className="text-slate-400">Date limite légale :</span>
                  <span className="font-bold text-slate-800">
                    {dl.targetDate.toLocaleDateString("fr-DZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 truncate" title={dl.recipient}>
                  Organisme : {dl.recipient}
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
