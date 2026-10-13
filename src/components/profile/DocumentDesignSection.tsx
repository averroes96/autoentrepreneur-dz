"use client";

import React, { useState, useRef } from "react";
import {
  Palette,
  Image as ImageIcon,
  Layout,
  Eye,
  Check,
  Upload,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  BRAND_PALETTES,
  TEMPLATE_STYLES,
  BrandColorKey,
  TemplateStyleKey,
  LogoPositionKey,
  getBrandPalette,
  getTemplateStyle,
} from "@/lib/invoiceDesign";
import { useI18n } from "@/lib/i18n/I18nContext";

interface DocumentDesignSectionProps {
  initialLogoUrl?: string | null;
  initialLogoPosition?: string | null;
  initialBrandColor?: string | null;
  initialTemplateStyle?: string | null;
  sellerName?: string;
  activityLabel?: string;
}

export function DocumentDesignSection({
  initialLogoUrl,
  initialLogoPosition = "LEFT",
  initialBrandColor = "EMERALD",
  initialTemplateStyle = "MODERN",
  sellerName = "Auto-Entrepreneur",
  activityLabel = "Services Numériques & Conseil",
}: DocumentDesignSectionProps) {
  const { t, locale, dir } = useI18n();
  const isArabic = locale === "ar";

  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl || null);
  const [logoPosition, setLogoPosition] = useState<LogoPositionKey>(
    (initialLogoPosition?.toUpperCase() as LogoPositionKey) || "LEFT"
  );
  const [brandColor, setBrandColor] = useState<BrandColorKey>(
    (initialBrandColor?.toUpperCase() as BrandColorKey) || "EMERALD"
  );
  const [templateStyle, setTemplateStyle] = useState<TemplateStyleKey>(
    (initialTemplateStyle?.toUpperCase() as TemplateStyleKey) || "MODERN"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  // Client-side image scaling to keep data under 40KB
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP).");
      return;
    }

    setIsProcessingLogo(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
          setLogoUrl(compressed);
        } else {
          setLogoUrl(src);
        }
        setIsProcessingLogo(false);
      };
      img.onerror = () => {
        setIsProcessingLogo(false);
        alert("Impossible de charger l'image.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activePalette = getBrandPalette(brandColor);
  const activeTemplate = getTemplateStyle(templateStyle);

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-7">
      {/* Hidden inputs submitted with the form */}
      <input type="hidden" name="logoUrl" value={logoUrl || ""} />
      <input type="hidden" name="logoPosition" value={logoPosition} />
      <input type="hidden" name="brandColor" value={brandColor} />
      <input type="hidden" name="templateStyle" value={templateStyle} />

      {/* Section Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("secVisualIdentity")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("secVisualIdentityDesc")}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Phase 4
        </span>
      </div>

      {/* Control 1: Logo & Alignment */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>{t("lblCompanyLogo")}</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {t("logoHint")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Logo Uploader Card */}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
              id="logo-file-input"
            />

            {logoUrl ? (
              <div className="flex items-center gap-4 w-full justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Brand Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Logo actif
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      ✓ Optimisé pour PDF & Impression A4
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer"
                  >
                    {t("changeLogoBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                    title={t("removeLogoBtn")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200/70 border border-slate-300/80 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Aucun logo téléversé
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Vos documents afficheront uniquement votre en-tête nominatif légal.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingLogo ? "Traitement..." : t("uploadLogoBtn")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Logo Position Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              {t("lblLogoPosition")}
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setLogoPosition("LEFT")}
                className={`flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                  logoPosition === "LEFT"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title={t("posLeft")}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span className="text-[10px]">{t("posLeft")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoPosition("CENTER")}
                className={`flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                  logoPosition === "CENTER"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title={t("posCenter")}
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span className="text-[10px]">{t("posCenter")}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoPosition("RIGHT")}
                className={`flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                  logoPosition === "RIGHT"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title={t("posRight")}
              >
                <AlignRight className="w-3.5 h-3.5" />
                <span className="text-[10px]">{t("posRight")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control 2: Brand Color Palettes */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-slate-500" />
          <span>{t("lblBrandColor")}</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(BRAND_PALETTES) as BrandColorKey[]).map((key) => {
            const pal = BRAND_PALETTES[key];
            const isSelected = brandColor === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setBrandColor(key)}
                className={`p-3 rounded-xl border text-left transition relative cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-6 h-6 rounded-full shadow-2xs border border-white flex items-center justify-center text-white"
                    style={{ backgroundColor: pal.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {pal.hex}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {isArabic ? pal.labelAr : pal.labelFr}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {pal.labelEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Control 3: Layout Template Styles */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Layout className="w-4 h-4 text-slate-500" />
          <span>{t("lblTemplateStyle")}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(Object.keys(TEMPLATE_STYLES) as TemplateStyleKey[]).map((key) => {
            const style = TEMPLATE_STYLES[key];
            const isSelected = templateStyle === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setTemplateStyle(key)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-slate-900 ring-2 ring-slate-900/10 bg-slate-50/60 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {style.badge}
                    </span>
                    {isSelected && (
                      <span className="text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Actif
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-900">
                    {isArabic ? style.labelAr : style.labelFr}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {isArabic ? style.descAr : style.descFr}
                  </p>
                </div>

                {/* Wireframe thumbnail simulation */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center">
                  <div className="w-full h-12 bg-slate-50 rounded border border-slate-200 p-1 flex flex-col justify-between">
                    {key === "MODERN" && (
                      <>
                        <div
                          className="h-2 rounded-xs w-full"
                          style={{ backgroundColor: activePalette.hex }}
                        />
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1/3 bg-slate-200 rounded-xs" />
                          <div className="h-1.5 w-1/4 bg-slate-200 rounded-xs" />
                        </div>
                        <div className="h-3 bg-slate-100 border border-slate-200 rounded-xs flex items-center px-1">
                          <div className="h-1 w-1/2 bg-slate-300 rounded-xs" />
                        </div>
                      </>
                    )}
                    {key === "CLASSIC" && (
                      <div className="h-full border border-slate-400 p-0.5 flex flex-col justify-between">
                        <div className="h-1.5 bg-slate-700 w-1/2" />
                        <div className="border-b border-t border-slate-300 py-0.5 flex justify-between">
                          <div className="h-1 w-1/3 bg-slate-300" />
                          <div className="h-1 w-1/4 bg-slate-300" />
                        </div>
                        <div
                          className="h-1.5 w-full"
                          style={{ backgroundColor: activePalette.darkHex }}
                        />
                      </div>
                    )}
                    {key === "MINIMALIST" && (
                      <div className="h-full flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <div className="h-1.5 w-1/3 bg-slate-800" />
                          <div
                            className="h-1 w-1/4"
                            style={{ backgroundColor: activePalette.hex }}
                          />
                        </div>
                        <div className="border-b border-slate-200 my-0.5" />
                        <div className="flex gap-1">
                          <div className="h-1 w-1/2 bg-slate-300" />
                          <div className="h-1 w-1/3 bg-slate-300" />
                        </div>
                        <div className="border-t border-slate-800 pt-0.5" />
                      </div>
                    )}
                    {key === "COMPACT" && (
                      <div className="h-full flex flex-col justify-between text-[6px]">
                        <div
                          className="h-1.5 w-full flex items-center px-1 text-white"
                          style={{ backgroundColor: activePalette.hex }}
                        />
                        <div className="grid grid-cols-3 gap-0.5">
                          <div className="h-1 bg-slate-200" />
                          <div className="h-1 bg-slate-200" />
                          <div className="h-1 bg-slate-200" />
                        </div>
                        <div className="grid grid-cols-3 gap-0.5">
                          <div className="h-1 bg-slate-100" />
                          <div className="h-1 bg-slate-100" />
                          <div className="h-1 bg-slate-100" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Interactive Preview Card */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>{t("previewInvoiceTitle")}</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {t("previewInvoiceNotice")}
          </span>
        </div>

        {/* Live Interactive Document Simulation */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-6 shadow-inner">
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            {/* Top Accent Stripe based on Template */}
            {templateStyle === "MODERN" && (
              <div
                className="h-2.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${activePalette.hex}, ${activePalette.darkHex})`,
                }}
              />
            )}
            {templateStyle === "CLASSIC" && (
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: activePalette.darkHex }}
              />
            )}
            {templateStyle === "COMPACT" && (
              <div
                className="h-1 w-full"
                style={{ backgroundColor: activePalette.hex }}
              />
            )}

            <div className="p-6 space-y-6">
              {/* Header with Logo and Seller */}
              <div
                className={`flex flex-col sm:flex-row items-center gap-4 pb-4 border-b ${
                  templateStyle === "CLASSIC"
                    ? "border-slate-800 border-b-2"
                    : "border-slate-100"
                } ${
                  logoPosition === "CENTER"
                    ? "sm:flex-col sm:text-center justify-center"
                    : logoPosition === "RIGHT"
                    ? "sm:flex-row-reverse justify-between"
                    : "justify-between"
                }`}
              >
                {/* Logo container */}
                {logoUrl ? (
                  <div className="h-12 max-w-[160px] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="max-h-12 max-w-[160px] object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="px-3 py-1.5 rounded-lg border text-[11px] font-bold"
                    style={{
                      borderColor: activePalette.borderHex,
                      backgroundColor: activePalette.lightBgHex,
                      color: activePalette.hex,
                    }}
                  >
                    {sellerName}
                  </div>
                )}

                {/* Document Title & Reference */}
                <div
                  className={`space-y-0.5 ${
                    logoPosition === "CENTER"
                      ? "text-center"
                      : logoPosition === "RIGHT"
                      ? "text-left"
                      : "text-right"
                  }`}
                >
                  <span
                    className="text-lg font-extrabold tracking-tight block"
                    style={{ color: activePalette.darkHex }}
                  >
                    FACTURE
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono">
                    N° FAC-2026-0001
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Date : 13 octobre 2026
                  </div>
                </div>
              </div>

              {/* Seller and Client Row */}
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div
                  className={`p-3 rounded-lg ${
                    templateStyle === "CLASSIC"
                      ? "border border-slate-300 bg-white"
                      : templateStyle === "MINIMALIST"
                      ? "border-l-2 border-slate-800 pl-2 bg-transparent"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Émetteur
                  </span>
                  <div className="font-bold text-slate-900">{sellerName}</div>
                  <div className="text-slate-500">{activityLabel}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    RNAE : 26/01-1600000 • NIF : 002616000000000
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg ${
                    templateStyle === "CLASSIC"
                      ? "border border-slate-300 bg-white"
                      : templateStyle === "MINIMALIST"
                      ? "border-l-2 border-slate-800 pl-2 bg-transparent"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Client
                  </span>
                  <div className="font-bold text-slate-900">Société SARL Exemple</div>
                  <div className="text-slate-500">12 Rue Didouche Mourad, Alger</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    NIF : 001916012345678
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead
                    style={{
                      backgroundColor:
                        templateStyle === "MINIMALIST"
                          ? "#ffffff"
                          : activePalette.lightBgHex,
                      borderBottom: `2px solid ${activePalette.borderHex}`,
                    }}
                  >
                    <tr>
                      <th className="py-2 px-3 font-bold" style={{ color: activePalette.darkHex }}>
                        Description
                      </th>
                      <th className="py-2 px-3 text-center font-bold" style={{ color: activePalette.darkHex }}>
                        Qté
                      </th>
                      <th className="py-2 px-3 text-right font-bold" style={{ color: activePalette.darkHex }}>
                        Prix Unit.
                      </th>
                      <th className="py-2 px-3 text-right font-bold" style={{ color: activePalette.darkHex }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 text-slate-800 font-medium">
                        Prestation de conseil technique & développement
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">1</td>
                      <td className="py-2 px-3 text-right text-slate-600">150 000 DZD</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">150 000 DZD</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legal Notice & Total Block */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-[10px] text-slate-500 italic max-w-xs">
                  « Facture exonérée de TVA en vertu de l&apos;article 13 du Décret exécutif n° 23-197. »
                </div>

                <div
                  className="px-4 py-2.5 rounded-xl border flex items-center gap-4"
                  style={{
                    backgroundColor: activePalette.lightBgHex,
                    borderColor: activePalette.borderHex,
                  }}
                >
                  <span className="text-[11px] font-bold text-slate-700">
                    Total Net à Payer :
                  </span>
                  <span
                    className="text-base font-extrabold"
                    style={{ color: activePalette.darkHex }}
                  >
                    150 000,00 DZD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
