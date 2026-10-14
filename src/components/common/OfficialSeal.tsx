"use client";

import React from "react";

interface OfficialSealProps {
  fullName?: string | null;
  rnaeNumber?: string | null;
  nif?: string | null;
  activityLabel?: string | null;
  stampType?: "AUTO" | "AUTO_RECTANGLE" | "AUTO_ROUND" | "CUSTOM" | string | null;
  stampUrl?: string | null;
  signatureUrl?: string | null;
  size?: "sm" | "md" | "lg";
  inkColor?: string;
  className?: string;
  showSignature?: boolean;
}

/**
 * Procedural SVG Vector Signature ("Griffe Manuscrite")
 */
function ProceduralSvgSignature({
  color,
  className = "",
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 140 40"
      className={`w-full h-full pointer-events-none ${className}`}
      fill="none"
      style={{ color }}
    >
      {/* Dynamic signature stroke with realistic pen speed variations */}
      <path
        d="M 5,18 C 18,-6 36,-12 50,6 C 58,16 42,26 28,19 C 18,12 34,-2 62,2 C 82,5 98,13 124,9 C 104,18 88,23 112,24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.88"
      />
      {/* Expressive underline / flourish */}
      <path
        d="M 12,28 C 45,26 88,29 128,24"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />
    </svg>
  );
}

/**
 * OfficialSeal: Procedural Algerian Administrative Stamp & Signature ("Cachet & Griffe")
 * Conforms to Loi 22-23 & Algerian B2B commercial practices (Trodat / Colop standard).
 */
export function OfficialSeal({
  fullName = "Auto-Entrepreneur",
  rnaeNumber = "—",
  nif = "—",
  activityLabel = "Prestations de services",
  stampType = "AUTO",
  stampUrl,
  signatureUrl,
  size = "md",
  inkColor = "#1e40af", // Official Algerian administrative blue ink
  className = "",
  showSignature = true,
}: OfficialSealProps) {
  const isCustom = stampType === "CUSTOM" && Boolean(stampUrl);
  const isRound = stampType === "AUTO_ROUND";

  const nameUpper = (fullName || "AUTO-ENTREPRENEUR").toUpperCase();
  const rnaeClean = rnaeNumber || "—";
  const nifClean = nif || "—";
  const activityClean = activityLabel || "Prestations de services";

  // Dimension scaling
  const rectDimensions = {
    sm: { width: 154, height: 64 },
    md: { width: 188, height: 78 },
    lg: { width: 228, height: 94 },
  };

  const roundDimensions = {
    sm: { width: 100, height: 100 },
    md: { width: 130, height: 130 },
    lg: { width: 165, height: 165 },
  };

  // 1. CUSTOM SCANNED STAMP
  if (isCustom && stampUrl) {
    const dim = roundDimensions[size] || roundDimensions.md;
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none rotate-[-3deg] transition-transform ${className}`}
        style={{ width: dim.width, height: dim.height }}
      >
        {/* Scanned Stamp Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stampUrl}
          alt="Cachet Commercial"
          className="w-full h-full object-contain filter drop-shadow-2xs opacity-95"
        />

        {/* Overlaid Signature (Griffe) */}
        {showSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[4deg] scale-110">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureUrl}
                alt="Signature"
                className="max-w-[115%] max-h-[115%] object-contain filter drop-shadow-xs mix-blend-multiply"
              />
            ) : (
              <div className="w-[85%] h-[55%]">
                <ProceduralSvgSignature color={inkColor} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. CACHET CIRCULAIRE ADMINISTRATIF (TAMPON ROND PRO)
  if (isRound) {
    const dim = roundDimensions[size] || roundDimensions.md;
    const viewBoxSize = 220;
    const center = viewBoxSize / 2; // 110

    return (
      <div
        className={`relative inline-flex items-center justify-center select-none rotate-[-3.5deg] hover:rotate-[-1.5deg] transition-transform ${className}`}
        style={{ width: dim.width, height: dim.height }}
      >
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="w-full h-full overflow-visible drop-shadow-2xs"
          style={{ color: inkColor }}
        >
          <defs>
            {/* Top Arc for Algerian Header */}
            <path
              id="seal-top-curve"
              d="M 28,110 A 82,82 0 0,1 192,110"
              fill="none"
            />
            {/* Bottom Arc for Law 22-23 & Regime */}
            <path
              id="seal-bottom-curve"
              d="M 192,110 A 82,82 0 0,1 28,110"
              fill="none"
            />
          </defs>

          {/* Outer Heavy Ring */}
          <circle
            cx={center}
            cy={center}
            r={104}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeOpacity="0.88"
          />

          {/* Outer Secondary Fine Ring */}
          <circle
            cx={center}
            cy={center}
            r={98}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.85"
          />

          {/* Middle Dashed Security Border */}
          <circle
            cx={center}
            cy={center}
            r={76}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3.5,2.5"
            strokeOpacity="0.75"
          />

          {/* Innermost Medallion Ring */}
          <circle
            cx={center}
            cy={center}
            r={72}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.8"
          />

          {/* Top Arc Text */}
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
              ★ RÉPUBLIQUE ALGÉRIENNE ★
            </textPath>
          </text>

          {/* Bottom Arc Text */}
          <text
            fill="currentColor"
            fontSize="9"
            fontWeight="bold"
            letterSpacing="0.8"
            fillOpacity="0.9"
          >
            <textPath
              href="#seal-bottom-curve"
              startOffset="50%"
              textAnchor="middle"
            >
              ★ STATUT LOI 22-23 • IFU ★
            </textPath>
          </text>

          {/* Center Administrative Core Content */}
          <text
            x={center}
            y="85"
            textAnchor="middle"
            fill="currentColor"
            fontSize="12"
            fontWeight="900"
            letterSpacing="0.5"
            fillOpacity="0.95"
          >
            {nameUpper.length > 20 ? nameUpper.slice(0, 19) + "…" : nameUpper}
          </text>

          <text
            x={center}
            y="101"
            textAnchor="middle"
            fill="currentColor"
            fontSize="9"
            fontWeight="bold"
            letterSpacing="0.5"
            fillOpacity="0.88"
          >
            AUTO-ENTREPRENEUR
          </text>

          {/* Separator Line */}
          <line
            x1="58"
            y1="109"
            x2="162"
            y2="109"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* RNAE Number */}
          <text
            x={center}
            y="124"
            textAnchor="middle"
            fill="currentColor"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            fillOpacity="0.9"
          >
            RNAE : {rnaeClean}
          </text>

          {/* NIF */}
          <text
            x={center}
            y="139"
            textAnchor="middle"
            fill="currentColor"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
            fillOpacity="0.9"
          >
            NIF : {nifClean}
          </text>
        </svg>

        {/* Overlaid Signature (Griffe) */}
        {showSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[6deg] scale-105">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureUrl}
                alt="Signature"
                className="max-w-[110%] max-h-[110%] object-contain filter drop-shadow-xs mix-blend-multiply opacity-95"
              />
            ) : (
              <div className="w-[75%] h-[45%] opacity-90">
                <ProceduralSvgSignature color={inkColor} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. CACHET RECTANGULAIRE PROFESSIONNEL (GRIFFE B2B STANDARD TRODAT / COLOP)
  // Default and #1 standard for Algerian auto-entrepreneurs & service providers
  const dim = rectDimensions[size] || rectDimensions.md;
  const viewBoxW = 240;
  const viewBoxH = 100;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none rotate-[-2deg] hover:rotate-[-0.5deg] transition-transform ${className}`}
      style={{ width: dim.width, height: dim.height }}
    >
      <svg
        viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
        className="w-full h-full overflow-visible drop-shadow-2xs"
        style={{ color: inkColor }}
      >
        {/* Outer Heavy Rounded Border */}
        <rect
          x="3"
          y="3"
          width={viewBoxW - 6}
          height={viewBoxH - 6}
          rx="6"
          ry="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeOpacity="0.9"
        />

        {/* Inner Fine Border */}
        <rect
          x="7"
          y="7"
          width={viewBoxW - 14}
          height={viewBoxH - 14}
          rx="3.5"
          ry="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.82"
        />

        {/* 1. Header: Nom et Prénom */}
        <text
          x={viewBoxW / 2}
          y="25"
          textAnchor="middle"
          fill="currentColor"
          fontSize="12.5"
          fontWeight="900"
          letterSpacing="0.4"
          fillOpacity="0.95"
        >
          {nameUpper.length > 24 ? nameUpper.slice(0, 23) + "…" : nameUpper}
        </text>

        {/* 2. Subtitle: Statut Auto-Entrepreneur */}
        <text
          x={viewBoxW / 2}
          y="40"
          textAnchor="middle"
          fill="currentColor"
          fontSize="9.5"
          fontWeight="bold"
          letterSpacing="0.3"
          fillOpacity="0.9"
        >
          AUTO-ENTREPRENEUR • STATUT LOI 22-23
        </text>

        {/* 3. Activity label */}
        <text
          x={viewBoxW / 2}
          y="52"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8"
          fontStyle="italic"
          fillOpacity="0.85"
        >
          {activityClean.length > 36 ? activityClean.slice(0, 35) + "…" : activityClean}
        </text>

        {/* Thin divider */}
        <line
          x1="22"
          y1="58"
          x2={viewBoxW - 22}
          y2="58"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.8"
        />

        {/* 4. RNAE */}
        <text
          x={viewBoxW / 2}
          y="69"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.8"
          fontWeight="bold"
          fontFamily="monospace"
          fillOpacity="0.92"
        >
          RNAE : {rnaeClean}
        </text>

        {/* 5. NIF */}
        <text
          x={viewBoxW / 2}
          y="80"
          textAnchor="middle"
          fill="currentColor"
          fontSize="8.8"
          fontWeight="bold"
          fontFamily="monospace"
          fillOpacity="0.92"
        >
          NIF : {nifClean}
        </text>

        {/* 6. Tax Regime */}
        <text
          x={viewBoxW / 2}
          y="90"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7.5"
          fontWeight="600"
          letterSpacing="0.2"
          fillOpacity="0.82"
        >
          Régime IFU • Non Assujetti à la TVA
        </text>
      </svg>

      {/* Overlaid Signature (Griffe) */}
      {showSignature && (
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none pr-3 pt-2 rotate-[2deg]">
          {signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signatureUrl}
              alt="Signature"
              className="max-w-[75%] max-h-[75%] object-contain filter drop-shadow-xs mix-blend-multiply opacity-95"
            />
          ) : (
            <div className="w-[65%] h-[55%] opacity-90">
              <ProceduralSvgSignature color={inkColor} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OfficialSeal;
