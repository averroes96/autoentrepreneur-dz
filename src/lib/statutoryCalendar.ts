import { REGULATORY_CONFIG } from "@/config/regulatory";

export type DeadlineUrgency = "NORMAL" | "WARNING" | "URGENT" | "OVERDUE" | "COMPLETED";

export interface StatutoryDeadline {
  id: string;
  title: string;
  category: "FISCAL" | "SOCIAL" | "ADMIN";
  description: string;
  recipient: string;
  targetDate: Date;
  daysRemaining: number;
  urgency: DeadlineUrgency;
  badgeLabel: string;
  badgeColor: string;
  legalReference: string;
  isCompleted?: boolean;
}

/**
 * Calcule la différence en jours entre aujourd'hui et une date cible.
 */
export function getDaysDiff(target: Date, fromDate: Date = new Date()): number {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const f = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).getTime();
  return Math.ceil((t - f) / (1000 * 60 * 60 * 24));
}

/**
 * Détermine le niveau d'urgence et le libellé du badge pour une échéance.
 */
export function getUrgencyBadge(daysRemaining: number, isCompleted: boolean = false): {
  urgency: DeadlineUrgency;
  badgeLabel: string;
  badgeColor: string;
} {
  if (isCompleted) {
    return {
      urgency: "COMPLETED",
      badgeLabel: "Validé / Conforme",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }

  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);
    return {
      urgency: "OVERDUE",
      badgeLabel: `Échue depuis ${overdueDays} j`,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse",
    };
  }

  if (daysRemaining === 0) {
    return {
      urgency: "URGENT",
      badgeLabel: "Aujourd'hui (Dernier jour)",
      badgeColor: "bg-rose-500 text-white border-rose-600 font-bold",
    };
  }

  if (daysRemaining <= 7) {
    return {
      urgency: "URGENT",
      badgeLabel: `${daysRemaining} j restants (Urgent)`,
      badgeColor: "bg-red-100 text-red-800 border-red-300 font-semibold",
    };
  }

  if (daysRemaining <= 30) {
    return {
      urgency: "WARNING",
      badgeLabel: `${daysRemaining} j restants`,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300 font-semibold",
    };
  }

  return {
    urgency: "NORMAL",
    badgeLabel: `${daysRemaining} j restants`,
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

export interface ProfileDatesInput {
  cardIssueDate?: Date | string | null;
  activityStartDate?: Date | string | null;
  nif?: string | null;
  casnosStatus?: string | null;
}

/**
 * Génère le calendrier complet des obligations statutaires de l'auto-entrepreneur pour une année fiscale donnée.
 */
export function getStatutoryDeadlines(
  fiscalYear: number,
  profile?: ProfileDatesInput,
  currentDate: Date = new Date()
): StatutoryDeadline[] {
  const deadlines: StatutoryDeadline[] = [];

  // 1. Déclaration & Paiement IFU (Série G n° 12 bis / Jibayatic)
  // Date limite : 31 Janvier de l'année N+1
  const ifuTarget = new Date(fiscalYear + 1, 0, 31); // 31 Janvier N+1
  const ifuDiff = getDaysDiff(ifuTarget, currentDate);
  const ifuBadge = getUrgencyBadge(ifuDiff);

  deadlines.push({
    id: "ifu-declaration",
    title: `Déclaration & Paiement IFU ${fiscalYear}`,
    category: "FISCAL",
    description: `Déclaration annuelle du chiffre d'affaires ${fiscalYear} (Série G n° 12 bis) et télépaiement de l'IFU (0,5%).`,
    recipient: "Recette des Impôts (DGI) ou Portail Jibayatic",
    targetDate: ifuTarget,
    daysRemaining: ifuDiff,
    urgency: ifuBadge.urgency,
    badgeLabel: ifuBadge.badgeLabel,
    badgeColor: ifuBadge.badgeColor,
    legalReference: "Loi n° 22-23 et Code des Impôts Directs (Art. 282 bis)",
  });

  // 2. Cotisation annuelle CASNOS (Sécurité Sociale Non-Salariés)
  // Date limite habituelle : 30 Juin de l'année en cours
  const casnosTarget = new Date(fiscalYear, 5, 30); // 30 Juin N
  const casnosDiff = getDaysDiff(casnosTarget, currentDate);
  const isCasnosAffiliated = profile?.casnosStatus === "AFFILIATED";
  const casnosBadge = getUrgencyBadge(casnosDiff, false);

  deadlines.push({
    id: "casnos-annual",
    title: `Cotisation Annuelle CASNOS ${fiscalYear}`,
    category: "SOCIAL",
    description: "Paiement de la cotisation de sécurité sociale (24 000 DZD au forfait préférentiel auto-entrepreneur).",
    recipient: "Caisse Nationale de Sécurité Sociale des Non-Salariés (CASNOS)",
    targetDate: casnosTarget,
    daysRemaining: casnosDiff,
    urgency: casnosBadge.urgency,
    badgeLabel: casnosBadge.badgeLabel,
    badgeColor: casnosBadge.badgeColor,
    legalReference: "Réglementation CASNOS — Majoration de 10% au-delà du 30 juin",
  });

  // 3. Déclaration d'existence fiscale (30 jours après carte ANAE)
  if (profile?.cardIssueDate) {
    const cardDate = new Date(profile.cardIssueDate);
    const dgiTarget = new Date(cardDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dgiDiff = getDaysDiff(dgiTarget, currentDate);
    const hasNif = Boolean(profile.nif && profile.nif.length >= 15);
    const dgiBadge = getUrgencyBadge(dgiDiff, hasNif);

    deadlines.push({
      id: "dgi-declaration-existence",
      title: "Déclaration d'existence fiscale (DGI)",
      category: "FISCAL",
      description: "Souscription de la déclaration d'existence auprès de la recette des impôts pour obtention du NIF (Série G n° 8).",
      recipient: "Inspection / Recette des Impôts du domicile fiscal",
      targetDate: dgiTarget,
      daysRemaining: dgiDiff,
      urgency: dgiBadge.urgency,
      badgeLabel: hasNif ? "NIF Attribué ✓" : dgiBadge.badgeLabel,
      badgeColor: hasNif ? "bg-emerald-100 text-emerald-800 border-emerald-200" : dgiBadge.badgeColor,
      legalReference: "Délai de 30 jours suivant la délivrance de la carte (Code des Impôts)",
      isCompleted: hasNif,
    });
  }

  // 4. Affiliation CASNOS (10 jours après début d'activité)
  if (profile?.activityStartDate) {
    const actDate = new Date(profile.activityStartDate);
    const affTarget = new Date(actDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const affDiff = getDaysDiff(affTarget, currentDate);
    const isAffiliated = profile.casnosStatus === "AFFILIATED";
    const affBadge = getUrgencyBadge(affDiff, isAffiliated);

    deadlines.push({
      id: "casnos-affiliation",
      title: "Affiliation initiale à la CASNOS",
      category: "SOCIAL",
      description: "Dépôt du dossier d'immatriculation et obtention de l'attestation d'affiliation pour la carte Chifa.",
      recipient: "Antenne locale CASNOS",
      targetDate: affTarget,
      daysRemaining: affDiff,
      urgency: affBadge.urgency,
      badgeLabel: isAffiliated ? "Affilié (Carte Chifa active) ✓" : affBadge.badgeLabel,
      badgeColor: isAffiliated ? "bg-emerald-100 text-emerald-800 border-emerald-200" : affBadge.badgeColor,
      legalReference: "Délai légal d'affiliation de 10 jours ouvrés (Décret exécutif)",
      isCompleted: isAffiliated,
    });
  }

  // 5. Renouvellement quinquennal de la carte ANAE (5 ans)
  if (profile?.cardIssueDate) {
    const cardDate = new Date(profile.cardIssueDate);
    const renewTarget = new Date(
      cardDate.getFullYear() + REGULATORY_CONFIG.card.validityYears,
      cardDate.getMonth(),
      cardDate.getDate()
    );
    const renewDiff = getDaysDiff(renewTarget, currentDate);
    const renewBadge = getUrgencyBadge(renewDiff);

    deadlines.push({
      id: "anae-renewal",
      title: "Renouvellement quinquennal Carte ANAE (5 ans)",
      category: "ADMIN",
      description: "Mise à jour et renouvellement de la carte physique d'auto-entrepreneur auprès de la plateforme nationale.",
      recipient: "Agence Nationale de l'Auto-Entrepreneur (Portail ANAE.dz)",
      targetDate: renewTarget,
      daysRemaining: renewDiff,
      urgency: renewBadge.urgency,
      badgeLabel: renewBadge.badgeLabel,
      badgeColor: renewBadge.badgeColor,
      legalReference: "Loi 22-23 — Carte valable 5 ans renouvelable",
    });
  }

  // Trier par date la plus proche
  return deadlines.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
}
