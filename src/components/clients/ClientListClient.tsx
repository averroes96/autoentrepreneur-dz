"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createClientAction,
  updateClientAction,
  toggleArchiveClientAction,
} from "@/app/actions";
import {
  Users,
  Plus,
  Search,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Archive,
  RotateCcw,
  Edit2,
  FileText,
  X,
  CheckCircle2,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { formatDZD } from "@/lib/tax";

interface ClientData {
  id: string;
  name: string;
  clientType: string;
  address: string;
  nif: string | null;
  nis: string | null;
  rc: string | null;
  email: string | null;
  phone: string | null;
  isArchived: boolean;
  createdAt: Date | string;
  invoices: Array<{ id: string; total: number; status: string; paymentStatus?: string }>;
  creditNotes?: Array<{ id: string; total: number; status: string; refundStatus?: string }>;
}

export function ClientListClient({
  initialClients,
}: {
  initialClients: ClientData[];
}) {
  const router = useRouter();
  const { t, locale, dir } = useI18n();
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PROFESSIONAL" | "INDIVIDUAL" | "ARCHIVED">("ALL");
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDialogElement>(null);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.nif && c.nif.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === "ARCHIVED") return matchesSearch && c.isArchived;
    if (c.isArchived) return false;
    if (filterType === "PROFESSIONAL") return matchesSearch && c.clientType === "PROFESSIONAL";
    if (filterType === "INDIVIDUAL") return matchesSearch && c.clientType === "INDIVIDUAL";
    return matchesSearch;
  });

  const openCreateModal = () => {
    setEditingClient(null);
    setError(null);
    modalRef.current?.showModal();
  };

  const openEditModal = (client: ClientData) => {
    setEditingClient(client);
    setError(null);
    modalRef.current?.showModal();
  };

  const closeModal = () => {
    modalRef.current?.close();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      if (editingClient) {
        const res = await updateClientAction(editingClient.id, formData);
        if (res?.error) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }
        // Update local state
        setClients((prev) =>
          prev.map((c) =>
            c.id === editingClient.id
              ? {
                  ...c,
                  name: formData.get("name") as string,
                  clientType: formData.get("clientType") as string,
                  address: formData.get("address") as string,
                  nif: (formData.get("nif") as string) || null,
                  nis: (formData.get("nis") as string) || null,
                  rc: (formData.get("rc") as string) || null,
                  email: (formData.get("email") as string) || null,
                  phone: (formData.get("phone") as string) || null,
                }
              : c
          )
        );
      } else {
        const res = await createClientAction(formData);
        if (res?.error) {
          setError(res.error);
          setIsSubmitting(false);
          return;
        }
        if (res?.client) {
          setClients((prev) => [{ ...res.client, invoices: [] } as any, ...prev]);
        }
      }
      closeModal();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (client: ClientData) => {
    const newArchived = !client.isArchived;
    await toggleArchiveClientAction(client.id, newArchived);
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, isArchived: newArchived } : c))
    );
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {locale === "ar" ? "إدارة الزبائن" : "Gestion des Clients"}
          </h1>
          <p className="text-sm text-slate-500">
            {locale === "ar"
              ? "إنشاء وإدارة حسابات الزبائن المهنيين (الشركات والوكالات) والأفراد."
              : "Créez et gérez vos clients professionnels (entreprises/agences) et particuliers."}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === "ar" ? "إضافة زبون جديد" : "Ajouter un client"}</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className={`w-4 h-4 absolute ${dir === "rtl" ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-slate-400`} />
          <input
            type="text"
            placeholder={locale === "ar" ? "بحث بالاسم، البريد، أو NIF..." : "Rechercher par nom, email, NIF..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${dir === "rtl" ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"} py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: locale === "ar" ? "كافة الزبائن" : "Tous les clients" },
            { id: "PROFESSIONAL", label: locale === "ar" ? "مهنيون (شركات)" : "Professionnels (Agences/Entreprises)" },
            { id: "INDIVIDUAL", label: locale === "ar" ? "أفراد" : "Particuliers" },
            { id: "ARCHIVED", label: locale === "ar" ? "المؤرشفون" : "Archivés" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterType === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">
            {locale === "ar" ? "لم يتم العثور على أي زبون" : "Aucun client trouvé"}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchTerm
              ? locale === "ar"
                ? "لا توجد نتائج تطابق معايير البحث."
                : "Aucun résultat ne correspond à votre recherche."
              : locale === "ar"
              ? "ابدأ بإضافة أول زبون لتتمكن من فوترة خدماتك."
              : "Commencez par ajouter votre premier client pour pouvoir lui facturer vos prestations."}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === "ar" ? "زبون جديد" : "Nouveau client"}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const isPro = client.clientType === "PROFESSIONAL";
            const validInvoices = client.invoices.filter((i) => i.status === "ISSUED");
            const totalBilled = validInvoices.reduce((acc, i) => acc + i.total, 0);
            const totalPaid = validInvoices
              .filter((i) => i.paymentStatus === "PAID")
              .reduce((acc, i) => acc + i.total, 0);
            const refundedCreditNotes = (client.creditNotes || [])
              .filter((cn) => cn.status === "ISSUED" && cn.refundStatus === "REFUNDED")
              .reduce((acc, cn) => acc + cn.total, 0);
            const pendingBalance = Math.max(0, totalBilled - totalPaid - refundedCreditNotes);
            const isSettled = pendingBalance === 0;

            return (
              <div
                key={client.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isPro
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}
                      >
                        {isPro ? <Building className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-sm leading-tight">
                          {client.name}
                        </h2>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {isPro
                            ? locale === "ar"
                              ? "مهني / شركة"
                              : "Professionnel"
                            : locale === "ar"
                            ? "شخص طبيعي"
                            : "Particulier"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        title={locale === "ar" ? "تعديل" : "Modifier"}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(client)}
                        title={client.isArchived ? (locale === "ar" ? "استعادة" : "Désarchiver") : (locale === "ar" ? "أرشفة" : "Archiver")}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        {client.isArchived ? (
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{client.address || "Adresse non renseignée"}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {isPro && (client.nif || client.rc) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                      {client.nif && (
                        <div>
                          <span className="font-semibold block text-slate-400">NIF :</span>
                          <span className="font-mono">{client.nif}</span>
                        </div>
                      )}
                      {client.rc && (
                        <div>
                          <span className="font-semibold block text-slate-400">RC :</span>
                          <span className="font-mono">{client.rc}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Balance & Invoice Count */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{validInvoices.length} factures</span>
                  </div>

                  {validInvoices.length > 0 ? (
                    isSettled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Soldé (0 DZD)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200 font-mono">
                        <span>Dû : {formatDZD(pendingBalance)}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400">Aucune facture</span>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold text-[11px] hover:underline"
                  >
                    <span>{locale === "ar" ? "كشف الحساب ←" : "Relevé de compte"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  {client.isArchived && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Archivé
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Native Modal Dialog for Create & Edit */}
      <dialog
        ref={modalRef}
        className="rounded-2xl shadow-2xl p-0 backdrop:bg-slate-900/50 backdrop:backdrop-blur-xs max-w-lg w-full m-auto border border-slate-200"
      >
        <div className="bg-white p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              {editingClient
                ? locale === "ar"
                  ? "تعديل بيانات الزبون"
                  : "Modifier le client"
                : locale === "ar"
                ? "إضافة زبون جديد"
                : "Nouveau client"}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nom ou Raison sociale *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingClient?.name || ""}
                placeholder="Ex: Agence Digitale Algiers ou SARL Media"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Type de client *
              </label>
              <select
                name="clientType"
                defaultValue={editingClient?.clientType || "PROFESSIONAL"}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PROFESSIONAL">Professionnel / Entreprise / Agence</option>
                <option value="INDIVIDUAL">Particulier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Adresse complète *
              </label>
              <textarea
                name="address"
                required
                rows={2}
                defaultValue={editingClient?.address || ""}
                placeholder="Ex: 12 Rue Didouche Mourad, Alger"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NIF (Fiscal)
                </label>
                <input
                  type="text"
                  name="nif"
                  defaultValue={editingClient?.nif || ""}
                  placeholder="Optionnel"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  RC (Commerce)
                </label>
                <input
                  type="text"
                  name="rc"
                  defaultValue={editingClient?.rc || ""}
                  placeholder="Optionnel"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  NIS (Statistique)
                </label>
                <input
                  type="text"
                  name="nis"
                  defaultValue={editingClient?.nis || ""}
                  placeholder="Optionnel"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingClient?.email || ""}
                  placeholder="contact@client.dz"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingClient?.phone || ""}
                  placeholder="05 XX XX XX XX"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {locale === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmitting
                  ? locale === "ar"
                    ? "جار الحفظ..."
                    : "Enregistrement..."
                  : editingClient
                  ? locale === "ar"
                    ? "تحديث البيانات"
                    : "Mettre à jour"
                  : locale === "ar"
                  ? "إنشاء الزبون"
                  : "Créer le client"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
