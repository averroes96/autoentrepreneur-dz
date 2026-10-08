import React from "react";
import { requireAuth, getCurrentTenantWithProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { ProfileFormClient } from "@/components/profile/ProfileFormClient";

export default async function ProfilePage() {
  const session = await requireAuth();
  const tenant = await getCurrentTenantWithProfile(session.tenantId);

  if (!tenant || !tenant.profile) return <div>Non autorisé</div>;

  const pastTurnovers = await db.pastTurnover.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { fiscalYear: "desc" },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={session} tenantName={tenant.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <ProfileFormClient profile={tenant.profile} pastTurnovers={pastTurnovers} />
      </main>
    </div>
  );
}
