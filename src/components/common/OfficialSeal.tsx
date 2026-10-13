"use client";

import React from "react";

interface OfficialSealProps {
  fullName?: string | null;
  rnaeNumber?: string | null;
  nif?: string | null;
  stampType?: "AUTO" | "CUSTOM" | string | null;
  stampUrl?: string | null;
  signatureUrl?: string | null;
  size?: "sm" | "md" | "lg";
  inkColor?: string;
  className?: string;
  showSignature?: boolean;
}

/**
 * OfficialSeal: Procedural Algerian Administrative Stamp & Signature ("Cachet & Griffe")
 * Conforms to Loi 22-23 & Algerian B2B commercial practices.
 */
export function OfficialSeal({
  fullName = "Auto-Entrepreneur",
  rnaeNumber = "—",
  nif = "—",
  stampType = "AUTO",
  stampUrl,
  signatureUrl,
  size = "md",
  inkColor = "#1e40af", // Official Algerian administrative blue ink
  className = "",
  showSignature = true,
}: OfficialSealProps) {
  const isCustom = stampType === "CUSTOM" && Boolean(stampUrl);

  const dimensionMap = {
    sm: { box: 110, fontSizeName: 9, fontSizeMeta: 7 },
    md: { box: 144, fontSizeName: 11, fontSizeMeta: 8 },
    lg: { box: 175, fontSizeName: 13, fontSizeMeta: 9.5 },
  };

  const dim = dimensionMap[size] || dimensionMap.md;
  const nameUpper = (fullName || "AUTO-ENTREPRENEUR").toUpperCase();
  const rnaeClean = rnaeNumber || "—";
  const nifClean = nif || "—";

  // If user provided a custom scanned stamp
  if (isCustom && stampUrl) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none rotate-[-4deg] transition-transform ${className}`}
        style={{ width: dim.box, height: dim.box }}
      >
        {/* Scanned Stamp Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stampUrl}
          alt="Cachet Commercial"
          className="w-full h-full object-contain filter drop-shadow-2xs opacity-95"
        />

        {/* Overlaid Signature (Griffe) */}
        {showSignature && signatureUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[6deg] scale-110">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt="Signature"
              className="max-w-[115%] max-h-[115%] object-contain filter drop-shadow-xs mix-blend-multiply"
            />
          </div>
        )}
      </div>
    );
  }

  // Auto-Generated Procedural Circular Administrative Seal
  const viewBoxSize = 220;
  const center = viewBoxSize / 2; // 110

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none rotate-[-5deg] hover:rotate-[-2deg] transition-transform ${className}`}
      style={{ width: dim.box, height: dim.box }}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full overflow-visible drop-shadow-2xs"
        style={{ color: inkColor }}
      >
        <defs>
          {/* Top Arc for Arabic Republic Title */}
          {/* Arc from 205 deg to 335 deg */}
          <path
            id="seal-top-curve"
            d="M 22,110 A 88,88 0 0,1 198,110"
            fill="none"
          />
          {/* Bottom Arc for Law 22-23 & Regime */}
          <path
            id="seal-bottom-curve"
            d="M 198,110 A 88,88 0 0,1 22,110"
            fill="none"
          />
        </defs>

        {/* Outer Heavy Ring */}
        <circle
          cx={center}
          cy={center}
          r={105}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.88"
        />

        {/* Outer Secondary Fine Ring */}
        <circle
          cx={center}
          cy={center}
          r={99}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />

        {/* Middle Dashed Security Border */}
        <circle
          cx={center}
          cy={center}
          r={73}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3,2.5"
          strokeOpacity="0.75"
        />

        {/* Innermost Medallion Ring */}
        <circle
          cx={center}
          cy={center}
          r={69}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.8"
        />

        {/* Top Arc Text: République Algérienne & Arabic Header */}
        <text
          fill="currentColor"
          fontSize="10"
          fontWeight="bold"
          letterSpacing="0.8"
          fillOpacity="0.9"
        >
          <textPath
            href="#seal-top-curve"
            startOffset="50%"
            textAnchor="middle"
          >
            الجمهورية الجزائرية الديمقراطية الشعبية
          </textPath>
        </text>

        {/* Bottom Arc Text: Statut Auto-Entrepreneur • Loi 22-23 */}
        <text
          fill="currentColor"
          fontSize="8.5"
          fontWeight="bold"
          letterSpacing="0.8"
          fillOpacity="0.9"
        >
          <textPath
            href="#seal-bottom-curve"
            startOffset="50%"
            textAnchor="middle"
          >
            ★ STATUT AUTO-ENTREPRENEUR • LOI 22-23 ★
          </textPath>
        </text>

        {/* Center Administrative Core Content */}
        {/* Full Name */}
        <text
          x={center}
          y="76"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11.5"
          fontWeight="900"
          letterSpacing="0.5"
          fillOpacity="0.95"
        >
          {nameUpper.length > 20 ? nameUpper.slice(0, 19) + "…" : nameUpper}
        </text>

        {/* Arabic Subtitle: المقاول الذاتي */}
        <text
          x={center}
          y="93"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11.5"
          fontWeight="bold"
          fillOpacity="0.9"
        >
          المقاول الذاتي
        </text>

        {/* Decorative Separator Line */}
        <line
          x1="58"
          y1="102"
          x2="162"
          y2="102"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />

        {/* RNAE Number */}
        <text
          x={center}
          y="117"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="monospace"
          fillOpacity="0.9"
        >
          RNAE : {rnaeClean}
        </text>

        {/* NIF */}
        <text
          x={center}
          y="131"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="monospace"
          fillOpacity="0.9"
        >
          NIF : {nifClean}
        </text>

        {/* Tax Exemption Status */}
        <text
          x={center}
          y="145"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7.5"
          fontWeight="bold"
          letterSpacing="0.4"
          fillOpacity="0.85"
        >
          EXONÉRÉ DE TVA (IFU)
        </text>
      </svg>

      {/* Overlaid Signature (Griffe) */}
      {showSignature && signatureUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[8deg] scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureUrl}
            alt="Signature"
            className="max-w-[110%] max-h-[110%] object-contain filter drop-shadow-xs mix-blend-multiply opacity-95"
          />
        </div>
      )}
    </div>
  );
}

export default OfficialSeal;
