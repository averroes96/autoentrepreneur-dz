"use client";

import React, { useState, useRef } from "react";
import {
  Award,
  Upload,
  Trash2,
  Check,
  Sparkles,
  ShieldCheck,
  FileSignature,
  Eye,
  Info,
} from "lucide-react";
import { OfficialSeal } from "@/components/common/OfficialSeal";
import { useI18n } from "@/lib/i18n/I18nContext";

interface SealSignatureSectionProps {
  initialShowStampSignature?: boolean | null;
  initialStampType?: string | null;
  initialStampUrl?: string | null;
  initialSignatureUrl?: string | null;
  sellerFullName?: string | null;
  sellerRnae?: string | null;
  sellerNif?: string | null;
  sellerActivityLabel?: string | null;
  brandColor?: string | null;
}

const INK_COLORS = [
  { id: "BLUE", labelFr: "Bleu Administratif", labelAr: "أزرق إداري", hex: "#1e40af" },
  { id: "INDIGO", labelFr: "Violet / Indigo", labelAr: "بنفسجي رسمي", hex: "#4f46e5" },
  { id: "EMERALD", labelFr: "Vert Émeraude", labelAr: "أخضر زمردي", hex: "#047857" },
  { id: "SLATE", labelFr: "Noir / Gris Encre", labelAr: "حبر أسود داكن", hex: "#1e293b" },
];

export function SealSignatureSection({
  initialShowStampSignature = true,
  initialStampType = "AUTO",
  initialStampUrl = null,
  initialSignatureUrl = null,
  sellerFullName = "Auto-Entrepreneur",
  sellerRnae = "—",
  sellerNif = "—",
  sellerActivityLabel = "Prestations de services",
}: SealSignatureSectionProps) {
  const { t, locale } = useI18n();
  const isArabic = locale === "ar";

  const [showStampSignature, setShowStampSignature] = useState(
    initialShowStampSignature !== false
  );
  const [stampType, setStampType] = useState<string>(
    initialStampType === "CUSTOM"
      ? "CUSTOM"
      : initialStampType === "AUTO_ROUND"
      ? "AUTO_ROUND"
      : "AUTO"
  );
  const [stampUrl, setStampUrl] = useState<string | null>(initialStampUrl || null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(
    initialSignatureUrl || null
  );
  const [selectedInkColor, setSelectedInkColor] = useState<string>("#1e40af");

  const stampInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingStamp, setIsProcessingStamp] = useState(false);
  const [isProcessingSig, setIsProcessingSig] = useState(false);

  // Client-side image optimizer for transparent PNGs (keeps under 45KB)
  const processImageFile = (
    file: File,
    maxDimension: number,
    onSuccess: (dataUrl: string) => void,
    onLoading: (val: boolean) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      alert(
        isArabic
          ? "يرجى اختيار ملف صورة صالح (PNG أو JPG)"
          : "Veuillez sélectionner un fichier image valide (PNG ou JPG)."
      );
      return;
    }

    onLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Preserve PNG transparency
          const compressed = canvas.toDataURL("image/png", 0.92);
          onSuccess(compressed);
        } else {
          onSuccess(src);
        }
        onLoading(false);
      };
      img.onerror = () => {
        onLoading(false);
        alert(
          isArabic
            ? "تعذر تحميل ملف الصورة."
            : "Impossible de traiter le fichier image."
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 400, (dataUrl) => setStampUrl(dataUrl), setIsProcessingStamp);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, 350, (dataUrl) => setSignatureUrl(dataUrl), setIsProcessingSig);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Hidden inputs for Form Submission */}
      <input
        type="hidden"
        name="showStampSignature"
        value={showStampSignature ? "true" : "false"}
      />
      <input type="hidden" name="stampType" value={stampType} />
      <input type="hidden" name="stampUrl" value={stampUrl || ""} />
      <input type="hidden" name="signatureUrl" value={signatureUrl || ""} />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {isArabic
                ? "الختم التجاري والتوقيع الرقمي (Cachet & Griffe)"
                : "Cachet Commercial & Signature Numérique (Module 3)"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
              Loi 22-23
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isArabic
              ? "تشترط الشركات الجزائرية بصورة منهجية وجود الختم والتوقيع لاعتماد صرف الفواتير. يتيح النظام ختماً رسمياً تلقائياً مطابقاً للقانون أو استيراد ختماً مخصصاً."
              : "Exigé par les directions financières algériennes pour le déblocage des paiements. Utilisez le cachet officiel automatique ou importez votre scan."}
          </p>
        </div>

        {/* Global Toggle on/off */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showStampSignature}
            onChange={(e) => setShowStampSignature(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
          <span className="ml-3 text-xs font-semibold text-slate-700">
            {isArabic ? "تفعيل الختم والتوقيع" : "Activer sur les documents"}
          </span>
        </label>
      </div>

      {showStampSignature ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {isArabic ? "طريقة إنشاء الختم" : "Mode de Cachet Commercial"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStampType("AUTO")}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition ${
                    stampType === "AUTO" || stampType === "AUTO_RECTANGLE"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isArabic ? "مستطيل تجاري (B2B)" : "Cachet Rectangulaire"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isArabic ? "معتمد Trodat (موصى به)" : "Standard Trodat (Recommandé)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType("AUTO_ROUND")}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition ${
                    stampType === "AUTO_ROUND"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isArabic ? "دائري رسمي" : "Cachet Circulaire"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isArabic ? "طابع إداري 38 مم" : "Tampon rond officiel"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType("CUSTOM")}
                  className={`flex flex-col items-start p-3 rounded-lg text-left transition ${
                    stampType === "CUSTOM"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isArabic ? "ختم ممسوح (صورة)" : "Scan Personnalisé"}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {isArabic ? "ملف PNG شفاف" : "Fichier PNG transparent"}
                  </span>
                </button>
              </div>
            </div>

            {/* If AUTO or AUTO_ROUND: Ink Color Selector */}
            {stampType !== "CUSTOM" ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {isArabic ? "لون حبر الختم الإداري" : "Couleur de l'encre administrative"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isArabic ? "اللون الأزرق هو الأكثر شيوعاً" : "Bleu recommandé"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {INK_COLORS.map((ink) => (
                    <button
                      key={ink.id}
                      type="button"
                      onClick={() => setSelectedInkColor(ink.hex)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition ${
                        selectedInkColor === ink.hex
                          ? "bg-white border-slate-900 shadow-xs text-slate-900"
                          : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: ink.hex }}
                      />
                      <span className="truncate text-[11px]">
                        {isArabic ? ink.labelAr : ink.labelFr}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {isArabic
                      ? `يتضمن الختم تلقائياً: ${sellerFullName} • RNAE: ${sellerRnae} • NIF: ${sellerNif}`
                      : `Le cachet comporte : ${sellerFullName} • RNAE: ${sellerRnae} • NIF: ${sellerNif}`}
                  </span>
                </div>
              </div>
            ) : (
              /* If CUSTOM: Upload Stamp */
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {isArabic ? "رفع صورة الختم التجاري (PNG شفاف)" : "Importer le cachet scanné (PNG transparent)"}
                  </span>
                  {stampUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setStampUrl(null);
                        if (stampInputRef.current) stampInputRef.current.value = "";
                      }}
                      className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isArabic ? "حذف" : "Supprimer"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <input
                    ref={stampInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleStampUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => stampInputRef.current?.click()}
                    disabled={isProcessingStamp}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {isProcessingStamp
                        ? isArabic ? "جاري المعالجة..." : "Traitement..."
                        : stampUrl
                        ? isArabic ? "تغيير ملف الختم" : "Remplacer le cachet"
                        : isArabic ? "اختيار صورة الختم" : "Sélectionner une image"}
                    </span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {isArabic ? "صيغة PNG شفافة • حد أقصى 400x400 بكسل" : "PNG fond transparent • Max 400x400 px"}
                  </span>
                </div>
              </div>
            )}

            {/* Signature / Griffe Upload Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    {isArabic ? "التوقيع اليدوي / الإمضاء (Griffe)" : "Signature manuscrite / Griffe (Facultative)"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {isArabic
                      ? "يتم وضعه مائلاً فوق أو بجانب الختم لمحاكاة التوقيع الفعلي"
                      : "S'appose élégamment sur le cachet pour l'effet 'Cachet & Signature'"}
                  </span>
                </div>
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureUrl(null);
                      if (signatureInputRef.current) signatureInputRef.current.value = "";
                    }}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isArabic ? "حذف" : "Supprimer"}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={isProcessingSig}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-2 transition cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {isProcessingSig
                      ? isArabic ? "جاري المعالجة..." : "Traitement..."
                      : signatureUrl
                      ? isArabic ? "تغيير التوقيع" : "Remplacer la signature"
                      : isArabic ? "رفع التوقيع (PNG)" : "Importer une signature"}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {isArabic ? "صورة ممسوحة لتوقيعك بخلفية شفافة" : "Scan de signature sur fond transparent"}
                </span>
              </div>
            </div>

            {/* Legal Advisory Box */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {isArabic
                    ? "القيمة القانونية للختم في الجزائر (Loi 22-23)"
                    : "Validité juridique du Cachet en Algérie"}
                </span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                {isArabic
                  ? "يعتبر الختم الحامل لرقم السجل الوطني (RNAE) ورقم التعريف الجبائي (NIF) إثباتاً قانونياً كافياً لإصدار الفواتير وقبض المستحقات لدى الهيئات العمومية والخاصة."
                  : "Le cachet comportant l'immatriculation au Registre National (RNAE) et le NIF constitue l'empreinte légale certifiant l'authenticité de vos factures et devis."}
              </p>
            </div>
          </div>

          {/* Real-time Preview Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 text-center space-y-4 select-none">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isArabic ? "معاينة مباشرة في الوثائق" : "Aperçu en Direct sur Document"}
              </span>
              <p className="text-xs font-semibold text-slate-700">
                {stampType === "AUTO" || stampType === "AUTO_RECTANGLE"
                  ? isArabic ? "ختم تجاري مستطيل (نموذج معتمد)" : "Cachet Rectangulaire B2B (Standard)"
                  : stampType === "AUTO_ROUND"
                  ? isArabic ? "ختم إداري دائري رسمي" : "Cachet Circulaire Administratif"
                  : isArabic ? "ختم مخصص ممسوح" : "Cachet Importé"}
                {signatureUrl ? " + Signature" : " + Griffe Automatique"}
              </p>
            </div>

            {/* Stamp Interactive Canvas Box */}
            <div className="w-full max-w-[280px] min-h-[140px] rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-4 relative overflow-hidden">
              <OfficialSeal
                fullName={sellerFullName}
                rnaeNumber={sellerRnae}
                nif={sellerNif}
                activityLabel={sellerActivityLabel}
                stampType={stampType}
                stampUrl={stampUrl}
                signatureUrl={signatureUrl}
                inkColor={selectedInkColor}
                size="md"
              />
            </div>

            <p className="text-[10px] text-slate-400 max-w-xs">
              {isArabic
                ? "يظهر هذا الختم في أسفل فواتيرك وعروض الأسعار مع زاوية ميلان واقعية (-5°)."
                : "Apposé au bas de vos factures et devis avec une légère rotation réaliste (-5°)."}
            </p>
          </div>
        </div>
      ) : (
        /* Disabled State Notice */
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">
            {isArabic
              ? "الختم والتوقيع معطلان حالياً على وثائقك."
              : "Le cachet et la signature sont actuellement masqués sur vos factures et devis."}
          </p>
          <p className="text-[11px] text-slate-500">
            {isArabic
              ? "يمكنك تفعيل الخيار أعلاه لإضافة الختم تلقائياً لتسريع استلام مستحقاتك."
              : "Activez l'interrupteur ci-dessus pour apposer automatiquement votre cachet officiel."}
          </p>
        </div>
      )}
    </div>
  );
}

export default SealSignatureSection;
