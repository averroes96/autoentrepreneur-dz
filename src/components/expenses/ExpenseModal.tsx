"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/lib/expenses";
import { createExpenseAction, updateExpenseAction } from "@/app/actions";
import { X, Receipt, Calendar, CreditCard, Tag, DollarSign, Building, FileText, Loader2 } from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: {
    id: string;
    title: string;
    amount: number;
    date: Date | string;
    category: string;
    paymentMethod: string;
    supplier: string | null;
    invoiceNumber: string | null;
    notes: string | null;
  } | null;
}

export function ExpenseModal({ isOpen, onClose, expenseToEdit }: ExpenseModalProps) {
  const { t, locale, dir } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<ExpenseCategory>("SOFTWARE_SUBSCRIPTIONS");
  const [paymentMethod, setPaymentMethod] = useState("CCP_BARIDIMOB");
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(String(expenseToEdit.amount));
      setDate(new Date(expenseToEdit.date).toISOString().split("T")[0]);
      setCategory((expenseToEdit.category as ExpenseCategory) || "OTHER");
      setPaymentMethod(expenseToEdit.paymentMethod || "OTHER");
      setSupplier(expenseToEdit.supplier || "");
      setInvoiceNumber(expenseToEdit.invoiceNumber || "");
      setNotes(expenseToEdit.notes || "");
    } else {
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("SOFTWARE_SUBSCRIPTIONS");
      setPaymentMethod("CCP_BARIDIMOB");
      setSupplier("");
      setInvoiceNumber("");
      setNotes("");
    }
    setError(null);
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("amount", amount);
    formData.append("date", date);
    formData.append("category", category);
    formData.append("paymentMethod", paymentMethod);
    formData.append("supplier", supplier);
    formData.append("invoiceNumber", invoiceNumber);
    formData.append("notes", notes);

    try {
      let res;
      if (expenseToEdit) {
        res = await updateExpenseAction(expenseToEdit.id, formData);
      } else {
        res = await createExpenseAction(formData);
      }

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Erreur inattendue");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {expenseToEdit ? t("expenseEditBtn") : t("newExpenseBtn")}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === "ar" ? "تسجيل نفقة مهنية ومصاريف تشغيلية" : "Enregistrement d'une charge d'exploitation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("expenseTitleLabel")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === "ar" ? "مثال: اشتراك GitHub Copilot أو شاشة حاسوب" : "Ex: Abonnement Cursor / Écran externe"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenseAmountLabel")} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-3.5 pr-12 rtl:pr-3.5 rtl:pl-12 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors font-mono font-bold"
                />
                <span className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3 flex items-center text-xs font-bold text-slate-400">
                  DZD
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenseDateLabel")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenseCategoryLabel")} <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {locale === "ar" ? cat.labelAr : cat.labelFr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expensePaymentMethodLabel")}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              >
                <option value="CCP_BARIDIMOB">CCP / BaridiMob (بريدي موب)</option>
                <option value="BANK_TRANSFER">Virement Bancaire (تحويل بنكي)</option>
                <option value="CREDIT_CARD">Carte CIB / Visa / MC (بطاقة بنكية)</option>
                <option value="CASH">Espèces (نقداً)</option>
                <option value="OTHER">{locale === "ar" ? "طريقة أخرى" : "Autre"}</option>
              </select>
            </div>
          </div>

          {/* Supplier & Invoice Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenseSupplierLabel")}
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder={locale === "ar" ? "مثال: Algérie Télécom / GitHub" : "Ex: OVH / Vercel / Apple"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenseInvoiceNumberLabel")}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={locale === "ar" ? "رقم الوصل أو الفاتورة" : "Ex: INV-2026-9812"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("expenseNotesLabel")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={locale === "ar" ? "ملاحظات إضافية وتفاصيل حول الاستعمال المهني..." : "Détails ou justification de la dépense..."}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t("btnCancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{expenseToEdit ? t("expenseEditBtn") : t("expenseSaveBtn")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
