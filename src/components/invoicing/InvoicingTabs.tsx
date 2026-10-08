"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FileSpreadsheet, RotateCcw, Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";

interface InvoicingTabsProps {
  counts?: {
    invoices?: number;
    quotes?: number;
    creditNotes?: number;
  };
}

export function InvoicingTabs({ counts }: InvoicingTabsProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const tabs = [
    {
      href: "/invoices",
      label: t("tabInvoices"),
      icon: FileText,
      count: counts?.invoices,
      isActive:
        pathname === "/invoices" ||
        (pathname.startsWith("/invoices/") && !pathname.includes("tax-summary")),
    },
    {
      href: "/quotes",
      label: t("tabQuotes"),
      icon: FileSpreadsheet,
      count: counts?.quotes,
      isActive: pathname === "/quotes" || pathname.startsWith("/quotes/"),
    },
    {
      href: "/credit-notes",
      label: t("tabCreditNotes"),
      icon: RotateCcw,
      count: counts?.creditNotes,
      isActive: pathname === "/credit-notes" || pathname.startsWith("/credit-notes/"),
    },
    {
      href: "/tax-summary",
      label: t("tabTaxSummary"),
      icon: Calendar,
      isActive: pathname.startsWith("/tax-summary"),
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl border border-slate-200/80 w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab.isActive
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 ${
                tab.isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab.isActive
                    ? "bg-slate-100 text-slate-700"
                    : "bg-slate-300/60 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default InvoicingTabs;
