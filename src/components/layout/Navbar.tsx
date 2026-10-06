"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface NavbarProps {
  user: {
    fullName: string;
    email: string;
  };
  tenantName: string;
}

export function Navbar({ user, tenantName }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/invoices", label: "Factures", icon: FileText },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/profile", label: "Profil & Conformité", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-base leading-tight tracking-tight">
                  Moukawil<span className="text-emerald-600">.dz</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  Auto-Entrepreneur
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700 max-w-[150px] truncate">
                {tenantName}
              </span>
            </div>

            <div className="text-right hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user.fullName}
              </p>
              <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                {user.email}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Déconnexion"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium ${
                  isActive ? "text-emerald-600" : "text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
export default Navbar;
