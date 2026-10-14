"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
  ChevronDown,
  Calendar,
  Receipt,
  Briefcase,
  Database,
  Palette,
  CreditCard,
  Award,
  User,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useI18n } from "@/lib/i18n/I18nContext";

interface NavbarProps {
  user: {
    fullName: string;
    email: string;
  };
  tenantName: string;
}

export function Navbar({ user, tenantName }: NavbarProps) {
  const pathname = usePathname();
  const { t, locale, dir } = useI18n();

  // Invoicing Dropdown state
  const [invoicingDropdownOpen, setInvoicingDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Settings / Parameters Dropdown state
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const settingsCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setInvoicingDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setInvoicingDropdownOpen(false);
    }, 200);
  };

  const handleSettingsMouseEnter = () => {
    if (settingsCloseTimeoutRef.current) {
      clearTimeout(settingsCloseTimeoutRef.current);
      settingsCloseTimeoutRef.current = null;
    }
    setSettingsDropdownOpen(true);
  };

  const handleSettingsMouseLeave = () => {
    if (settingsCloseTimeoutRef.current) {
      clearTimeout(settingsCloseTimeoutRef.current);
    }
    settingsCloseTimeoutRef.current = setTimeout(() => {
      setSettingsDropdownOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (settingsCloseTimeoutRef.current) clearTimeout(settingsCloseTimeoutRef.current);
    };
  }, []);

  const isInvoicingActive =
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/credit-notes") ||
    pathname.startsWith("/tax-summary") ||
    pathname.startsWith("/accountant");

  const isSettingsActive =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/backup");

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInvoicingDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setInvoicingDropdownOpen(false);
    setSettingsDropdownOpen(false);
  }, [pathname]);

  const invoicingSubItems = [
    {
      href: "/invoices",
      label: t("invoices"),
      desc: t("invoicesDesc"),
      icon: FileText,
      isActive: pathname.startsWith("/invoices"),
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      href: "/quotes",
      label: t("quotes"),
      desc: t("quotesDesc"),
      icon: FileSpreadsheet,
      isActive: pathname.startsWith("/quotes"),
      color: "text-sky-600 bg-sky-50",
    },
    {
      href: "/credit-notes",
      label: t("creditNotes"),
      desc: t("creditNotesDesc"),
      icon: RotateCcw,
      isActive: pathname.startsWith("/credit-notes"),
      color: "text-rose-600 bg-rose-50",
    },
    {
      href: "/tax-summary",
      label: t("taxSummary"),
      desc: t("taxSummaryDesc"),
      icon: Calendar,
      isActive: pathname.startsWith("/tax-summary"),
      color: "text-amber-600 bg-amber-50",
    },
    {
      href: "/accountant",
      label: t("accountantNavLabel"),
      desc: t("accountantNavDesc"),
      icon: Briefcase,
      isActive: pathname.startsWith("/accountant"),
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  const settingsSubItems = [
    {
      href: "/profile?tab=identity",
      label: t("legalProfileNavLabel"),
      desc: t("legalProfileNavDesc"),
      icon: User,
      isActive: pathname === "/profile",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      href: "/settings/document-design",
      label: t("designStudioNavLabel"),
      desc: t("designStudioNavDesc"),
      icon: Palette,
      isActive: pathname.startsWith("/settings/document-design"),
      color: "text-violet-600 bg-violet-50",
      badge: "WYSIWYG",
    },
    {
      href: "/profile?tab=banking",
      label: t("bankingNavLabel"),
      desc: t("bankingNavDesc"),
      icon: CreditCard,
      isActive: pathname === "/profile",
      color: "text-blue-600 bg-blue-50",
    },
    {
      href: "/profile?tab=seal",
      label: t("sealNavLabel"),
      desc: t("sealNavDesc"),
      icon: Award,
      isActive: pathname === "/profile",
      color: "text-purple-600 bg-purple-50",
    },
    {
      href: "/profile?tab=invoicing",
      label: t("invoicingSettingsNavLabel"),
      desc: t("invoicingSettingsNavDesc"),
      icon: FileText,
      isActive: pathname === "/profile",
      color: "text-amber-600 bg-amber-50",
    },
    {
      href: "/backup",
      label: t("vaultNavLabel"),
      desc: t("vaultNavDesc"),
      icon: Database,
      isActive: pathname.startsWith("/backup"),
      color: "text-rose-600 bg-rose-50",
    },
  ];

  // User initials avatar
  const userInitials = user.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AE";

  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Nav */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0">
            <Link href="/dashboard" className="shrink-0 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm lg:text-base leading-tight tracking-tight whitespace-nowrap">
                  Auto Entrepreneur <span className="text-emerald-600">DZ</span>
                </span>
                <span className="text-[9px] lg:text-[10px] uppercase font-semibold tracking-wider text-slate-400 whitespace-nowrap">
                  {t("brandSub")}
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1 xl:gap-1.5">
              {/* Dashboard */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                  pathname === "/dashboard"
                    ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard
                  className={`w-4 h-4 shrink-0 ${
                    pathname === "/dashboard" ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span className="whitespace-nowrap">{t("dashboard")}</span>
              </Link>

              {/* Invoicing Menu with Dropdown (Factures, Devis, Avoirs, Fiscalité) */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center">
                  <Link
                    href="/invoices"
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                      isInvoicingActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isInvoicingActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span className="whitespace-nowrap">{t("invoicing")}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                      setInvoicingDropdownOpen(!invoicingDropdownOpen);
                    }}
                    aria-label={t("invoicing")}
                    className={`px-1.5 py-2 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                      isInvoicingActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        invoicingDropdownOpen ? "rotate-180" : ""
                      } ${isInvoicingActive ? "text-emerald-600" : "text-slate-400"}`}
                    />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {invoicingDropdownOpen && (
                  <div
                    className={`absolute ${
                      dir === "rtl" ? "right-0" : "left-0"
                    } top-full pt-1.5 w-72 z-50`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="relative rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 animate-in fade-in slide-in-from-top-1 duration-150 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5">
                        {t("billingCycleTitle")}
                      </div>
                      <div className="space-y-1">
                        {invoicingSubItems.map((sub) => {
                          const Icon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => {
                                if (closeTimeoutRef.current) {
                                  clearTimeout(closeTimeoutRef.current);
                                  closeTimeoutRef.current = null;
                                }
                                setInvoicingDropdownOpen(false);
                              }}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                                sub.isActive
                                  ? "bg-slate-50 border border-slate-200/80"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sub.color}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs font-semibold ${
                                      sub.isActive ? "text-slate-900" : "text-slate-800"
                                    }`}
                                  >
                                    {sub.label}
                                  </span>
                                  {sub.isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {sub.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clients */}
              <Link
                href="/clients"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                  pathname.startsWith("/clients")
                    ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users
                  className={`w-4 h-4 shrink-0 ${
                    pathname.startsWith("/clients") ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span className="whitespace-nowrap">{t("clients")}</span>
              </Link>

              {/* Dépenses */}
              <Link
                href="/expenses"
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                  pathname.startsWith("/expenses")
                    ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Receipt
                  className={`w-4 h-4 shrink-0 ${
                    pathname.startsWith("/expenses") ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span className="whitespace-nowrap">{t("expenses")}</span>
              </Link>

              {/* Paramètres Menu with Sub-Menu Dropdown */}
              <div
                ref={settingsDropdownRef}
                className="relative"
                onMouseEnter={handleSettingsMouseEnter}
                onMouseLeave={handleSettingsMouseLeave}
              >
                <div className="flex items-center">
                  <Link
                    href="/profile"
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-l-lg rtl:rounded-l-none rtl:rounded-r-lg text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                      isSettingsActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Settings
                      className={`w-4 h-4 shrink-0 ${
                        isSettingsActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    />
                    <span className="whitespace-nowrap">{t("settingsNavLabel")}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (settingsCloseTimeoutRef.current) {
                        clearTimeout(settingsCloseTimeoutRef.current);
                        settingsCloseTimeoutRef.current = null;
                      }
                      setSettingsDropdownOpen(!settingsDropdownOpen);
                    }}
                    aria-label={t("settingsNavLabel")}
                    className={`px-1.5 py-2 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                      isSettingsActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        settingsDropdownOpen ? "rotate-180" : ""
                      } ${isSettingsActive ? "text-emerald-600" : "text-slate-400"}`}
                    />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {settingsDropdownOpen && (
                  <div
                    className={`absolute ${
                      dir === "rtl" ? "left-0" : "right-0"
                    } top-full pt-1.5 w-80 z-50`}
                    onMouseEnter={handleSettingsMouseEnter}
                    onMouseLeave={handleSettingsMouseLeave}
                  >
                    <div className="relative rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 animate-in fade-in slide-in-from-top-1 duration-150 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5">
                        {t("settingsMenuTitle")}
                      </div>
                      <div className="space-y-1">
                        {settingsSubItems.map((sub) => {
                          const Icon = sub.icon;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => {
                                if (settingsCloseTimeoutRef.current) {
                                  clearTimeout(settingsCloseTimeoutRef.current);
                                  settingsCloseTimeoutRef.current = null;
                                }
                                setSettingsDropdownOpen(false);
                              }}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                                sub.isActive
                                  ? "bg-slate-50 border border-slate-200/80"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sub.color}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-xs font-semibold ${
                                      sub.isActive ? "text-slate-900" : "text-slate-800"
                                    }`}
                                  >
                                    {sub.label}
                                  </span>
                                  {sub.badge && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                                      {sub.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {sub.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* User info & Language & Logout (Consolidated & Compact) */}
          <div className="shrink-0 flex items-center gap-2 lg:gap-3">
            {/* Language Switcher (FR / عربي) */}
            <LanguageToggle />

            {/* Compact User & Tenant Pill */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col text-left rtl:text-right max-w-[120px] lg:max-w-[150px]">
                <span className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                  {tenantName}
                </span>
              </div>
            </div>

            {/* Logout */}
            <form action={logoutAction}>
              <button
                type="submit"
                title={t("logout")}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
              pathname === "/dashboard" ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t("home")}</span>
          </Link>

          <Link
            href="/invoices"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
              isInvoicingActive ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t("invoicing")}</span>
          </Link>

          <Link
            href="/clients"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
              pathname.startsWith("/clients") ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t("clients")}</span>
          </Link>

          <Link
            href="/expenses"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
              pathname.startsWith("/expenses") ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t("expenses")}</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
              isSettingsActive ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t("settingsNavLabel")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
