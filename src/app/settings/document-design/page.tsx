import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { InteractiveDesignStudio } from "@/components/design-studio/InteractiveDesignStudio";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio de Personnalisation Graphique & Légale (WYSIWYG) | Auto-Entrepreneur DZ",
  description:
    "Studio interactif de personnalisation des factures, devis, avoirs et quittances. Bascule temps réel FR/AR et synchronisation vectorielle PDF / Impression web.",
};

export default async function DocumentDesignSettingsPage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />
      <main className="flex-1 flex flex-col">
        <InteractiveDesignStudio profile={tenant.profile} />
      </main>
    </div>
  );
}
