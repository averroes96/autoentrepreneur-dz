"use client";

import React, { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
  previewVaultRestoreAction,
  executeVaultRestoreAction,
} from "@/app/actions";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Download,
  Upload,
  Database,
  FileArchive,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  KeyRound,
  RefreshCw,
  FileJson,
  Users,
  Receipt,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  HardDriveDownload,
  HardDriveUpload,
  Info,
} from "lucide-react";

interface VaultBackupClientProps {
  tenantName: string;
  currentStats: {
    invoicesCount: number;
    clientsCount: number;
    quotesCount: number;
    creditNotesCount: number;
    expensesCount: number;
  };
}

export function VaultBackupClient({
  tenantName,
  currentStats,
}: VaultBackupClientProps) {
  const { t, dir } = useI18n();

  // Export State
  const [exportFormat, setExportFormat] = useState<"zip" | "json">("zip");
  const [enableEncryption, setEnableEncryption] = useState<boolean>(false);
  const [exportPassphrase, setExportPassphrase] = useState<string>("");
  const [exportPassphraseConfirm, setExportPassphraseConfirm] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Inspection / Preview State
  const [previewData, setPreviewData] = useState<{
    isEncrypted: boolean;
    requiresPassphrase: boolean;
    manifest?: any;
    stats?: any;
  } | null>(null);

  const [restoreMode, setRestoreMode] = useState<"merge" | "overwrite">("merge");
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<any | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Handle Export
  const handleDownloadBackup = () => {
    setExportError(null);

    if (enableEncryption) {
      if (exportPassphrase.trim().length < 6) {
        setExportError(t("passphraseTooShort"));
        return;
      }
      if (exportPassphrase !== exportPassphraseConfirm) {
        setExportError(t("passwordsMismatch"));
        return;
      }
    }

    setIsExporting(true);

    const queryParams = new URLSearchParams();
    queryParams.set("format", exportFormat);
    if (enableEncryption && exportPassphrase.trim().length > 0) {
      queryParams.set("passphrase", exportPassphrase.trim());
    }

    const downloadUrl = `/api/backup/export?${queryParams.toString()}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `AutoEntrepreneurDZ_Vault_Backup.${exportFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setRestoreError(null);
      setRestoreSuccess(null);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      setRestoreError(null);
      setRestoreSuccess(null);
    }
  };

  // Inspect / Preview File
  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setRestoreError(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      if (restorePassphrase.trim().length > 0) {
        formData.set("passphrase", restorePassphrase.trim());
      }

      const res = await previewVaultRestoreAction(formData);

      if (res.error) {
        setRestoreError(res.error);
        if (res.requiresPassphrase) {
          setPreviewData({
            isEncrypted: true,
            requiresPassphrase: true,
          });
        }
      } else if (res.success) {
        setPreviewData({
          isEncrypted: Boolean(res.isEncrypted),
          requiresPassphrase: Boolean(res.requiresPassphrase),
          manifest: res.manifest,
          stats: res.stats,
        });
      }
    } catch (err: any) {
      setRestoreError(err.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!selectedFile) return;
    if (restoreMode === "overwrite" && !confirmOverwrite) {
      setRestoreError("Veuillez cocher la confirmation pour le mode Remplacement complet.");
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);
      formData.set("mode", restoreMode);
      if (restorePassphrase.trim().length > 0) {
        formData.set("passphrase", restorePassphrase.trim());
      }

      const res = await executeVaultRestoreAction(formData);

      if (res.error) {
        setRestoreError(res.error);
      } else if (res.success) {
        setRestoreSuccess(res.restoredCounts);
        setPreviewData(null);
        setSelectedFile(null);
      }
    } catch (err: any) {
      setRestoreError(err.message || "Erreur lors de la restauration.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-8" dir={dir}>
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>LOI N° 22-23 • SOUVERAINETÉ & PORTABILITÉ DES DONNÉES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("vaultTitle")}
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-2xl">
            {t("vaultSubtitle")}
          </p>
        </div>

        {/* Database Live Stats Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-2xs font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentStats.clientsCount} clients</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-2xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentStats.invoicesCount} factures</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-2xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentStats.quotesCount} devis</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl shadow-2xs font-semibold">
            <Receipt className="w-3.5 h-3.5 text-amber-600" />
            <span>{currentStats.expensesCount} dépenses</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Export (Left) & Restore (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* =========================================================
            SECTION 1: EXPORT VAULT BACKUP
        ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  {t("vaultExportTitle")}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sauvegarde chiffrée ou export ouvert
                </p>
              </div>
            </div>
          </div>

          {/* Card Form */}
          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("vaultExportDesc")}
            </p>

            {exportError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            {/* Format Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {t("vaultFormatLabel")}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat("zip")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    exportFormat === "zip"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-slate-900"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileArchive className={`w-5 h-5 ${exportFormat === "zip" ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Recommandé
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Archive ZIP Complète</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">JSON + 5 Tableaux CSV exploitables</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("json")}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    exportFormat === "json"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-slate-900"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FileJson className={`w-5 h-5 ${exportFormat === "json" ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Fichier JSON Unique</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Coffre-fort numérique compact</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Encryption Option Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="enableEncryption"
                  checked={enableEncryption}
                  onChange={(e) => setEnableEncryption(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="enableEncryption" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    {t("vaultEncryptionOption")}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Chiffre l&apos;archive avec l&apos;algorithme bancaire AES-256-GCM. Indéchiffrable sans votre mot de passe.
                  </span>
                </label>
              </div>

              {enableEncryption && (
                <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("vaultPassphraseLabel")}
                    </label>
                    <input
                      type="password"
                      value={exportPassphrase}
                      onChange={(e) => setExportPassphrase(e.target.value)}
                      placeholder={t("vaultPassphrasePlaceholder")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t("vaultPassphraseConfirmLabel")}
                    </label>
                    <input
                      type="password"
                      value={exportPassphraseConfirm}
                      onChange={(e) => setExportPassphraseConfirm(e.target.value)}
                      placeholder={t("vaultPassphraseConfirmPlaceholder")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 leading-snug">
                    {t("vaultPassphraseHelp")}
                  </p>
                </div>
              )}
            </div>

            {/* Export Action Button */}
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t("downloadingVault")}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t("btnDownloadVault")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =========================================================
            SECTION 2: RESTORE VAULT BACKUP
        ========================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <HardDriveUpload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  {t("vaultRestoreTitle")}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Restauration atomique avec vérification d&apos;intégrité
                </p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("vaultRestoreDesc")}
            </p>

            {restoreError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {/* Success Banner */}
            {restoreSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{t("restoreSuccessTitle")}</span>
                </div>
                <p className="text-xs text-emerald-800">
                  {t("restoreSuccessDesc")}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t("btnRefreshPage")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed text-center transition cursor-pointer ${
                isDragging
                  ? "border-emerald-600 bg-emerald-50/70"
                  : selectedFile
                  ? "border-emerald-400 bg-emerald-50/30"
                  : "border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                {selectedFile ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              {selectedFile ? (
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} Ko • Prêt pour l&apos;analyse
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {t("dropzoneTitle")}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {t("dropzoneSubtitle")}
                  </div>
                </div>
              )}
            </div>

            {/* Passphrase Input if File is Encrypted */}
            {previewData?.requiresPassphrase && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>{t("passphraseRequiredTitle")}</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  {t("passphraseRequiredDesc")}
                </p>
                <div>
                  <input
                    type="password"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    placeholder="Entrez le mot de passe de cette sauvegarde..."
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeFile}
                  disabled={isAnalyzing || restorePassphrase.trim().length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Déchiffrement...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Déchiffrer & Analyser</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Inspection Action Button before preview */}
            {!previewData && selectedFile && (
              <button
                type="button"
                onClick={handleAnalyzeFile}
                disabled={isAnalyzing}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("inspectingFile")}</span>
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-4 h-4" />
                    <span>{t("btnInspectVault")}</span>
                  </>
                )}
              </button>
            )}

            {/* =========================================================
                PREVIEW & RESTORE CONFIGURATION
            ========================================================= */}
            {previewData && !previewData.requiresPassphrase && previewData.stats && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {t("previewTitle")}
                    </span>
                  </div>
                  {previewData.isEncrypted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <Lock className="w-3 h-3" />
                      <span>{t("previewEncryptedBadge")}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-medium">
                      <span>{t("previewUnencryptedBadge")}</span>
                    </span>
                  )}
                </div>

                {/* Manifest Metadata */}
                {previewData.manifest && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="text-slate-400 block">Titulaire :</span>
                      <strong className="text-slate-800 font-semibold">
                        {previewData.manifest.tenantName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Date d&apos;export :</span>
                      <strong className="text-slate-800 font-semibold">
                        {new Date(previewData.manifest.exportedAt).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Detected Stats Grid */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    {t("previewRecordsToRestore")}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {previewData.stats.clientsCount}
                      </div>
                      <div className="text-[10px] text-slate-500">{t("recordsClients")}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {previewData.stats.invoicesCount}
                      </div>
                      <div className="text-[10px] text-slate-500">{t("recordsInvoices")}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {previewData.stats.quotesCount}
                      </div>
                      <div className="text-[10px] text-slate-500">{t("recordsQuotes")}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {previewData.stats.expensesCount}
                      </div>
                      <div className="text-[10px] text-slate-500">{t("recordsExpenses")}</div>
                    </div>
                  </div>
                </div>

                {/* Mode Selector (Merge vs Overwrite) */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("restoreModeLabel")}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === "merge"}
                        onChange={() => setRestoreMode("merge")}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">
                          Fusion intelligente (Recommandé)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {t("modeMerge")}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-white cursor-pointer hover:bg-slate-50 transition">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="overwrite"
                        checked={restoreMode === "overwrite"}
                        onChange={() => setRestoreMode("overwrite")}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-rose-700 block">
                          Remplacement complet (Écrasement propre)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {t("modeOverwrite")}
                        </span>
                      </div>
                    </label>
                  </div>

                  {restoreMode === "overwrite" && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px] space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>{t("overwriteWarning")}</div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-bold pt-1 text-rose-950">
                        <input
                          type="checkbox"
                          checked={confirmOverwrite}
                          onChange={(e) => setConfirmOverwrite(e.target.checked)}
                          className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span>Je confirme vouloir écraser toutes mes données actuelles</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Final Execute Restore Button */}
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring || (restoreMode === "overwrite" && !confirmOverwrite)}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-white font-semibold text-xs transition cursor-pointer shadow-md ${
                    restoreMode === "overwrite"
                      ? "bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-rose-600/20"
                      : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-emerald-600/20"
                  }`}
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t("restoringVault")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t("btnConfirmRestore")}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
