"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  Globe,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ALGERIAN_BANKS,
  PAYMENT_TERMS_LIST,
  PAYMENT_INSTRUCTION_SUGGESTIONS,
  computeRipFromCcp,
  formatRip,
  formatIban,
  cleanBankString,
  findBankDef,
  isBaridiMobAccount,
} from "@/lib/banking";
import { useI18n } from "@/lib/i18n/I18nContext";

interface PaymentCoordinatesSectionProps {
  initialBankName?: string | null;
  initialBankRib?: string | null;
  initialBankIban?: string | null;
  initialBankBic?: string | null;
  initialAccountHolder?: string | null;
  initialBankAgency?: string | null;
  initialCcpNumber?: string | null;
  initialCcpKey?: string | null;
  initialPaymentTerms?: string | null;
  initialPaymentInstructions?: string | null;
  initialShowBankDetails?: boolean | null;
  sellerFullName?: string | null;
}

export function PaymentCoordinatesSection({
  initialBankName = "Algérie Poste (CCP / BaridiMob)",
  initialBankRib,
  initialBankIban,
  initialBankBic,
  initialAccountHolder,
  initialBankAgency,
  initialCcpNumber,
  initialCcpKey,
  initialPaymentTerms = "UPON_RECEIPT",
  initialPaymentInstructions,
  initialShowBankDetails = true,
  sellerFullName,
}: PaymentCoordinatesSectionProps) {
  const { t, locale } = useI18n();
  const isArabic = locale === "ar";

  const [showBankDetails, setShowBankDetails] = useState<boolean>(
    initialShowBankDetails !== false
  );

  // Bank selection state
  const [selectedBankId, setSelectedBankId] = useState<string>(() => {
    if (!initialBankName) return "ALGERIE_POSTE";
    const found = findBankDef(initialBankName);
    return found ? found.id : "AUTRE";
  });
  const [customBankName, setCustomBankName] = useState<string>(
    selectedBankId === "AUTRE" ? initialBankName || "" : ""
  );

  // CCP vs Direct RIP mode for Algérie Poste
  const isPoste = selectedBankId === "ALGERIE_POSTE";
  const [posteMode, setPosteMode] = useState<"CCP" | "RIP">(() => {
    if (initialCcpNumber) return "CCP";
    if (initialBankRib && initialBankRib.length === 20) return "RIP";
    return "CCP";
  });

  const [ccpNumber, setCcpNumber] = useState<string>(initialCcpNumber || "");
  const [ccpKey, setCcpKey] = useState<string>(initialCcpKey || "");
  const [bankRib, setBankRib] = useState<string>(initialBankRib || "");

  // Other coordinates
  const [accountHolder, setAccountHolder] = useState<string>(
    initialAccountHolder || sellerFullName || ""
  );
  const [bankAgency, setBankAgency] = useState<string>(initialBankAgency || "");
  const [bankIban, setBankIban] = useState<string>(initialBankIban || "");
  const [bankBic, setBankBic] = useState<string>(() => {
    if (initialBankBic) return initialBankBic;
    const def = findBankDef(initialBankName || "ALGERIE_POSTE");
    return def ? def.swift : "";
  });

  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialPaymentTerms || "UPON_RECEIPT"
  );
  const [paymentInstructions, setPaymentInstructions] = useState<string>(
    initialPaymentInstructions || ""
  );

  const [showInternational, setShowInternational] = useState<boolean>(
    Boolean(initialBankIban || initialBankBic)
  );

  // Auto compute RIP when CCP and Clé change
  useEffect(() => {
    if (isPoste && posteMode === "CCP") {
      if (ccpNumber.trim()) {
        const computed = computeRipFromCcp(ccpNumber, ccpKey);
        setBankRib(computed);
      }
    }
  }, [isPoste, posteMode, ccpNumber, ccpKey]);

  // Handle Bank Selection
  const handleBankChange = (newBankId: string) => {
    setSelectedBankId(newBankId);
    const bank = ALGERIAN_BANKS.find((b) => b.id === newBankId);
    if (bank) {
      if (bank.swift) {
        setBankBic(bank.swift);
      }
      if (newBankId === "ALGERIE_POSTE" && !bankRib) {
        setBankRib("00799999");
      }
    }
  };

  const finalBankName =
    selectedBankId === "AUTRE"
      ? customBankName
      : ALGERIAN_BANKS.find((b) => b.id === selectedBankId)?.name || "Algérie Poste (CCP / BaridiMob)";

  const cleanRibValue = cleanBankString(bankRib);
  const formattedDisplayRip = formatRip(cleanRibValue);

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t("secPaymentCoordinates")}</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                <Smartphone className="w-3 h-3" />
                <span>BaridiMob / RIP</span>
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("secPaymentCoordinatesDesc")}
            </p>
          </div>
        </div>

        {/* Global Toggle on/off */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBankDetails}
            onChange={(e) => setShowBankDetails(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
          <span className="ml-3 rtl:mr-3 rtl:ml-0 text-xs font-semibold text-slate-700">
            {isArabic ? "تفعيل على المستندات" : "Afficher sur les documents"}
          </span>
        </label>
      </div>

      {/* Hidden inputs to guarantee proper submission in standard FormData */}
      <input type="hidden" name="showBankDetails" value={showBankDetails ? "true" : "false"} />
      <input type="hidden" name="bankName" value={finalBankName} />
      <input type="hidden" name="bankRib" value={cleanRibValue} />
      <input type="hidden" name="accountHolder" value={accountHolder} />
      <input type="hidden" name="bankAgency" value={bankAgency} />
      <input type="hidden" name="ccpNumber" value={ccpNumber} />
      <input type="hidden" name="ccpKey" value={ccpKey} />
      <input type="hidden" name="bankIban" value={cleanBankString(bankIban)} />
      <input type="hidden" name="bankBic" value={bankBic} />
      <input type="hidden" name="paymentTerms" value={paymentTerms} />

      {!showBankDetails && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {isArabic
                ? "بيانات التسديد معطلة في المستندات"
                : "Coordonnées bancaires masquées sur les documents"}
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              {isArabic
                ? "لن تظهر بطاقة الحساب البريدي أو البنكي على الفواتير وعروض الأسعار التي تقوم بإنشائها."
                : "Vos informations restent sauvegardées dans votre profil mais ne seront pas imprimées au bas de vos factures et devis."}
            </p>
          </div>
        </div>
      )}

      {/* 1. Bank Selector */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {t("lblBankSelect")} *
          </label>
          <select
            value={selectedBankId}
            onChange={(e) => handleBankChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {ALGERIAN_BANKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.hasBaridiMob ? "⚡ (BaridiMob & CCP)" : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedBankId === "AUTRE" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nom de la banque personnalisée
            </label>
            <input
              type="text"
              value={customBankName}
              onChange={(e) => setCustomBankName(e.target.value)}
              placeholder="Ex: Société Générale, Citibank, etc."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        {/* 2. Algérie Poste / BaridiMob Card Banner */}
        {isPoste && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-yellow-50 border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
                  CCP
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Algérie Poste — Service BaridiMob & Virements CCP
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Vos clients pourront vous régler par virement BaridiMob instantané ou versement postal.
                  </p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="inline-flex items-center p-1 bg-white rounded-lg border border-amber-200 shadow-2xs text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPosteMode("CCP")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    posteMode === "CCP"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  N° CCP + Clé
                </button>
                <button
                  type="button"
                  onClick={() => setPosteMode("RIP")}
                  className={`px-2.5 py-1 rounded-md transition ${
                    posteMode === "RIP"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  RIP (20 chiffres)
                </button>
              </div>
            </div>

            {/* Sub-mode: CCP + Clé */}
            {posteMode === "CCP" ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t("lblCcpNumber")} (Ex: 0012345678)
                    </label>
                    <input
                      type="text"
                      value={ccpNumber}
                      onChange={(e) => setCcpNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 12345678"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t("lblCcpKey")} (2 chiffres)
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={ccpKey}
                      onChange={(e) => setCcpKey(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 89"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Display Computed RIP */}
                {cleanRibValue.length === 20 && (
                  <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      RIP Algérie Poste (20 chiffres) généré :
                    </span>
                    <span className="font-mono font-bold text-slate-900 tracking-wider">
                      {formattedDisplayRip}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Sub-mode: Direct 20-digit RIP */
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Coller le RIP Algérie Poste complet (20 chiffres commençant par 00799999)
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={formattedDisplayRip}
                  onChange={(e) => setBankRib(e.target.value)}
                  placeholder="007 99999 0012345678 89"
                  className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* 3. Non-Algérie Poste Banks: Standard 20-digit RIP Input */}
        {!isPoste && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("lblRip")} *
            </label>
            <input
              type="text"
              maxLength={25}
              value={formattedDisplayRip}
              onChange={(e) => setBankRib(e.target.value)}
              placeholder="001 00001 0012345678 90"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Le RIP bancaire algérien comporte 20 chiffres (Code Banque, Guichet, Compte, Clé).
            </span>
          </div>
        )}

        {/* 4. Account Holder & Agency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("lblAccountHolder")} *
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Nom et prénom ou raison sociale"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Nom exact du bénéficiaire figurant sur votre attestation de compte ou chèque.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("lblBankAgency")}
            </label>
            <input
              type="text"
              value={bankAgency}
              onChange={(e) => setBankAgency(e.target.value)}
              placeholder="Ex: Agence Didouche Mourad, Alger"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Wilaya ou agence bancaire / centre postal de rattachement.
            </span>
          </div>
        </div>

        {/* 5. International Banking Accordion (IBAN & SWIFT) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowInternational(!showInternational)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600" />
              <span>Paiements Internationaux (IBAN & Code SWIFT / BIC pour devises EUR, USD, CAD)</span>
            </div>
            {showInternational ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showInternational && (
            <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t("lblIban")}
                </label>
                <input
                  type="text"
                  value={formatIban(bankIban)}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="DZ50 0079 9999 0012 3456 7890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t("lblBic")}
                </label>
                <input
                  type="text"
                  value={bankBic}
                  onChange={(e) => setBankBic(e.target.value.toUpperCase())}
                  placeholder="Ex: POAL DZ AL, BNAL DZ AL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. Default Payment Terms (Échéancier) */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("lblDefaultPaymentTerms")}</span>
          </label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PAYMENT_TERMS_LIST.map((term) => (
              <option key={term.key} value={term.key}>
                {isArabic ? term.labelAr : term.labelFr}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Ce délai servira à calculer automatiquement la date d&apos;échéance sur chaque nouvelle facture émise.
          </span>
        </div>

        {/* 7. Payment Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {t("lblPaymentInstructions")}
          </label>
          <textarea
            rows={2}
            name="paymentInstructions"
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            placeholder="Ex: Mentionner impérativement le N° de facture en référence du virement BaridiMob..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />

          {/* Quick Suggestion Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="text-[10px] text-slate-400 py-0.5">Suggestions rapides :</span>
            {PAYMENT_INSTRUCTION_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPaymentInstructions(sug)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200/60 transition cursor-pointer"
              >
                {sug.slice(0, 48)}...
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCoordinatesSection;
