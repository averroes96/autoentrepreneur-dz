import React from "react";
import { cookies } from "next/headers";
import {
  validateAccountantToken,
  getAccountantAuditData,
} from "@/lib/accountantAccess";
import { AccountantPinGate } from "@/components/accountant/AccountantPinGate";
import { AccountantAuditPortal } from "@/components/accountant/AccountantAuditPortal";
import { ShieldAlert, Clock, Ban, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface AccountantPortalPageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ year?: string }>;
}

export default async function AccountantPortalPage({
  params,
  searchParams,
}: AccountantPortalPageProps) {
  const { token } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedYear = resolvedSearchParams?.year
    ? parseInt(resolvedSearchParams.year, 10)
    : undefined;

  const validation = await validateAccountantToken(token);

  // Invalid, revoked or expired token
  if (!validation.valid || !validation.access) {
    const reason = validation.reason;
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl border border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            {reason === "REVOKED" ? (
              <Ban className="w-7 h-7" />
            ) : reason === "EXPIRED" ? (
              <Clock className="w-7 h-7" />
            ) : (
              <ShieldAlert className="w-7 h-7" />
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {reason === "REVOKED"
              ? "Accès Révoqué"
              : reason === "EXPIRED"
              ? "Lien d'Accès Expiré"
              : "Lien d'Accès Invalide"}
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            {reason === "REVOKED"
              ? "Cet accès de consultation a été révoqué par le titulaire du compte. Veuillez contacter l'auto-entrepreneur pour obtenir une nouvelle invitation."
              : reason === "EXPIRED"
              ? "La période de validité de cet accès d'audit est arrivée à son terme. Veuillez solliciter un renouvellement d'invitation."
              : "Ce lien d'accès sécurisé est introuvable ou a été supprimé. Vérifiez l'adresse saisie ou contactez votre client."}
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
            Plateforme d&apos;Audit Auto Entrepreneur DZ • Loi n° 22-23 du 18 décembre 2022
          </div>
        </div>
      </div>
    );
  }

  const access = validation.access;
  const tenantName =
    access.tenant?.profile?.fullName || access.tenant?.name || "Auto-Entrepreneur";

  // Check PIN requirement and verification cookie
  if (access.pinHash) {
    const cookieStore = await cookies();
    const pinCookie = cookieStore.get(`accountant_pin_${token}`);
    if (pinCookie?.value !== "verified") {
      return (
        <AccountantPinGate
          token={token}
          accountantName={access.name}
          tenantName={tenantName}
          notes={access.notes}
        />
      );
    }
  }

  // Load complete audit dataset
  const auditData = await getAccountantAuditData(token, requestedYear);

  return (
    <AccountantAuditPortal
      token={token}
      auditData={auditData}
      selectedYear={auditData.fiscalYear}
    />
  );
}
