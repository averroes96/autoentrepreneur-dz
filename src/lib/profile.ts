export interface ProfileCompletionItem {
  key: string;
  label: string;
  description: string;
  isComplete: boolean;
  required: boolean;
}

export interface ProfileCompletionResult {
  percentage: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
  missingItems: ProfileCompletionItem[];
  isFullyComplete: boolean;
}

/**
 * Evaluates the completion state of the auto-entrepreneur's legal profile under Law 22-23.
 */
export function calculateProfileCompletion(profile: {
  fullName?: string | null;
  rnaeNumber?: string | null;
  nif?: string | null;
  address?: string | null;
  activityCode?: string | null;
  activityLabel?: string | null;
  phone?: string | null;
  email?: string | null;
  cardIssueDate?: Date | string | null;
  casnosStatus?: string | null;
} | null): ProfileCompletionResult {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 8,
      items: [],
      missingItems: [],
      isFullyComplete: false,
    };
  }

  const items: ProfileCompletionItem[] = [
    {
      key: "fullName",
      label: "Nom & Prénom légal",
      description: "Nom figurant sur votre pièce d'identité",
      isComplete: Boolean(profile.fullName && profile.fullName.trim().length > 0),
      required: true,
    },
    {
      key: "activityCode",
      label: "Code d'activité ANAE",
      description: "Code à 6 chiffres de votre métier agréé (ex: 601101)",
      isComplete: Boolean(profile.activityCode && profile.activityCode.trim().length > 0),
      required: true,
    },
    {
      key: "activityLabel",
      label: "Libellé de l'activité",
      description: "Désignation officielle de l'activité (ex: Développement de logiciels)",
      isComplete: Boolean(profile.activityLabel && profile.activityLabel.trim().length > 0),
      required: true,
    },
    {
      key: "address",
      label: "Adresse de domiciliation",
      description: "Adresse d'exercice déclarée en Algérie",
      isComplete: Boolean(profile.address && profile.address.trim().length > 0),
      required: true,
    },
    {
      key: "rnaeNumber",
      label: "N° RNAE (Carte ANAE)",
      description: "Numéro national d'immatriculation (obligatoire sur les factures)",
      isComplete: Boolean(profile.rnaeNumber && profile.rnaeNumber.trim().length > 0),
      required: true,
    },
    {
      key: "nif",
      label: "NIF (Numéro Fiscal)",
      description: "Identifiant fiscal délivré par la DGI (obligatoire sur les factures)",
      isComplete: Boolean(profile.nif && profile.nif.trim().length > 0),
      required: true,
    },
    {
      key: "phone",
      label: "Numéro de téléphone",
      description: "Contact téléphonique professionnel",
      isComplete: Boolean(profile.phone && profile.phone.trim().length > 0),
      required: false,
    },
    {
      key: "cardIssueDate",
      label: "Date de délivrance de la carte",
      description: "Permet de suivre le renouvellement quinquennal",
      isComplete: Boolean(profile.cardIssueDate),
      required: false,
    },
  ];

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.isComplete).length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const missingItems = items.filter((i) => !i.isComplete);

  return {
    percentage,
    completedCount,
    totalCount,
    items,
    missingItems,
    isFullyComplete: percentage === 100,
  };
}
