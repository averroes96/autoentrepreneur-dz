"use client";

import React, { useState, useEffect } from "react";
import { validateAlgerianNif, sanitizeNif, NifValidationResult } from "@/lib/nifValidator";
import { CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, MapPin } from "lucide-react";

interface NifInputWithValidationProps {
  defaultValue?: string;
  name?: string;
}

export function NifInputWithValidation({
  defaultValue = "",
  name = "nif",
}: NifInputWithValidationProps) {
  const [value, setValue] = useState(defaultValue);
  const [result, setResult] = useState<NifValidationResult>(() =>
    validateAlgerianNif(defaultValue)
  );

  useEffect(() => {
    setResult(validateAlgerianNif(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeNif(raw).slice(0, 15);
    setValue(sanitized);
  };

  const digitsCount = sanitizeNif(value).length;
  const isComplete = digitsCount === 15;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          NIF (Numéro d'Identification Fiscale) <span className="text-rose-500">*</span>
        </label>
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold transition-colors ${
            isComplete
              ? result.isValid
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {digitsCount}/15 chiffres
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          id="nif-input"
          name={name}
          required
          maxLength={15}
          value={value}
          onChange={handleChange}
          placeholder="Ex: 198016010023456"
          className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-mono tracking-widest focus:bg-white focus:outline-none transition ${
            isComplete
              ? result.isValid
                ? "border-emerald-400 focus:ring-2 focus:ring-emerald-500"
                : "border-rose-400 focus:ring-2 focus:ring-rose-500"
              : "border-slate-200 focus:ring-2 focus:ring-emerald-500"
          }`}
        />

        <div className="absolute right-3 top-2.5">
          {isComplete && result.isValid && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          {isComplete && !result.isValid && (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
        </div>
      </div>

      {/* Real-time Validation Feedback */}
      {digitsCount > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {result.isValid && result.wilaya && (
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">NIF Conforme DGI (15 chiffres)</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[11px] font-medium text-emerald-800">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>
                  Wilaya {result.wilaya.code} : {result.wilaya.name} ({result.wilaya.arabicName})
                </span>
              </div>
            </div>
          )}

          {!result.isValid && digitsCount === 15 && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}

          {digitsCount > 0 && digitsCount < 15 && (
            <p className="text-[11px] text-slate-500">
              Veuillez saisir les 15 chiffres du NIF délivré par la Direction Générale des Impôts.
            </p>
          )}
        </div>
      )}

      {/* Helper text with official DGI link */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
        <span>Attribué lors de la déclaration d'existence fiscale.</span>
        <a
          href="https://nifenligne.mf.gov.dz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition"
        >
          <span>Portail DGI NIF en ligne</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default NifInputWithValidation;
