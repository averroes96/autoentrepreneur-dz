import PDFDocument from "pdfkit";
import { formatDZD } from "./tax";
import type { AnnualTaxSummary } from "./taxSummary";
import { getFrenchAmountInWords } from "./numberToWordsFr";
import type { ClientLedgerData } from "./clientLedger";
import { formatPaymentMethodLabel } from "./clientLedger";
import {
  formatCurrencyAmount,
  getCurrencyDef,
  calculateDzdEquivalent,
} from "./currencies";
import {
  getBrandPalette,
  getTemplateStyle,
  type BrandPalette,
  type TemplateStyleKey,
} from "./invoiceDesign";
import {
  formatRip,
  formatIban,
  PAYMENT_TERMS_CONFIG,
} from "./banking";

export interface SellerBrandingFields {
  logoUrl?: string | null;
  logoPosition?: string | null;
  brandColor?: string | null;
  templateStyle?: string | null;
  showStampSignature?: boolean | null;
  stampType?: string | null;
  stampUrl?: string | null;
  signatureUrl?: string | null;
}

function getLogoBuffer(logoUrl?: string | null): Buffer | null {
  if (!logoUrl || typeof logoUrl !== "string") return null;
  try {
    const base64Data = logoUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "").trim();
    if (!base64Data) return null;
    const buf = Buffer.from(base64Data, "base64");
    if (buf.length < 10) return null;
    return buf;
  } catch {
    return null;
  }
}

function tryDrawImage(
  doc: PDFKit.PDFDocument,
  buf: Buffer,
  x: number,
  y: number,
  options?: any
): boolean {
  try {
    doc.image(buf, x, y, options);
    return true;
  } catch (err) {
    console.warn("Failed to render logo in PDFKit:", err);
    return false;
  }
}

function drawTemplateAccentBar(
  doc: PDFKit.PDFDocument,
  templateKey: TemplateStyleKey,
  palette: BrandPalette,
  margin: number,
  contentWidth: number
): void {
  if (templateKey === "MODERN") {
    doc.rect(margin, margin, contentWidth, 3.5).fill(palette.hex);
  } else if (templateKey === "CLASSIC") {
    doc.rect(margin, margin, contentWidth, 4).fill(palette.darkHex);
  } else if (templateKey === "MINIMALIST") {
    doc.rect(margin, margin, contentWidth, 1).fill(palette.borderHex);
  } else if (templateKey === "COMPACT") {
    doc.rect(margin, margin, contentWidth, 2).fill(palette.hex);
  } else {
    doc.rect(margin, margin, contentWidth, 3).fill(palette.hex);
  }
}

function drawProceduralSignaturePdf(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  scale = 1,
  color = "#1e40af"
): void {
  doc.save();
  doc.translate(x, y);
  doc.scale(scale);
  doc.rotate(-3);

  doc
    .moveTo(0, 14)
    .bezierCurveTo(12, -8, 28, -14, 40, 4)
    .bezierCurveTo(46, 15, 34, 22, 22, 16)
    .bezierCurveTo(14, 10, 30, -4, 55, 0)
    .bezierCurveTo(72, 4, 88, 10, 110, 7)
    .bezierCurveTo(92, 15, 78, 19, 100, 20)
    .lineWidth(1.1)
    .strokeColor(color)
    .stroke();

  doc
    .moveTo(8, 23)
    .bezierCurveTo(40, 21, 80, 24, 115, 20)
    .lineWidth(0.8)
    .strokeColor(color)
    .stroke();

  doc.restore();
}

function drawRectangularStampPdf(
  doc: PDFKit.PDFDocument,
  params: {
    x: number;
    y: number;
    width: number;
    height: number;
    seller: {
      fullName: string;
      rnaeNumber: string;
      nif: string;
      activityLabel?: string;
      signatureUrl?: string | null;
    };
    inkColor: string;
  }
): void {
  const { x, y, width, height, seller, inkColor } = params;
  doc.save();
  doc.translate(x, y);
  doc.rotate(-2, { origin: [width / 2, height / 2] });

  // Double rounded borders with realistic stamp look
  doc.roundedRect(0, 0, width, height, 4).lineWidth(1.5).strokeColor(inkColor).stroke();
  doc.roundedRect(2, 2, width - 4, height - 4, 2.5).lineWidth(0.6).strokeColor(inkColor).stroke();

  const pad = 5;
  const innerW = width - pad * 2;
  const nameUpper = (seller.fullName || "AUTO-ENTREPRENEUR").toUpperCase();

  // 1. Nom & Prénom
  doc.fillColor(inkColor).fontSize(8.5).font("Helvetica-Bold");
  doc.text(nameUpper.length > 25 ? nameUpper.slice(0, 24) + "…" : nameUpper, pad, 6, { width: innerW, align: "center" });

  // 2. Statut Auto-Entrepreneur
  doc.fontSize(6).font("Helvetica-Bold");
  doc.text("AUTO-ENTREPRENEUR  •  STATUT LOI 22-23", pad, 17, { width: innerW, align: "center" });

  // 3. Activité / Métier
  const activity = seller.activityLabel || "Prestations de services";
  doc.fontSize(5.5).font("Helvetica-Oblique");
  doc.text(activity.length > 40 ? activity.slice(0, 39) + "…" : activity, pad, 25, { width: innerW, align: "center" });

  // Separator line
  doc.moveTo(pad + 12, 33).lineTo(width - pad - 12, 33).lineWidth(0.5).strokeColor(inkColor).stroke();

  // 4. Identifiants légaux
  doc.fontSize(6).font("Helvetica-Bold");
  doc.text(`RNAE : ${seller.rnaeNumber || "—"}`, pad, 36, { width: innerW, align: "center" });
  doc.text(`NIF : ${seller.nif || "—"}`, pad, 44, { width: innerW, align: "center" });

  // 5. Régime fiscal
  doc.fontSize(5).font("Helvetica");
  doc.text("Régime IFU  •  Non Assujetti à la TVA", pad, 52, { width: innerW, align: "center" });

  // Overlaid signature (either custom or procedural)
  if (seller.signatureUrl) {
    const sigBuf = getLogoBuffer(seller.signatureUrl);
    if (sigBuf) {
      tryDrawImage(doc, sigBuf, width * 0.35, height * 0.25, {
        fit: [width * 0.6, height * 0.7],
        align: "center",
        valign: "center",
      });
    }
  } else {
    drawProceduralSignaturePdf(doc, width * 0.38, height * 0.44, 0.65, inkColor);
  }

  doc.restore();
}

function drawCircularStampPdf(
  doc: PDFKit.PDFDocument,
  params: {
    centerX: number;
    centerY: number;
    radius: number;
    seller: {
      fullName: string;
      rnaeNumber: string;
      nif: string;
      signatureUrl?: string | null;
    };
    inkColor: string;
  }
): void {
  const { centerX, centerY, radius, seller, inkColor } = params;
  doc.save();
  doc.rotate(-3, { origin: [centerX, centerY] });

  // Concentric rings
  doc.circle(centerX, centerY, radius).lineWidth(1.5).strokeColor(inkColor).stroke();
  doc.circle(centerX, centerY, radius - 2.2).lineWidth(0.6).strokeColor(inkColor).stroke();
  doc.circle(centerX, centerY, radius - 10).lineWidth(0.5).dash(2, { space: 2 }).strokeColor(inkColor).stroke().undash();
  doc.circle(centerX, centerY, radius - 11.8).lineWidth(0.6).strokeColor(inkColor).stroke();

  // Top arc (clockwise)
  function drawArcTop(text: string, r: number, startAngle: number, endAngle: number) {
    const chars = text.split("");
    const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
    chars.forEach((ch, i) => {
      const angleDeg = startAngle + i * step;
      const rad = (angleDeg * Math.PI) / 180;
      const px = centerX + r * Math.sin(rad);
      const py = centerY - r * Math.cos(rad);
      doc.save();
      doc.translate(px, py);
      doc.rotate(angleDeg);
      doc.fontSize(4.5).font("Helvetica-Bold").fillColor(inkColor);
      doc.text(ch, -doc.widthOfString(ch) / 2, -2.5);
      doc.restore();
    });
  }

  // Bottom arc (readable along lower curve)
  function drawArcBottom(text: string, r: number, startAngle: number, endAngle: number) {
    const chars = text.split("");
    const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
    chars.forEach((ch, i) => {
      const angleDeg = startAngle + i * step;
      const rad = (angleDeg * Math.PI) / 180;
      const px = centerX - r * Math.sin(rad);
      const py = centerY + r * Math.cos(rad);
      doc.save();
      doc.translate(px, py);
      doc.rotate(-angleDeg);
      doc.fontSize(4.0).font("Helvetica-Bold").fillColor(inkColor);
      doc.text(ch, -doc.widthOfString(ch) / 2, -2.5);
      doc.restore();
    });
  }

  drawArcTop("★  RÉPUBLIQUE ALGÉRIENNE  ★", radius - 6.5, -55, 55);
  drawArcBottom("★  STATUT LOI 22-23  •  IFU  ★", radius - 6.5, -60, 60);

  // Center Content: well-spaced & clean
  const nameUpper = (seller.fullName || "AUTO-ENTREPRENEUR").toUpperCase();
  doc.fillColor(inkColor).fontSize(6.5).font("Helvetica-Bold");
  doc.text(nameUpper.length > 18 ? nameUpper.slice(0, 17) + "…" : nameUpper, centerX - 25, centerY - 10, { width: 50, align: "center" });

  doc.fontSize(4.5).font("Helvetica-Bold").text("AUTO-ENTREPRENEUR", centerX - 25, centerY - 2, { width: 50, align: "center" });

  doc.moveTo(centerX - 18, centerY + 4).lineTo(centerX + 18, centerY + 4).lineWidth(0.5).strokeColor(inkColor).stroke();

  doc.fontSize(4.2).font("Helvetica-Bold").text(`RNAE : ${seller.rnaeNumber}`, centerX - 26, centerY + 6.5, { width: 52, align: "center" });
  doc.fontSize(4.2).font("Helvetica-Bold").text(`NIF : ${seller.nif}`, centerX - 26, centerY + 12.5, { width: 52, align: "center" });

  // Overlaid signature (either custom or procedural)
  if (seller.signatureUrl) {
    const sigBuf = getLogoBuffer(seller.signatureUrl);
    if (sigBuf) {
      tryDrawImage(doc, sigBuf, centerX - radius * 0.7, centerY - radius * 0.35, {
        fit: [radius * 1.4, radius * 0.9],
        align: "center",
        valign: "center",
      });
    }
  } else {
    drawProceduralSignaturePdf(doc, centerX - 18, centerY - 4, 0.45, inkColor);
  }

  doc.restore();
}

function drawOfficialSealPdf(
  doc: PDFKit.PDFDocument,
  params: {
    centerX?: number;
    centerY?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    seller: {
      fullName: string;
      rnaeNumber: string;
      nif: string;
      activityLabel?: string;
      stampType?: string | null;
      stampUrl?: string | null;
      signatureUrl?: string | null;
    };
    sealColor: string;
  }
): void {
  const { seller, sealColor } = params;
  const isCustom = seller.stampType === "CUSTOM" && Boolean(seller.stampUrl);
  const isRound = seller.stampType === "AUTO_ROUND";

  if (isCustom && seller.stampUrl) {
    const stampBuf = getLogoBuffer(seller.stampUrl);
    if (stampBuf) {
      const targetW = params.width || (params.radius ? params.radius * 2 : 120);
      const targetH = params.height || (params.radius ? params.radius * 2 : 70);
      const targetX = params.x !== undefined ? params.x : (params.centerX || 0) - targetW / 2;
      const targetY = params.y !== undefined ? params.y : (params.centerY || 0) - targetH / 2;
      tryDrawImage(doc, stampBuf, targetX, targetY, {
        fit: [targetW, targetH],
        align: "center",
        valign: "center",
      });
      if (seller.signatureUrl) {
        const sigBuf = getLogoBuffer(seller.signatureUrl);
        if (sigBuf) {
          tryDrawImage(doc, sigBuf, targetX + targetW * 0.25, targetY + targetH * 0.2, {
            fit: [targetW * 0.6, targetH * 0.7],
            align: "center",
            valign: "center",
          });
        }
      } else {
        drawProceduralSignaturePdf(doc, targetX + targetW * 0.35, targetY + targetH * 0.4, 0.65, sealColor);
      }
    }
    return;
  }

  if (isRound) {
    const r = params.radius || 30;
    const cX = params.centerX !== undefined ? params.centerX : (params.x || 0) + (params.width || 60) / 2;
    const cY = params.centerY !== undefined ? params.centerY : (params.y || 0) + (params.height || 60) / 2;
    drawCircularStampPdf(doc, {
      centerX: cX,
      centerY: cY,
      radius: r,
      seller,
      inkColor: sealColor,
    });
    return;
  }

  // Default: Authentic Rectangular Griffe Commerciale B2B (Trodat / Colop standard)
  const w = params.width || 176;
  const h = params.height || 60;
  const stampX = params.x !== undefined ? params.x : (params.centerX || 0) - w / 2;
  const stampY = params.y !== undefined ? params.y : (params.centerY || 0) - h / 2;

  drawRectangularStampPdf(doc, {
    x: stampX,
    y: stampY,
    width: w,
    height: h,
    seller,
    inkColor: sealColor,
  });
}

export interface InvoicePdfData {
  invoice: {
    invoiceNumber: string | null;
    issueDate: Date | string;
    dueDate?: Date | string | null;
    paymentTerms?: string | null;
    total: number;
    currency: string;
    exchangeRate?: number | null;
    totalDzd?: number | null;
    vatExemptionNote: string;
    notes?: string | null;
    sellerSnapshot?: string | null;
    clientSnapshot?: string | null;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    email: string;
    phone: string;
    activityCode: string;
    activityLabel: string;
    logoUrl?: string | null;
    logoPosition?: string | null;
    brandColor?: string | null;
    templateStyle?: string | null;
    bankName?: string | null;
    bankRib?: string | null;
    bankIban?: string | null;
    bankBic?: string | null;
    accountHolder?: string | null;
    bankAgency?: string | null;
    ccpNumber?: string | null;
    ccpKey?: string | null;
    paymentTerms?: string | null;
    paymentInstructions?: string | null;
    showStampSignature?: boolean | null;
    stampType?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
  };
  client: {
    name: string;
    clientType: string;
    address: string;
    nif?: string | null;
    nis?: string | null;
    rc?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 25, left: 40, right: 40 },
        info: {
          Title: `Facture ${data.invoice.invoiceNumber || "Brouillon"}`,
          Author: data.seller.fullName,
          Subject: "Facture Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const rawSeller = data.invoice.sellerSnapshot
        ? JSON.parse(data.invoice.sellerSnapshot)
        : {};

      const seller = {
        ...rawSeller,
        ...data.seller,
        brandColor: data.seller?.brandColor || rawSeller.brandColor,
        templateStyle: data.seller?.templateStyle || rawSeller.templateStyle,
        logoUrl: data.seller?.logoUrl !== undefined ? data.seller.logoUrl : rawSeller.logoUrl,
        logoPosition: data.seller?.logoPosition || rawSeller.logoPosition,
        showStampSignature: data.seller?.showStampSignature !== undefined ? data.seller.showStampSignature : (rawSeller.showStampSignature ?? true),
        stampType: data.seller?.stampType || rawSeller.stampType,
        stampUrl: data.seller?.stampUrl !== undefined ? data.seller.stampUrl : rawSeller.stampUrl,
        signatureUrl: data.seller?.signatureUrl !== undefined ? data.seller.signatureUrl : rawSeller.signatureUrl,
      };

      const client = data.invoice.clientSnapshot
        ? JSON.parse(data.invoice.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Brand Styling Engine (Phase 4 Module 1)
      const palette = getBrandPalette(seller.brandColor);
      const template = getTemplateStyle(seller.templateStyle);
      const primaryColor = palette.hex;
      const darkColor = palette.darkHex;
      const mutedColor = "#64748b";
      const lightBg = template.key === "MINIMALIST" ? "#ffffff" : palette.lightBgHex;
      const borderColor = palette.borderHex;
      const cornerRadius = template.key === "CLASSIC" ? 2 : template.key === "MINIMALIST" ? 3 : 6;

      const logoBuf = getLogoBuffer(seller.logoUrl);
      const logoPos = ((seller.logoPosition || "LEFT").toUpperCase()) as "LEFT" | "CENTER" | "RIGHT";

      // --- HEADER ACCENT BAR ---
      drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);

      const headerTopY = margin + 12;
      const dateStr = new Date(data.invoice.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let boxesY = 120;

      if (logoBuf && logoPos === "CENTER") {
        // --- 1. CENTERED LOGO & HEADER ---
        const centerW = 110;
        const centerH = 36;
        const centerLogoX = (pageWidth - centerW) / 2;
        tryDrawImage(doc, logoBuf, centerLogoX, headerTopY, {
          fit: [centerW, centerH],
          align: "center",
          valign: "center",
        });

        const titleY = headerTopY + centerH + 6;
        doc.fontSize(20).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE", margin, titleY, {
          align: "center",
          width: contentWidth,
        });
        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / IFU)", margin, titleY + 22, {
            align: "center",
            width: contentWidth,
          });
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(mutedColor)
          .text(
            `N° de Facture : ${data.invoice.invoiceNumber || "BROUILLON"}    •    Date d'émission : ${dateStr}`,
            margin,
            titleY + 34,
            { align: "center", width: contentWidth }
          );

        doc.moveTo(margin, titleY + 48).lineTo(margin + contentWidth, titleY + 48).strokeColor(borderColor).stroke();
        boxesY = titleY + 56;
      } else if (logoBuf && logoPos === "RIGHT") {
        // --- 2. LOGO ON RIGHT, TITLE ON LEFT ---
        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE", margin, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / IFU)", margin, headerTopY + 24, {
            width: 230,
          });

        const rightW = 80;
        const rightH = 38;
        const rightLogoX = margin + contentWidth - rightW;
        tryDrawImage(doc, logoBuf, rightLogoX, headerTopY, {
          fit: [rightW, rightH],
          align: "right",
          valign: "center",
        });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° de Facture :", 240, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.invoice.invoiceNumber || "BROUILLON", 340, headerTopY, { width: 90 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 240, headerTopY + 16, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 340, headerTopY + 16, { width: 90 });

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        boxesY = headerTopY + 54;
      } else {
        // --- 3. LOGO ON LEFT (OR NO LOGO) ---
        let leftTitleX = margin;
        if (logoBuf && logoPos === "LEFT") {
          const leftW = 80;
          const leftH = 38;
          const drawn = tryDrawImage(doc, logoBuf, margin, headerTopY, {
            fit: [leftW, leftH],
            valign: "center",
          });
          if (drawn) {
            leftTitleX = margin + leftW + 12;
          }
        }

        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE", leftTitleX, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / IFU)", leftTitleX, headerTopY + 24, {
            width: 220,
          });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° de Facture :", 340, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.invoice.invoiceNumber || "BROUILLON", 440, headerTopY, { width: 115 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 340, headerTopY + 16, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 440, headerTopY + 16, { width: 115 });

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        boxesY = headerTopY + 54;
      }
      const boxWidth = (contentWidth - 16) / 2;
      const boxHeight = template.key === "COMPACT" ? 108 : 120;

      // Seller Box
      doc.roundedRect(margin, boxesY, boxWidth, boxHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(primaryColor).fontSize(8).font("Helvetica-Bold").text("ÉMETTEUR (AUTO-ENTREPRENEUR)", margin + 12, boxesY + 10);
      doc.fillColor(darkColor).fontSize(11).font("Helvetica-Bold").text(seller.fullName || "Auto-Entrepreneur", margin + 12, boxesY + 24);

      doc.fontSize(8.5).font("Helvetica").fillColor(darkColor);
      doc.text(`N° RNAE : ${seller.rnaeNumber || "—"}`, margin + 12, boxesY + 40);
      doc.text(`NIF : ${seller.nif || "—"}`, margin + 12, boxesY + 54);
      doc.text(`Activité : ${seller.activityCode ? `[${seller.activityCode}] ` : ""}${seller.activityLabel || "Services informatiques"}`, margin + 12, boxesY + 68, { width: boxWidth - 24 });
      doc.text(`Adresse : ${seller.address || "—"}`, margin + 12, boxesY + 92, { width: boxWidth - 24 });
      if (seller.phone) doc.text(`Tél : ${seller.phone}`, margin + 12, boxesY + 104);

      // Client Box
      const clientX = margin + boxWidth + 16;
      doc.roundedRect(clientX, boxesY, boxWidth, boxHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(mutedColor).fontSize(8).font("Helvetica-Bold").text("CLIENT (DESTINATAIRE)", clientX + 12, boxesY + 10);
      doc.fillColor(darkColor).fontSize(11).font("Helvetica-Bold").text(client.name || "Client", clientX + 12, boxesY + 24);

      doc.fontSize(8.5).font("Helvetica").fillColor(darkColor);
      doc.text(`Type : ${client.clientType === "PROFESSIONAL" ? "Entreprise / Professionnel" : "Particulier"}`, clientX + 12, boxesY + 40);
      doc.text(`Adresse : ${client.address || "—"}`, clientX + 12, boxesY + 54, { width: boxWidth - 24 });
      if (client.nif) doc.text(`NIF : ${client.nif}`, clientX + 12, boxesY + 76);
      if (client.rc) doc.text(`RC : ${client.rc}`, clientX + 12, boxesY + 90);
      if (client.email) doc.text(`Email : ${client.email}`, clientX + 12, boxesY + 104);

      // --- TABLE OF LINE ITEMS ---
      let tableY = boxesY + boxHeight + 14;
      const isDetailed = Boolean((data.invoice as any).showDetailedItems);

      const col1 = margin + 12;
      const col2 = 320;
      const col3 = 390;
      const col4 = 475;

      // Table Header
      const tableHeaderBg = template.key === "MINIMALIST" ? "#f8fafc" : palette.lightBgHex;
      doc.roundedRect(margin, tableY, contentWidth, 24, cornerRadius).fillAndStroke(tableHeaderBg, borderColor);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold");

      if (isDetailed) {
        doc.text("Désignation de la prestation", col1, tableY + 7);
        doc.text("Quantité", col2, tableY + 7, { width: 50, align: "right" });
        doc.text("Prix Unitaire", col3, tableY + 7, { width: 75, align: "right" });
        doc.text("Montant", col4, tableY + 7, { width: 70, align: "right" });
      } else {
        doc.text("Désignation de la prestation / tâche", col1, tableY + 7);
        doc.text("Montant (DZD)", margin + contentWidth - 130, tableY + 7, { width: 120, align: "right" });
      }

      tableY += 28;

      // Table Rows
      data.invoice.lineItems.forEach((item, index) => {
        const curr = data.invoice.currency || "DZD";
        const rowHeight = template.key === "COMPACT" ? 20 : 24;
        if (index % 2 === 1 && template.key !== "MINIMALIST") {
          doc.rect(margin, tableY - 4, contentWidth, rowHeight).fill("#fafafa");
        }

        doc.fillColor(darkColor).fontSize(template.key === "COMPACT" ? 8 : 8.5).font("Helvetica");

        if (isDetailed) {
          doc.text(item.description, col1, tableY, { width: 260 });
          doc.text(String(item.quantity), col2, tableY, { width: 50, align: "right" });
          doc.text(formatCurrencyAmount(item.unitPrice, curr, "fr"), col3, tableY, { width: 75, align: "right" });
          doc.font("Helvetica-Bold").text(formatCurrencyAmount(item.totalPrice, curr, "fr"), col4, tableY, { width: 70, align: "right" });
        } else {
          doc.text(item.description, col1, tableY, { width: contentWidth - 150 });
          doc.font("Helvetica-Bold").text(formatCurrencyAmount(item.totalPrice, curr, "fr"), margin + contentWidth - 130, tableY, {
            width: 120,
            align: "right",
          });
        }

        tableY += rowHeight;
      });

      doc.moveTo(margin, tableY).lineTo(margin + contentWidth, tableY).strokeColor(borderColor).stroke();
      tableY += 15;

      // --- TOTAL BOX (NO VAT, NO HT/TTC SPLIT) ---
      const curr = data.invoice.currency || "DZD";
      const isForeign = curr !== "DZD";
      const totalBoxWidth = 230;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      const totalBoxHeight = isForeign ? 62 : 42;
      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, totalBoxHeight, cornerRadius).fillAndStroke(lightBg, borderColor);

      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL NET À PAYER :", totalBoxX + 12, tableY + 14);
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(formatCurrencyAmount(data.invoice.total, curr, "fr"), totalBoxX + 110, tableY + 13, {
        width: 110,
        align: "right",
      });

      if (isForeign) {
        const rate = data.invoice.exchangeRate || getCurrencyDef(curr).defaultRate;
        const totalDzd = data.invoice.totalDzd || calculateDzdEquivalent(data.invoice.total, curr, rate);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica").text(`1 ${curr} = ${rate.toFixed(2)} DZD (Banque d'Algérie)`, totalBoxX + 12, tableY + 33);
        doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(`Contre-valeur : ${formatDZD(totalDzd)}`, totalBoxX + 12, tableY + 45);
      }

      tableY += isForeign ? 76 : 56;

      // --- BOTTOM SECTION ANCHORED TO BOTTOM OF LAST PAGE ---
      const footerLineY = 766;
      const hasSeal = seller.showStampSignature !== false;
      const bottomRowH = hasSeal ? 82 : 40;
      const notesBoxH = data.invoice.notes ? 30 : 0;

      const hasBankDetails = Boolean(
        data.seller.bankRib ||
        data.seller.bankName ||
        data.seller.ccpNumber ||
        data.invoice.dueDate ||
        data.invoice.paymentTerms ||
        data.seller.paymentTerms ||
        data.seller.paymentInstructions
      );

      const isPostalOrBaridi = Boolean(
        data.seller.bankName?.toLowerCase().includes("poste") ||
        data.seller.bankName?.toLowerCase().includes("ccp") ||
        data.seller.bankName?.toLowerCase().includes("baridi") ||
        data.seller.ccpNumber ||
        data.seller.bankRib?.replace(/\s/g, "").startsWith("007")
      );

      const hasIbanOrExtra = Boolean(
        data.seller.bankIban ||
        data.seller.bankBic ||
        data.seller.paymentInstructions ||
        curr !== "DZD"
      );

      const bankBoxH = hasBankDetails ? (hasIbanOrExtra ? 54 : 44) : 0;

      const neededBottomSpace =
        bottomRowH +
        (bankBoxH ? bankBoxH + 6 : 0) +
        (notesBoxH ? notesBoxH + 6 : 0) +
        14;

      // If content overflows into bottom area, add new page
      if (tableY + neededBottomSpace > footerLineY) {
        doc.addPage();
        drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);
        tableY = margin + 20;
      }

      // Pin bottom row right above the footer line
      const bottomY = Math.max(
        tableY + (bankBoxH ? bankBoxH + 6 : 0) + (notesBoxH ? notesBoxH + 6 : 0) + 10,
        footerLineY - 8 - bottomRowH
      );
      const bankY = bottomY - (bankBoxH ? bankBoxH + 6 : 0);
      const notesY = bankY - (notesBoxH ? notesBoxH + 6 : 0);

      // --- NOTES / REMARQUES ---
      if (data.invoice.notes) {
        doc.roundedRect(margin, notesY, contentWidth, notesBoxH, cornerRadius).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica-Bold").text("REMARQUES & CONDITIONS :", margin + 10, notesY + 5);
        doc.fillColor(darkColor).fontSize(7.5).font("Helvetica").text(data.invoice.notes, margin + 10, notesY + 15, { width: contentWidth - 20, lineGap: 1 });
      }

      // --- PAYMENT DETAILS & BARIDIMOB BLOCK ---
      if (hasBankDetails) {
        doc.roundedRect(margin, bankY, contentWidth, bankBoxH, cornerRadius).fillAndStroke("#ffffff", borderColor);

        // Accent vertical bar (golden yellow for Algérie Poste/BaridiMob, brand palette for others)
        const accentBarColor = isPostalOrBaridi ? "#eab308" : primaryColor;
        doc.rect(margin, bankY, 3.5, bankBoxH).fill(accentBarColor);

        // Header line
        doc.fillColor(darkColor).fontSize(7.5).font("Helvetica-Bold");
        doc.text(
          isPostalOrBaridi
            ? "MODALITÉS DE RÈGLEMENT & COORDONNÉES BARIDIMOB / CCP :"
            : "MODALITÉS DE RÈGLEMENT & COORDONNÉES BANCAIRES :",
          margin + 10,
          bankY + 6
        );

        if (isPostalOrBaridi) {
          doc.fillColor("#b45309").fontSize(6.5).font("Helvetica-Bold").text(
            "Compatible BaridiMob (Algérie Poste)",
            margin + contentWidth - 170,
            bankY + 6,
            { width: 160, align: "right" }
          );
        }

        // Row 1: Bank & Beneficiary
        const bankNameDisplay = data.seller.bankName || (isPostalOrBaridi ? "Algérie Poste (CCP)" : "Banque");
        const agencyText = data.seller.bankAgency ? ` (${data.seller.bankAgency})` : "";
        const beneficiaryDisplay = data.seller.accountHolder || data.seller.fullName;

        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Établissement : ", margin + 10, bankY + 18, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(`${bankNameDisplay}${agencyText}`);

        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Bénéficiaire : ", margin + 250, bankY + 18, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(beneficiaryDisplay);

        // Row 2: RIP & Payment Terms / Due Date
        const ripFormatted = formatRip(data.seller.bankRib) || "—";
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("RIP (20 chiffres) : ", margin + 10, bankY + 29, { continued: true });
        doc.font("Courier-Bold").fontSize(7.5).fillColor(darkColor).text(ripFormatted);

        const termsKey = data.invoice.paymentTerms || data.seller.paymentTerms || "UPON_RECEIPT";
        const termsDef = PAYMENT_TERMS_CONFIG[termsKey] || PAYMENT_TERMS_CONFIG.UPON_RECEIPT;
        let termsDisplay = termsDef.shortFr;
        if (data.invoice.dueDate) {
          const d = new Date(data.invoice.dueDate).toLocaleDateString("fr-DZ", { day: "2-digit", month: "2-digit", year: "numeric" });
          termsDisplay += ` • Échéance : ${d}`;
        }

        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Conditions : ", margin + 250, bankY + 29, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(termsDisplay);

        // Row 3: IBAN / BIC or Custom Instructions if present
        if (hasIbanOrExtra) {
          let extraLineY = bankY + 40;
          let intlText = "";
          if (data.seller.bankIban || data.seller.bankBic || curr !== "DZD") {
            const ibanStr = data.seller.bankIban ? `IBAN : ${formatIban(data.seller.bankIban)}` : "";
            const bicStr = data.seller.bankBic ? `BIC/SWIFT : ${data.seller.bankBic}` : "";
            intlText = [ibanStr, bicStr].filter(Boolean).join("   |   ");
            if (intlText) {
              doc.fillColor(mutedColor).fontSize(6.5).font("Helvetica").text(intlText, margin + 10, extraLineY);
              extraLineY += 7.5;
            }
          }
          if (data.seller.paymentInstructions) {
            doc.fillColor(mutedColor).fontSize(6.5).font("Helvetica-Oblique").text(
              `Consigne : ${data.seller.paymentInstructions}`,
              margin + 10,
              extraLineY,
              { width: contentWidth - 20 }
            );
          }
        }
      }

      // --- MANDATORY VAT EXEMPTION NOTE & DEDICATED CACHET CARD ---
      const stampBoxW = hasSeal ? 195 : 0;
      const legalBoxW = hasSeal ? contentWidth - stampBoxW - 10 : contentWidth;

      // 1. Legal VAT Exemption Card (Left)
      doc.roundedRect(margin, bottomY, legalBoxW, bottomRowH, cornerRadius).fillAndStroke(palette.lightBgHex, palette.borderHex);
      doc.rect(margin, bottomY, 4, bottomRowH).fill(primaryColor);

      doc.fillColor(palette.darkHex).fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE OBLIGATOIRE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, bottomY + 7);
      doc.fillColor(palette.darkHex).fontSize(7.2).font("Helvetica-Oblique").text(data.invoice.vatExemptionNote, margin + 12, bottomY + 20, {
        width: legalBoxW - 24,
        lineGap: 2,
      });

      if (hasSeal) {
        doc.fillColor(mutedColor).fontSize(6.5).font("Helvetica").text(
          "Régime fiscal : Impôt Forfaitaire Unique (IFU). Facture établie sans TVA (art. 13 Décret exécutif n° 23-197).",
          margin + 12,
          bottomY + 54,
          { width: legalBoxW - 24 }
        );
      }

      // 2. Dedicated Cadre Réservé au Cachet & Signature (Right)
      if (hasSeal) {
        const stampBoxX = margin + legalBoxW + 10;
        doc.roundedRect(stampBoxX, bottomY, stampBoxW, bottomRowH, cornerRadius).fillAndStroke("#ffffff", borderColor);
        doc.fillColor(mutedColor).fontSize(6.2).font("Helvetica-Bold").text(
          "CADRE RÉSERVÉ AU CACHET & SIGNATURE :",
          stampBoxX + 6,
          bottomY + 6,
          { width: stampBoxW - 12, align: "center" }
        );

        drawOfficialSealPdf(doc, {
          x: stampBoxX + (stampBoxW - 176) / 2,
          y: bottomY + 16,
          width: 176,
          height: 60,
          centerX: stampBoxX + stampBoxW / 2,
          centerY: bottomY + 16 + 30,
          radius: 29,
          seller: seller,
          sealColor: primaryColor,
        });
      }

      // --- FOOTER ---
      doc.moveTo(margin, footerLineY).lineTo(margin + contentWidth, footerLineY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Facture émise conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur.`,
        margin,
        footerLineY + 6,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerLineY + 16,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export interface QuotePdfData {
  quote: {
    quoteNumber: string | null;
    issueDate: Date | string;
    validUntil?: Date | string | null;
    paymentTerms?: string | null;
    total: number;
    currency: string;
    exchangeRate?: number | null;
    totalDzd?: number | null;
    vatExemptionNote: string;
    notes?: string | null;
    sellerSnapshot?: string | null;
    clientSnapshot?: string | null;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    email: string;
    phone: string;
    activityCode: string;
    activityLabel: string;
    logoUrl?: string | null;
    logoPosition?: string | null;
    brandColor?: string | null;
    templateStyle?: string | null;
    bankName?: string | null;
    bankRib?: string | null;
    bankIban?: string | null;
    bankBic?: string | null;
    accountHolder?: string | null;
    bankAgency?: string | null;
    ccpNumber?: string | null;
    ccpKey?: string | null;
    paymentTerms?: string | null;
    paymentInstructions?: string | null;
    showStampSignature?: boolean | null;
    stampType?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
  };
  client: {
    name: string;
    clientType: string;
    address: string;
    nif?: string | null;
    nis?: string | null;
    rc?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export function generateQuotePdfBuffer(data: QuotePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 25, left: 40, right: 40 },
        info: {
          Title: `Devis ${data.quote.quoteNumber || "Brouillon"}`,
          Author: data.seller.fullName,
          Subject: "Devis Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const rawSeller = data.quote.sellerSnapshot
        ? JSON.parse(data.quote.sellerSnapshot)
        : {};

      const seller = {
        ...rawSeller,
        ...data.seller,
        brandColor: data.seller?.brandColor || rawSeller.brandColor,
        templateStyle: data.seller?.templateStyle || rawSeller.templateStyle,
        logoUrl: data.seller?.logoUrl !== undefined ? data.seller.logoUrl : rawSeller.logoUrl,
        logoPosition: data.seller?.logoPosition || rawSeller.logoPosition,
        showStampSignature: data.seller?.showStampSignature !== undefined ? data.seller.showStampSignature : (rawSeller.showStampSignature ?? true),
        stampType: data.seller?.stampType || rawSeller.stampType,
        stampUrl: data.seller?.stampUrl !== undefined ? data.seller.stampUrl : rawSeller.stampUrl,
        signatureUrl: data.seller?.signatureUrl !== undefined ? data.seller.signatureUrl : rawSeller.signatureUrl,
      };

      const client = data.quote.clientSnapshot
        ? JSON.parse(data.quote.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Brand Styling Engine (Phase 4 Module 1)
      const palette = getBrandPalette(seller.brandColor);
      const template = getTemplateStyle(seller.templateStyle);
      const accentColor = palette.hex;
      const darkColor = palette.darkHex;
      const mutedColor = "#64748b";
      const lightBg = template.key === "MINIMALIST" ? "#ffffff" : palette.lightBgHex;
      const borderColor = palette.borderHex;
      const cornerRadius = template.key === "CLASSIC" ? 2 : template.key === "MINIMALIST" ? 3 : 6;

      const logoBuf = getLogoBuffer(seller.logoUrl);
      const logoPos = ((seller.logoPosition || "LEFT").toUpperCase()) as "LEFT" | "CENTER" | "RIGHT";

      // Top colored bar
      drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);

      const headerTopY = margin + 12;
      const dateStr = new Date(data.quote.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const validStr = data.quote.validUntil
        ? new Date(data.quote.validUntil).toLocaleDateString("fr-DZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null;

      let cardY = margin + 65;

      if (logoBuf && logoPos === "CENTER") {
        // --- 1. CENTERED LOGO & HEADER ---
        const centerW = 110;
        const centerH = 36;
        const centerLogoX = (pageWidth - centerW) / 2;
        tryDrawImage(doc, logoBuf, centerLogoX, headerTopY, {
          fit: [centerW, centerH],
          align: "center",
          valign: "center",
        });

        const titleY = headerTopY + centerH + 6;
        doc.fontSize(20).font("Helvetica-Bold").fillColor(darkColor).text("DEVIS", margin, titleY, {
          align: "center",
          width: contentWidth,
        });
        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / PROFORMA)", margin, titleY + 22, {
            align: "center",
            width: contentWidth,
          });
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(mutedColor)
          .text(
            `N° de Devis : ${data.quote.quoteNumber || "PROJET BROUILLON"}    •    Date : ${dateStr}${validStr ? `    •    Validité : ${validStr}` : ""}`,
            margin,
            titleY + 34,
            { align: "center", width: contentWidth }
          );

        doc.moveTo(margin, titleY + 48).lineTo(margin + contentWidth, titleY + 48).strokeColor(borderColor).stroke();
        cardY = titleY + 56;
      } else if (logoBuf && logoPos === "RIGHT") {
        // --- 2. LOGO ON RIGHT, TITLE ON LEFT ---
        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("DEVIS", margin, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / PROFORMA)", margin, headerTopY + 24, {
            width: 230,
          });

        const rightW = 80;
        const rightH = 38;
        const rightLogoX = margin + contentWidth - rightW;
        tryDrawImage(doc, logoBuf, rightLogoX, headerTopY, {
          fit: [rightW, rightH],
          align: "right",
          valign: "center",
        });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° de Devis :", 240, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.quote.quoteNumber || "PROJET BROUILLON", 340, headerTopY, { width: 90 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 240, headerTopY + 14, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 340, headerTopY + 14, { width: 90 });

        if (validStr) {
          doc.font("Helvetica").fillColor(mutedColor);
          doc.text("Valable jusqu'au :", 230, headerTopY + 28, { width: 105, align: "right" });
          doc.font("Helvetica-Bold").fillColor(accentColor).text(validStr, 340, headerTopY + 28, { width: 90 });
        }

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        cardY = headerTopY + 54;
      } else {
        // --- 3. LOGO ON LEFT (OR NO LOGO) ---
        let leftTitleX = margin;
        if (logoBuf && logoPos === "LEFT") {
          const leftW = 80;
          const leftH = 38;
          const drawn = tryDrawImage(doc, logoBuf, margin, headerTopY, {
            fit: [leftW, leftH],
            valign: "center",
          });
          if (drawn) {
            leftTitleX = margin + leftW + 12;
          }
        }

        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("DEVIS", leftTitleX, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / PROFORMA)", leftTitleX, headerTopY + 24, {
            width: 220,
          });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° de Devis :", 340, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.quote.quoteNumber || "PROJET BROUILLON", 440, headerTopY, { width: 115 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 340, headerTopY + 14, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 440, headerTopY + 14, { width: 115 });

        if (validStr) {
          doc.font("Helvetica").fillColor(mutedColor);
          doc.text("Valable jusqu'au :", 330, headerTopY + 28, { width: 105, align: "right" });
          doc.font("Helvetica-Bold").fillColor(accentColor).text(validStr, 440, headerTopY + 28, { width: 115 });
        }

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        cardY = headerTopY + 54;
      }
      const cardWidth = (contentWidth - 16) / 2;
      const cardHeight = template.key === "COMPACT" ? 100 : 110;

      // Prestataire
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text("PRESTATAIRE (AUTO-ENTREPRENEUR)", margin + 10, cardY + 8);
      doc.fontSize(9).font("Helvetica-Bold").text(seller.fullName || "—", margin + 10, cardY + 22);

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      let sY = cardY + 34;
      doc.text(`RNAE N° : ${seller.rnaeNumber || "—"}  •  NIF : ${seller.nif || "—"}`, margin + 10, sY);
      sY += 11;
      doc.text(`Activité : ${seller.activityLabel || "—"} (${seller.activityCode || "—"})`, margin + 10, sY, { width: cardWidth - 20 });
      sY += 13;
      if (seller.address) {
        doc.text(`Adresse : ${seller.address}`, margin + 10, sY, { width: cardWidth - 20 });
        sY += 11;
      }
      doc.text(`Email : ${seller.email || "—"}  •  Tél : ${seller.phone || "—"}`, margin + 10, sY);

      // Client
      const clientX = margin + cardWidth + 16;
      doc.roundedRect(clientX, cardY, cardWidth, cardHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text("CLIENT DESTINATAIRE", clientX + 10, cardY + 8);
      doc.fontSize(9).font("Helvetica-Bold").text(client.name, clientX + 10, cardY + 22);

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      let cY = cardY + 34;
      doc.text(`Type : ${client.clientType === "PROFESSIONAL" ? "Société / Professionnel" : "Particulier"}`, clientX + 10, cY);
      cY += 11;
      if (client.nif) {
        doc.text(`NIF : ${client.nif}${client.nis ? `  •  NIS : ${client.nis}` : ""}${client.rc ? `  •  RC : ${client.rc}` : ""}`, clientX + 10, cY);
        cY += 11;
      }
      if (client.address) {
        doc.text(`Adresse : ${client.address}`, clientX + 10, cY, { width: cardWidth - 20 });
        cY += 11;
      }
      if (client.email || client.phone) {
        doc.text(`${client.email ? `Email : ${client.email}` : ""} ${client.phone ? ` • Tél : ${client.phone}` : ""}`, clientX + 10, cY);
      }

      // --- LINE ITEMS TABLE ---
      let tableY = cardY + cardHeight + 20;

      // Table Header
      const quoteCurr = data.quote.currency || "DZD";
      const isQuoteForeign = quoteCurr !== "DZD";

      const tableHeaderBg = template.key === "MINIMALIST" ? "#f8fafc" : darkColor;
      const tableHeaderTextColor = template.key === "MINIMALIST" ? darkColor : "#ffffff";
      doc.roundedRect(margin, tableY, contentWidth, 22, cornerRadius).fillAndStroke(tableHeaderBg, borderColor);
      doc.fillColor(tableHeaderTextColor).fontSize(8).font("Helvetica-Bold");
      doc.text("DESCRIPTION DES PRESTATIONS", margin + 10, tableY + 7);
      doc.text("QTÉ", margin + 300, tableY + 7, { width: 40, align: "center" });
      doc.text(`P.U (${quoteCurr})`, margin + 345, tableY + 7, { width: 75, align: "right" });
      doc.text(`TOTAL (${quoteCurr})`, margin + 425, tableY + 7, { width: 80, align: "right" });

      tableY += 22;

      // Rows
      doc.font("Helvetica").fontSize(template.key === "COMPACT" ? 7.5 : 8);
      data.quote.lineItems.forEach((item, idx) => {
        const rowHeight = template.key === "COMPACT" ? 20 : 24;
        const rowBg = idx % 2 === 0 || template.key === "MINIMALIST" ? "#ffffff" : "#f8fafc";
        doc.rect(margin, tableY, contentWidth, rowHeight).fill(rowBg);
        doc.rect(margin, tableY + rowHeight - 1, contentWidth, 1).fill("#f1f5f9");

        doc.fillColor(darkColor).text(item.description, margin + 10, tableY + 6, { width: 285 });
        doc.fillColor(mutedColor).text(String(item.quantity), margin + 300, tableY + 6, { width: 40, align: "center" });
        doc.text(formatCurrencyAmount(item.unitPrice, quoteCurr, "fr"), margin + 345, tableY + 6, { width: 75, align: "right" });
        doc.fillColor(darkColor).font("Helvetica-Bold").text(formatCurrencyAmount(item.totalPrice, quoteCurr, "fr"), margin + 425, tableY + 6, { width: 80, align: "right" });

        doc.font("Helvetica");
        tableY += rowHeight;
      });

      // --- TOTAL BOX ---
      const totalBoxWidth = 240;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      const totalBoxHeight = isQuoteForeign ? 62 : 42;
      tableY += 12;

      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, totalBoxHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.rect(totalBoxX, tableY, 4, totalBoxHeight).fill(accentColor);
      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL ESTIMÉ (NET) :", totalBoxX + 12, tableY + 14);
      doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(formatCurrencyAmount(data.quote.total, quoteCurr, "fr"), totalBoxX + 110, tableY + 13, {
        width: 115,
        align: "right",
      });

      if (isQuoteForeign) {
        const rate = data.quote.exchangeRate || getCurrencyDef(quoteCurr).defaultRate;
        const totalDzd = data.quote.totalDzd || calculateDzdEquivalent(data.quote.total, quoteCurr, rate);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica").text(`1 ${quoteCurr} = ${rate.toFixed(2)} DZD (Banque d'Algérie)`, totalBoxX + 12, tableY + 33);
        doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(`Contre-valeur : ${formatDZD(totalDzd)}`, totalBoxX + 12, tableY + 45);
      }

      tableY += isQuoteForeign ? 74 : 54;

      // --- BOTTOM SECTION ANCHORED TO BOTTOM OF LAST PAGE ---
      const footerLineY = 766;
      const legalBoxH = 38;

      const hasBankDetails = Boolean(
        data.seller.bankRib ||
        data.seller.bankName ||
        data.seller.ccpNumber ||
        data.quote.paymentTerms ||
        data.seller.paymentTerms ||
        data.seller.paymentInstructions
      );

      const isPostalOrBaridi = Boolean(
        data.seller.bankName?.toLowerCase().includes("poste") ||
        data.seller.bankName?.toLowerCase().includes("ccp") ||
        data.seller.bankName?.toLowerCase().includes("baridi") ||
        data.seller.ccpNumber ||
        data.seller.bankRib?.replace(/\s/g, "").startsWith("007")
      );

      const bankBoxH = hasBankDetails ? 44 : 0;
      const notesBoxH = data.quote.notes ? 26 : 0;
      const approvalBoxH = 76;
      const neededBottomSpace =
        legalBoxH +
        approvalBoxH +
        (bankBoxH ? bankBoxH + 6 : 0) +
        (notesBoxH ? notesBoxH + 6 : 0) +
        16;

      // If content overflows into bottom area, add new page
      if (tableY + neededBottomSpace > footerLineY) {
        doc.addPage();
        drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);
        tableY = margin + 20;
      }

      // Pin legal note right above the footer line
      const legalY = Math.max(
        tableY + approvalBoxH + (bankBoxH ? bankBoxH + 6 : 0) + (notesBoxH ? notesBoxH + 6 : 0) + 12,
        footerLineY - 8 - legalBoxH
      );
      const approvalY = legalY - approvalBoxH - 8;
      const bankY = approvalY - (bankBoxH ? bankBoxH + 6 : 0);
      const notesY = bankY - (notesBoxH ? notesBoxH + 6 : 0);

      // --- NOTES BOX (IF PRESENT) ---
      if (data.quote.notes) {
        doc.roundedRect(margin, notesY, contentWidth, notesBoxH, cornerRadius).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica-Bold").text("CONDITIONS DU DEVIS :", margin + 10, notesY + 5);
        doc.fillColor(darkColor).fontSize(7).font("Helvetica").text(data.quote.notes, margin + 10, notesY + 14, { width: contentWidth - 20, lineGap: 1 });
      }

      // --- PAYMENT DETAILS & BARIDIMOB BLOCK (QUOTES) ---
      if (hasBankDetails) {
        doc.roundedRect(margin, bankY, contentWidth, bankBoxH, cornerRadius).fillAndStroke("#ffffff", borderColor);
        const accentBarColor = isPostalOrBaridi ? "#eab308" : accentColor;
        doc.rect(margin, bankY, 3.5, bankBoxH).fill(accentBarColor);

        doc.fillColor(darkColor).fontSize(7.5).font("Helvetica-Bold");
        doc.text(
          isPostalOrBaridi
            ? "MODALITÉS DE RÈGLEMENT PRÉVUES & BARIDIMOB / CCP :"
            : "MODALITÉS DE RÈGLEMENT PRÉVUES & COORDONNÉES BANCAIRES :",
          margin + 10,
          bankY + 6
        );

        if (isPostalOrBaridi) {
          doc.fillColor("#b45309").fontSize(6.5).font("Helvetica-Bold").text(
            "Compatible BaridiMob (Algérie Poste)",
            margin + contentWidth - 170,
            bankY + 6,
            { width: 160, align: "right" }
          );
        }

        const bankNameDisplay = data.seller.bankName || (isPostalOrBaridi ? "Algérie Poste (CCP)" : "Banque");
        const beneficiaryDisplay = data.seller.accountHolder || data.seller.fullName;

        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Établissement : ", margin + 10, bankY + 18, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(bankNameDisplay);

        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Bénéficiaire : ", margin + 250, bankY + 18, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(beneficiaryDisplay);

        const ripFormatted = formatRip(data.seller.bankRib) || "—";
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("RIP (20 chiffres) : ", margin + 10, bankY + 29, { continued: true });
        doc.font("Courier-Bold").fontSize(7.5).fillColor(darkColor).text(ripFormatted);

        const termsKey = data.quote.paymentTerms || data.seller.paymentTerms || "UPON_RECEIPT";
        const termsDef = PAYMENT_TERMS_CONFIG[termsKey] || PAYMENT_TERMS_CONFIG.UPON_RECEIPT;
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text("Conditions : ", margin + 250, bankY + 29, { continued: true });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(termsDef.shortFr);
      }

      // --- OFFICIAL "BON POUR ACCORD" & PRESTATAIRE SEAL (MODULE 3) ---
      const dualBoxW = (contentWidth - 12) / 2;
      const clientBoxX = margin;
      const providerBoxX = margin + dualBoxW + 12;

      // 1. Client Acceptance Box (Bon pour Accord)
      doc.roundedRect(clientBoxX, approvalY, dualBoxW, approvalBoxH, cornerRadius).fillAndStroke("#ffffff", borderColor);
      doc.fillColor(darkColor).fontSize(7).font("Helvetica-Bold").text("BON POUR ACCORD ET COMMANDE (CLIENT)", clientBoxX + 8, approvalY + 5);
      doc.fillColor(mutedColor).fontSize(5.5).font("Helvetica-Oblique").text("Mention manuscrite : « Lu et approuvé, bon pour commande »", clientBoxX + 8, approvalY + 14, { width: dualBoxW - 16 });
      doc.fillColor(mutedColor).fontSize(5).font("Helvetica").text("Cadre réservé au cachet & signature du client", clientBoxX + 8, approvalY + 24, { width: dualBoxW - 16, align: "center" });
      doc.fontSize(5.5).font("Helvetica").text("Date : ..... / ..... / 20.....     Qualité : ....................", clientBoxX + 8, approvalY + approvalBoxH - 9);

      // 2. Provider Box (Auto-Entrepreneur) with Seal
      doc.roundedRect(providerBoxX, approvalY, dualBoxW, approvalBoxH, cornerRadius).fillAndStroke(palette.lightBgHex, palette.borderHex);
      doc.fillColor(palette.darkHex).fontSize(7).font("Helvetica-Bold").text("POUR L'AUTO-ENTREPRENEUR (CACHET & SIGNATURE)", providerBoxX + 8, approvalY + 5);

      if (seller.showStampSignature !== false) {
        drawOfficialSealPdf(doc, {
          x: providerBoxX + (dualBoxW - 176) / 2,
          y: approvalY + 13,
          width: 176,
          height: 56,
          centerX: providerBoxX + dualBoxW / 2,
          centerY: approvalY + 13 + 28,
          radius: 26,
          seller: seller,
          sealColor: accentColor,
        });
      } else {
        doc.fillColor(mutedColor).fontSize(7).font("Helvetica").text(data.seller.fullName, providerBoxX + 8, approvalY + 20);
        doc.fontSize(6).text(`RNAE : ${data.seller.rnaeNumber || "—"}  •  NIF : ${data.seller.nif || "—"}`, providerBoxX + 8, approvalY + 32);
      }

      // --- MANDATORY LEGAL NOTE ---
      doc.roundedRect(margin, legalY, contentWidth, legalBoxH, cornerRadius).fillAndStroke(palette.lightBgHex, palette.borderHex);
      doc.rect(margin, legalY, 4, legalBoxH).fill(accentColor);
      doc.fillColor(palette.darkHex).fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, legalY + 6);
      doc.fillColor(palette.darkHex).fontSize(7.5).font("Helvetica-Oblique").text(data.quote.vatExemptionNote, margin + 12, legalY + 18, {
        width: contentWidth - 24,
        lineGap: 1,
      });

      // --- FOOTER ---
      doc.moveTo(margin, footerLineY).lineTo(margin + contentWidth, footerLineY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Devis établi conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur.`,
        margin,
        footerLineY + 6,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerLineY + 16,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export interface CreditNotePdfData {
  creditNote: {
    creditNoteNumber: string | null;
    issueDate: Date | string;
    reason: string;
    total: number;
    currency: string;
    exchangeRate?: number | null;
    totalDzd?: number | null;
    vatExemptionNote: string;
    notes?: string | null;
    sellerSnapshot?: string | null;
    clientSnapshot?: string | null;
    originalInvoiceNumber?: string | null;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    email: string;
    phone: string;
    activityCode: string;
    activityLabel: string;
    logoUrl?: string | null;
    logoPosition?: string | null;
    brandColor?: string | null;
    templateStyle?: string | null;
    showStampSignature?: boolean | null;
    stampType?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
  };
  client: {
    name: string;
    clientType: string;
    address: string;
    nif?: string | null;
    nis?: string | null;
    rc?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export function generateCreditNotePdfBuffer(data: CreditNotePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 25, left: 40, right: 40 },
        info: {
          Title: `Avoir ${data.creditNote.creditNoteNumber || "Brouillon"}`,
          Author: data.seller.fullName,
          Subject: "Facture d'Avoir Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const rawSeller = data.creditNote.sellerSnapshot
        ? JSON.parse(data.creditNote.sellerSnapshot)
        : {};

      const seller = {
        ...rawSeller,
        ...data.seller,
        brandColor: data.seller?.brandColor || rawSeller.brandColor,
        templateStyle: data.seller?.templateStyle || rawSeller.templateStyle,
        logoUrl: data.seller?.logoUrl !== undefined ? data.seller.logoUrl : rawSeller.logoUrl,
        logoPosition: data.seller?.logoPosition || rawSeller.logoPosition,
        showStampSignature: data.seller?.showStampSignature !== undefined ? data.seller.showStampSignature : (rawSeller.showStampSignature ?? true),
        stampType: data.seller?.stampType || rawSeller.stampType,
        stampUrl: data.seller?.stampUrl !== undefined ? data.seller.stampUrl : rawSeller.stampUrl,
        signatureUrl: data.seller?.signatureUrl !== undefined ? data.seller.signatureUrl : rawSeller.signatureUrl,
      };

      const client = data.creditNote.clientSnapshot
        ? JSON.parse(data.creditNote.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Brand Styling Engine (Phase 4 Module 1)
      const palette = getBrandPalette(seller.brandColor);
      const template = getTemplateStyle(seller.templateStyle);
      const accentColor = "#e11d48"; // Rose 600 for credit note identity
      const darkColor = "#0f172a";   // Slate 900
      const mutedColor = "#64748b";  // Slate 500
      const lightBg = template.key === "MINIMALIST" ? "#ffffff" : "#f8fafc";
      const borderColor = "#e2e8f0"; // Slate 200
      const cornerRadius = template.key === "CLASSIC" ? 2 : template.key === "MINIMALIST" ? 3 : 6;

      const logoBuf = getLogoBuffer(seller.logoUrl);
      const logoPos = ((seller.logoPosition || "LEFT").toUpperCase()) as "LEFT" | "CENTER" | "RIGHT";

      // Top colored bar
      drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);

      const headerTopY = margin + 12;
      const dateStr = new Date(data.creditNote.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let refY = margin + 50;

      if (logoBuf && logoPos === "CENTER") {
        // --- 1. CENTERED LOGO & HEADER ---
        const centerW = 110;
        const centerH = 36;
        const centerLogoX = (pageWidth - centerW) / 2;
        tryDrawImage(doc, logoBuf, centerLogoX, headerTopY, {
          fit: [centerW, centerH],
          align: "center",
          valign: "center",
        });

        const titleY = headerTopY + centerH + 6;
        doc.fontSize(20).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE D'AVOIR", margin, titleY, {
          align: "center",
          width: contentWidth,
        });
        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("NOTE DE CRÉDIT COMPTABLE — ALGÉRIE (LOI 22-23 / IFU)", margin, titleY + 22, {
            align: "center",
            width: contentWidth,
          });
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor(mutedColor)
          .text(
            `N° d'Avoir : ${data.creditNote.creditNoteNumber || "BROUILLON"}    •    Date d'émission : ${dateStr}`,
            margin,
            titleY + 34,
            { align: "center", width: contentWidth }
          );

        doc.moveTo(margin, titleY + 48).lineTo(margin + contentWidth, titleY + 48).strokeColor(borderColor).stroke();
        refY = titleY + 54;
      } else if (logoBuf && logoPos === "RIGHT") {
        // --- 2. LOGO ON RIGHT, TITLE ON LEFT ---
        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE D'AVOIR", margin, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("NOTE DE CRÉDIT COMPTABLE — ALGÉRIE (LOI 22-23 / IFU)", margin, headerTopY + 24, {
            width: 230,
          });

        const rightW = 80;
        const rightH = 38;
        const rightLogoX = margin + contentWidth - rightW;
        tryDrawImage(doc, logoBuf, rightLogoX, headerTopY, {
          fit: [rightW, rightH],
          align: "right",
          valign: "center",
        });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° d'Avoir :", 240, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.creditNote.creditNoteNumber || "BROUILLON", 340, headerTopY, { width: 90 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 240, headerTopY + 14, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 340, headerTopY + 14, { width: 90 });

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        refY = headerTopY + 52;
      } else {
        // --- 3. LOGO ON LEFT (OR NO LOGO) ---
        let leftTitleX = margin;
        if (logoBuf && logoPos === "LEFT") {
          const leftW = 80;
          const leftH = 38;
          const drawn = tryDrawImage(doc, logoBuf, margin, headerTopY, {
            fit: [leftW, leftH],
            valign: "center",
          });
          if (drawn) {
            leftTitleX = margin + leftW + 12;
          }
        }

        doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE D'AVOIR", leftTitleX, headerTopY);
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(accentColor)
          .text("NOTE DE CRÉDIT COMPTABLE — ALGÉRIE (LOI 22-23 / IFU)", leftTitleX, headerTopY + 24, {
            width: 220,
          });

        doc.fontSize(8.5).font("Helvetica").fillColor(mutedColor);
        doc.text("N° d'Avoir :", 340, headerTopY, { width: 95, align: "right" });
        doc
          .font("Helvetica-Bold")
          .fillColor(darkColor)
          .text(data.creditNote.creditNoteNumber || "BROUILLON", 440, headerTopY, { width: 115 });

        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Date d'émission :", 340, headerTopY + 14, { width: 95, align: "right" });
        doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 440, headerTopY + 14, { width: 115 });

        doc.moveTo(margin, headerTopY + 46).lineTo(margin + contentWidth, headerTopY + 46).strokeColor(borderColor).stroke();
        refY = headerTopY + 52;
      }

      // Referenced invoice badge
      doc.roundedRect(margin, refY, contentWidth, 24, cornerRadius).fillAndStroke("#fff1f2", "#fecdd3");
      doc.rect(margin, refY, 4, 24).fill(accentColor);
      doc.fillColor("#9f1239").fontSize(8).font("Helvetica-Bold").text("RÉFÉRENCE FACTURE D'ORIGINE :", margin + 12, refY + 7);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(data.creditNote.originalInvoiceNumber || "—", margin + 165, refY + 6.5);
      doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica").text(`Motif : ${data.creditNote.reason}`, margin + 270, refY + 7.5, { width: contentWidth - 280 });

      // --- SENDER & CLIENT CARDS ---
      const cardY = refY + 34;
      const cardWidth = (contentWidth - 16) / 2;
      const cardHeight = template.key === "COMPACT" ? 95 : 105;

      // Prestataire
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text("ÉMETTEUR (AUTO-ENTREPRENEUR)", margin + 10, cardY + 8);
      doc.fontSize(9).font("Helvetica-Bold").text(seller.fullName || "—", margin + 10, cardY + 22);

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      let sY = cardY + 34;
      doc.text(`RNAE N° : ${seller.rnaeNumber || "—"}  •  NIF : ${seller.nif || "—"}`, margin + 10, sY);
      sY += 11;
      doc.text(`Activité : ${seller.activityLabel || "—"} (${seller.activityCode || "—"})`, margin + 10, sY, { width: cardWidth - 20 });
      sY += 13;
      if (seller.address) {
        doc.text(`Adresse : ${seller.address}`, margin + 10, sY, { width: cardWidth - 20 });
        sY += 11;
      }
      doc.text(`Email : ${seller.email || "—"}  •  Tél : ${seller.phone || "—"}`, margin + 10, sY);

      // Client
      const clientX = margin + cardWidth + 16;
      doc.roundedRect(clientX, cardY, cardWidth, cardHeight, cornerRadius).fillAndStroke(lightBg, borderColor);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text("BÉNÉFICIAIRE (CLIENT)", clientX + 10, cardY + 8);
      doc.fontSize(9).font("Helvetica-Bold").text(client.name, clientX + 10, cardY + 22);

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      let cY = cardY + 34;
      doc.text(`Type : ${client.clientType === "PROFESSIONAL" ? "Société / Professionnel" : "Particulier"}`, clientX + 10, cY);
      cY += 11;
      if (client.nif) {
        doc.text(`NIF : ${client.nif}${client.nis ? `  •  NIS : ${client.nis}` : ""}${client.rc ? `  •  RC : ${client.rc}` : ""}`, clientX + 10, cY);
        cY += 11;
      }
      if (client.address) {
        doc.text(`Adresse : ${client.address}`, clientX + 10, cY, { width: cardWidth - 20 });
        cY += 11;
      }
      if (client.email || client.phone) {
        doc.text(`${client.email ? `Email : ${client.email}` : ""} ${client.phone ? ` • Tél : ${client.phone}` : ""}`, clientX + 10, cY);
      }

      // --- LINE ITEMS TABLE ---
      let tableY = cardY + cardHeight + 20;

      // Table Header
      const creditCurr = data.creditNote.currency || "DZD";
      const isCreditForeign = creditCurr !== "DZD";

      const tableHeaderBg = template.key === "MINIMALIST" ? "#f8fafc" : darkColor;
      const tableHeaderTextColor = template.key === "MINIMALIST" ? darkColor : "#ffffff";
      doc.roundedRect(margin, tableY, contentWidth, 22, cornerRadius).fillAndStroke(tableHeaderBg, borderColor);
      doc.fillColor(tableHeaderTextColor).fontSize(8).font("Helvetica-Bold");
      doc.text("LIGNES CRÉDITÉES / ANNULÉES", margin + 10, tableY + 7);
      doc.text("QTÉ", margin + 300, tableY + 7, { width: 40, align: "center" });
      doc.text(`P.U (${creditCurr})`, margin + 345, tableY + 7, { width: 75, align: "right" });
      doc.text(`CRÉDIT (${creditCurr})`, margin + 425, tableY + 7, { width: 80, align: "right" });

      tableY += 22;

      // Rows
      doc.font("Helvetica").fontSize(template.key === "COMPACT" ? 7.5 : 8);
      data.creditNote.lineItems.forEach((item, idx) => {
        const rowHeight = template.key === "COMPACT" ? 20 : 24;
        const rowBg = idx % 2 === 0 || template.key === "MINIMALIST" ? "#ffffff" : "#fff1f2";
        doc.rect(margin, tableY, contentWidth, rowHeight).fill(rowBg);
        doc.rect(margin, tableY + rowHeight - 1, contentWidth, 1).fill("#f1f5f9");

        doc.fillColor(darkColor).text(item.description, margin + 10, tableY + 6, { width: 285 });
        doc.fillColor(mutedColor).text(String(item.quantity), margin + 300, tableY + 6, { width: 40, align: "center" });
        doc.text(formatCurrencyAmount(item.unitPrice, creditCurr, "fr"), margin + 345, tableY + 6, { width: 75, align: "right" });
        doc.fillColor(accentColor).font("Helvetica-Bold").text(`- ${formatCurrencyAmount(item.totalPrice, creditCurr, "fr")}`, margin + 425, tableY + 6, { width: 80, align: "right" });

        doc.font("Helvetica");
        tableY += rowHeight;
      });

      // --- TOTAL BOX ---
      const totalBoxWidth = 240;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      const totalBoxHeight = isCreditForeign ? 62 : 42;
      tableY += 12;

      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, totalBoxHeight, cornerRadius).fillAndStroke("#fff1f2", "#fecdd3");
      doc.rect(totalBoxX, tableY, 4, totalBoxHeight).fill(accentColor);
      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL CRÉDIT NET :", totalBoxX + 12, tableY + 14);
      doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(`- ${formatCurrencyAmount(data.creditNote.total, creditCurr, "fr")}`, totalBoxX + 100, tableY + 13, {
        width: 125,
        align: "right",
      });

      if (isCreditForeign) {
        const rate = data.creditNote.exchangeRate || getCurrencyDef(creditCurr).defaultRate;
        const totalDzd = data.creditNote.totalDzd || calculateDzdEquivalent(data.creditNote.total, creditCurr, rate);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica").text(`1 ${creditCurr} = ${rate.toFixed(2)} DZD (Banque d'Algérie)`, totalBoxX + 12, tableY + 33);
        doc.fillColor("#e11d48").fontSize(8.5).font("Helvetica-Bold").text(`Contre-valeur : - ${formatDZD(totalDzd)}`, totalBoxX + 12, tableY + 45);
      }

      tableY += isCreditForeign ? 74 : 54;

      // --- BOTTOM SECTION ANCHORED TO BOTTOM OF LAST PAGE ---
      const footerLineY = 766;
      const hasSeal = seller.showStampSignature !== false;
      const bottomRowH = hasSeal ? 82 : 40;
      const notesBoxH = data.creditNote.notes ? 36 : 0;
      const neededBottomSpace = bottomRowH + (notesBoxH ? notesBoxH + 8 : 0) + 16;

      // If content overflows into bottom area, add new page
      if (tableY + neededBottomSpace > footerLineY) {
        doc.addPage();
        drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);
        tableY = margin + 20;
      }

      // Pin bottom row right above the footer line
      const bottomY = Math.max(tableY + (notesBoxH ? notesBoxH + 8 : 0) + 12, footerLineY - 8 - bottomRowH);
      const notesY = bottomY - (notesBoxH ? notesBoxH + 8 : 0);

      // --- NOTES / REMARQUES ---
      if (data.creditNote.notes) {
        doc.roundedRect(margin, notesY, contentWidth, notesBoxH, cornerRadius).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica-Bold").text("REMARQUES & MODALITÉS :", margin + 10, notesY + 6);
        doc.fillColor(darkColor).fontSize(7.5).font("Helvetica").text(data.creditNote.notes, margin + 10, notesY + 16, { width: contentWidth - 20, lineGap: 1 });
      }

      // --- MANDATORY LEGAL NOTE & DEDICATED CACHET CARD ---
      const stampBoxW = hasSeal ? 195 : 0;
      const legalBoxW = hasSeal ? contentWidth - stampBoxW - 10 : contentWidth;

      // 1. Legal VAT Exemption Card (Left)
      doc.roundedRect(margin, bottomY, legalBoxW, bottomRowH, cornerRadius).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.rect(margin, bottomY, 4, bottomRowH).fill("#059669");
      doc.fillColor("#166534").fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, bottomY + 7);
      doc.fillColor("#14532d").fontSize(7.2).font("Helvetica-Oblique").text(data.creditNote.vatExemptionNote, margin + 12, bottomY + 20, {
        width: legalBoxW - 24,
        lineGap: 2,
      });

      if (hasSeal) {
        doc.fillColor("#166534").fontSize(6.5).font("Helvetica").text(
          "Régime fiscal : Impôt Forfaitaire Unique (IFU). Facture d'avoir établie sans TVA (Loi 22-23).",
          margin + 12,
          bottomY + 54,
          { width: legalBoxW - 24 }
        );
      }

      // 2. Dedicated Cadre Réservé au Cachet & Signature (Right)
      if (hasSeal) {
        const stampBoxX = margin + legalBoxW + 10;
        doc.roundedRect(stampBoxX, bottomY, stampBoxW, bottomRowH, cornerRadius).fillAndStroke("#ffffff", borderColor);
        doc.fillColor(mutedColor).fontSize(6.2).font("Helvetica-Bold").text(
          "CADRE RÉSERVÉ AU CACHET & SIGNATURE :",
          stampBoxX + 6,
          bottomY + 6,
          { width: stampBoxW - 12, align: "center" }
        );

        drawOfficialSealPdf(doc, {
          x: stampBoxX + (stampBoxW - 176) / 2,
          y: bottomY + 16,
          width: 176,
          height: 60,
          centerX: stampBoxX + stampBoxW / 2,
          centerY: bottomY + 16 + 30,
          radius: 29,
          seller: seller,
          sealColor: "#059669",
        });
      }

      // --- FOOTER ---
      doc.moveTo(margin, footerLineY).lineTo(margin + contentWidth, footerLineY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Avoir émis conformément aux obligations comptables de la loi n° 22-23 portant statut de l'auto-entrepreneur.`,
        margin,
        footerLineY + 6,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerLineY + 16,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Génère le Bordereau Récapitulatif Fiscal Annuel officiel (Déclaration IFU / Série G n° 12 bis).
 * Document certifié vectoriel destiné à la Recette / Inspection des Impôts (DGI) et Jibayatic.
 */
export async function generateTaxSummaryPdfBuffer(summary: AnnualTaxSummary): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        info: {
          Title: `Bordereau Récapitulatif Fiscal ${summary.fiscalYear} - IFU G12 bis`,
          Author: summary.seller.fullName,
          Subject: "Bordereau Récapitulatif IFU Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const pageWidth = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      const primaryColor = "#0f172a"; // Slate 900
      const accentColor = "#059669";  // Emerald 600
      const mutedColor = "#64748b";   // Slate 500
      const lightBg = "#f8fafc";      // Slate 50
      const borderColor = "#cbd5e1";  // Slate 300

      // Top colored bar
      doc.rect(margin, margin, contentWidth, 3).fill(accentColor);

      // --- ADMINISTRATIVE HEADER ---
      doc.y = margin + 12;
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor).text(
        "RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE",
        margin,
        doc.y,
        { align: "center", width: contentWidth }
      );
      doc.y += 3;
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(
        "MINISTÈRE DES FINANCES — DIRECTION GÉNÉRALE DES IMPÔTS",
        margin,
        doc.y,
        { align: "center", width: contentWidth }
      );
      doc.y += 8;
      doc.fontSize(12).font("Helvetica-Bold").fillColor(primaryColor).text(
        "BORDEREAU RÉCAPITULATIF FISCAL ANNUEL — RÉGIME DE L'AUTO-ENTREPRENEUR",
        margin,
        doc.y,
        { align: "center", width: contentWidth }
      );
      doc.y += 3;
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(accentColor).text(
        `IMPÔT FORFAITAIRE UNIQUE (IFU) — DÉCLARATION SÉRIE G N° 12 BIS • EXERCICE ${summary.fiscalYear}`,
        margin,
        doc.y,
        { align: "center", width: contentWidth }
      );

      // --- CADRE I : IDENTIFICATION DU CONTRIBUABLE ---
      let curY = doc.y + 14;
      doc.rect(margin, curY, contentWidth, 18).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(
        "I. RENSEIGNEMENTS RELATIFS AU CONTRIBUABLE",
        margin + 8,
        curY + 5
      );
      curY += 18;

      const idHeight = 58;
      doc.rect(margin, curY, contentWidth, idHeight).fillAndStroke(lightBg, borderColor);
      doc.fillColor(primaryColor).fontSize(8).font("Helvetica");

      const col1X = margin + 10;
      const col2X = margin + 270;

      doc.font("Helvetica-Bold").text("Nom et Prénom : ", col1X, curY + 6, { continued: true });
      doc.font("Helvetica").text(summary.seller.fullName);

      doc.font("Helvetica-Bold").text("N° RNAE (Carte Auto-Entrepreneur) : ", col1X, curY + 19, { continued: true });
      doc.font("Helvetica").text(summary.seller.rnaeNumber || "—");

      doc.font("Helvetica-Bold").text("NIF (15 chiffres) : ", col1X, curY + 32, { continued: true });
      doc.font("Helvetica").text(summary.seller.nif || "—");

      doc.font("Helvetica-Bold").text("Activité ANAE : ", col1X, curY + 45, { continued: true });
      doc.font("Helvetica").text(`${summary.seller.activityCode || "—"} - ${summary.seller.activityLabel || "—"}`, { width: 245 });

      doc.font("Helvetica-Bold").text("Adresse professionnelle : ", col2X, curY + 6, { continued: true });
      doc.font("Helvetica").text(summary.seller.address || "—", { width: 240 });

      doc.font("Helvetica-Bold").text("Email : ", col2X, curY + 22, { continued: true });
      doc.font("Helvetica").text(summary.seller.email || "—");

      doc.font("Helvetica-Bold").text("Téléphone : ", col2X, curY + 35, { continued: true });
      doc.font("Helvetica").text(summary.seller.phone || "—");

      curY += idHeight + 10;

      // --- CADRE II : TABLEAU DE LIQUIDATION FISCALE IFU ---
      doc.rect(margin, curY, contentWidth, 18).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(
        "II. DÉTERMINATION DU CHIFFRE D'AFFAIRES IMPOSABLE & LIQUIDATION DE L'IFU (0,5%)",
        margin + 8,
        curY + 5
      );
      curY += 18;

      const metricsRows = [
        { label: "1. Chiffre d'Affaires Brut Facturé (Total des factures émises)", value: formatDZD(summary.metrics.grossBilledDzd) },
        { label: "2. Chiffre d'Affaires Réellement Encaissé (Paiements perçus)", value: formatDZD(summary.metrics.rawCollectedDzd) },
        { label: "3. Déductions légales pour Avoirs / Notes de Crédit remboursées", value: `- ${formatDZD(summary.metrics.totalRefundedCreditDzd)}` },
        { label: "4. CHIFFRE D'AFFAIRES NET IMPOSABLE RETENU (Base de calcul IFU)", value: formatDZD(summary.metrics.netTaxableTurnoverDzd), isHighlight: true },
        { label: "5. Taux applicable de l'Impôt Forfaitaire Unique (Loi de Finances 2024)", value: "0,5 %" },
        { label: "6. Montant calculé de l'IFU (Base nette × 0,5%)", value: formatDZD(summary.metrics.rawIfuTaxDzd) },
        { label: "7. Minimum forfaitaire légal de perception (Code des Impôts)", value: formatDZD(summary.metrics.minimumTaxDzd) },
        { label: "8. MONTANT TOTAL DE L'IMPÔT DÛ AU TRÉSOR PUBLIC", value: formatDZD(summary.metrics.finalTaxOwedDzd), isFinal: true },
      ];

      metricsRows.forEach((r, idx) => {
        const rowH = 17;
        const bg = r.isFinal ? "#ecfdf5" : r.isHighlight ? "#f1f5f9" : (idx % 2 === 0 ? "#ffffff" : "#f8fafc");
        doc.rect(margin, curY, contentWidth, rowH).fillAndStroke(bg, "#e2e8f0");

        doc.fontSize(8);
        if (r.isFinal) {
          doc.font("Helvetica-Bold").fillColor(accentColor);
        } else if (r.isHighlight) {
          doc.font("Helvetica-Bold").fillColor(primaryColor);
        } else {
          doc.font("Helvetica").fillColor(primaryColor);
        }

        doc.text(r.label, margin + 8, curY + 4, { width: 380 });
        doc.text(r.value, margin + 390, curY + 4, { width: contentWidth - 400, align: "right" });
        curY += rowH;
      });

      curY += 10;

      // --- CADRE III : LIVRE-JOURNAL DES ENCAISSEMENTS ---
      doc.rect(margin, curY, contentWidth, 18).fill(primaryColor);
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold").text(
        `III. LIVRE-JOURNAL DES ENCAISSEMENTS EFFECTIFS (${summary.paidInvoices.length} FACTURES PAYÉES)`,
        margin + 8,
        curY + 5
      );
      curY += 18;

      // Table Header
      doc.rect(margin, curY, contentWidth, 16).fill("#e2e8f0");
      doc.fillColor(primaryColor).fontSize(7).font("Helvetica-Bold");
      doc.text("N° FACTURE", margin + 6, curY + 5, { width: 90 });
      doc.text("DATE ÉMISSION", margin + 100, curY + 5, { width: 65 });
      doc.text("DATE ENCAISS.", margin + 170, curY + 5, { width: 65 });
      doc.text("CLIENT BÉNÉFICIAIRE", margin + 240, curY + 5, { width: 175 });
      doc.text("MONTANT ENCAISSÉ (DZD)", margin + 420, curY + 5, { width: contentWidth - 426, align: "right" });
      curY += 16;

      const maxRows = Math.min(summary.paidInvoices.length, 12);
      for (let i = 0; i < maxRows; i++) {
        const inv = summary.paidInvoices[i];
        const rowBg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(margin, curY, contentWidth, 15).fillAndStroke(rowBg, "#f1f5f9");

        doc.font("Helvetica").fontSize(7).fillColor(primaryColor);
        doc.text(inv.invoiceNumber, margin + 6, curY + 4, { width: 90 });
        doc.text(new Date(inv.issueDate).toLocaleDateString("fr-DZ"), margin + 100, curY + 4, { width: 65 });
        doc.text(new Date(inv.paidAt || inv.issueDate).toLocaleDateString("fr-DZ"), margin + 170, curY + 4, { width: 65 });
        doc.text(inv.clientName, margin + 240, curY + 4, { width: 175, lineBreak: false });
        doc.font("Helvetica-Bold").text(formatDZD(inv.total), margin + 420, curY + 4, { width: contentWidth - 426, align: "right" });
        curY += 15;
      }

      if (summary.paidInvoices.length > maxRows) {
        doc.rect(margin, curY, contentWidth, 14).fill("#f8fafc");
        doc.font("Helvetica-Oblique").fontSize(7).fillColor(mutedColor).text(
          `... et ${summary.paidInvoices.length - maxRows} autres factures (voir livre des recettes complet exporté en annexe)`,
          margin + 6,
          curY + 3
        );
        curY += 14;
      }

      if (summary.paidInvoices.length === 0) {
        doc.rect(margin, curY, contentWidth, 18).fill("#ffffff");
        doc.font("Helvetica-Oblique").fontSize(7.5).fillColor(mutedColor).text(
          "Aucun encaissement enregistré sur cet exercice (application automatique du minimum légal de 10 000 DZD).",
          margin + 6,
          curY + 5
        );
        curY += 18;
      }

      curY += 10;

      // --- CADRE IV : SIGNATURES & VISAS OFFICIELS ---
      const boxWidth = (contentWidth - 12) / 2;
      const boxHeight = 72;

      // Attestation contribuable
      doc.roundedRect(margin, curY, boxWidth, boxHeight, 3).strokeColor(borderColor).stroke();
      doc.rect(margin, curY, boxWidth, 14).fill("#f1f5f9");
      doc.fillColor(primaryColor).fontSize(7).font("Helvetica-Bold").text(
        "ATTESTATION SUR L'HONNEUR DU CONTRIBUABLE",
        margin + 6,
        curY + 4
      );
      doc.font("Helvetica").fontSize(6.5).fillColor(mutedColor).text(
        "Je certifie sur l'honneur l'exactitude des montants déclarés conformément aux dispositions de la loi n° 22-23 et du Code des Impôts Directs.",
        margin + 6,
        curY + 18,
        { width: boxWidth - 12 }
      );
      doc.text(`Fait le : ${new Date().toLocaleDateString("fr-DZ")}`, margin + 6, curY + 44);
      doc.font("Helvetica-Bold").text("Signature de l'auto-entrepreneur :", margin + 6, curY + 54);

      // Cadre Recette des Impôts
      const taxBoxX = margin + boxWidth + 12;
      doc.roundedRect(taxBoxX, curY, boxWidth, boxHeight, 3).strokeColor(borderColor).stroke();
      doc.rect(taxBoxX, curY, boxWidth, 14).fill("#f1f5f9");
      doc.fillColor(primaryColor).fontSize(7).font("Helvetica-Bold").text(
        "CADRE RÉSERVÉ À LA RECETTE DES IMPÔTS",
        taxBoxX + 6,
        curY + 4
      );
      doc.font("Helvetica").fontSize(6.5).fillColor(mutedColor).text(
        "Date de réception : ________________________",
        taxBoxX + 6,
        curY + 22
      );
      doc.text("Quittance N° : ____________________________", taxBoxX + 6, curY + 36);
      doc.text("Montant perçu : ___________________________", taxBoxX + 6, curY + 50);
      doc.font("Helvetica-Bold").text("Cachet et visa de l'Inspecteur :", taxBoxX + 115, curY + 58);

      // Footer
      const footerY = 788;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Bordereau Récapitulatif Annuel édité par Auto Entrepreneur DZ pour ${summary.seller.fullName} • NIF : ${summary.seller.nif || "—"} • Conforme Loi 22-23`,
        margin,
        footerY + 6,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export interface PaymentReceiptPdfData {
  receiptNumber: string;
  invoiceNumber: string;
  paymentDate: Date | string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  total: number;
  currency: string;
  notes?: string | null;
  seller: {
    fullName: string;
    rnaeNumber: string;
    nif: string;
    address: string;
    email: string;
    phone: string;
    activityCode: string;
    activityLabel: string;
    logoUrl?: string | null;
    logoPosition?: string | null;
    brandColor?: string | null;
    templateStyle?: string | null;
    showStampSignature?: boolean | null;
    stampType?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
  };
  client: {
    name: string;
    clientType: string;
    address: string;
    nif?: string | null;
    nis?: string | null;
    rc?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

/**
 * Generates official Payment Receipt (Quittance de Paiement) PDF buffer.
 */
export function generatePaymentReceiptPdfBuffer(data: PaymentReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Quittance de Paiement ${data.receiptNumber}`,
          Author: data.seller.fullName,
          Subject: "Reçu de Paiement Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const margin = 40;
      const contentWidth = 595.28 - margin * 2;

      // Brand Styling Engine (Phase 4 Module 1)
      const palette = getBrandPalette(data.seller.brandColor);
      const template = getTemplateStyle(data.seller.templateStyle);
      const primaryColor = palette.hex;
      const darkColor = palette.darkHex;
      const mutedColor = "#64748b";
      const lightBg = template.key === "MINIMALIST" ? "#ffffff" : palette.lightBgHex;
      const borderColor = palette.borderHex;
      const cornerRadius = template.key === "CLASSIC" ? 2 : template.key === "MINIMALIST" ? 3 : 6;

      const logoBuf = getLogoBuffer(data.seller.logoUrl);
      const logoPos = ((data.seller.logoPosition || "LEFT").toUpperCase()) as "LEFT" | "CENTER" | "RIGHT";

      // Top colored bar
      drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);

      // 1. En-tête officiel & Logo
      if (logoBuf && logoPos === "CENTER") {
        const centerW = 80;
        const centerH = 26;
        const centerLogoX = (595.28 - centerW) / 2;
        tryDrawImage(doc, logoBuf, centerLogoX, 36, {
          fit: [centerW, centerH],
          align: "center",
          valign: "center",
        });
      } else if (logoBuf && logoPos === "LEFT") {
        tryDrawImage(doc, logoBuf, margin, 38, {
          fit: [70, 26],
          valign: "center",
        });
      } else if (logoBuf && logoPos === "RIGHT") {
        tryDrawImage(doc, logoBuf, margin + contentWidth - 70, 38, {
          fit: [70, 26],
          align: "right",
          valign: "center",
        });
      }

      const republicY = (logoBuf && logoPos === "CENTER") ? 64 : 40;

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor);
      doc.text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE", margin, republicY, {
        align: "center",
        width: contentWidth,
      });
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text("Statut de l'Auto-Entrepreneur (Loi n° 22-23 du 18 décembre 2022) • Franchise de TVA", margin, republicY + 12, {
        align: "center",
        width: contentWidth,
      });

      // 2. Bannière titre Quittance
      const bannerY = republicY + 28;
      doc.roundedRect(margin, bannerY, contentWidth, 34, cornerRadius).fill(primaryColor);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("QUITTANCE & REÇU DE PAIEMENT", margin, bannerY + 6, {
        align: "center",
        width: contentWidth,
      });
      doc.fontSize(7.5).font("Helvetica").fillColor(palette.lightBgHex);
      doc.text("ATTESTATION DE RÈGLEMENT POUR SOLDE DE TOUT COMPTE", margin, bannerY + 22, {
        align: "center",
        width: contentWidth,
      });

      // 3. Cadre Métadonnées du Reçu
      const metaY = bannerY + 44;
      doc.roundedRect(margin, metaY, contentWidth, 40, cornerRadius).fill(lightBg);
      doc.roundedRect(margin, metaY, contentWidth, 40, cornerRadius).strokeColor(borderColor).stroke();

      const colW = contentWidth / 4;
      const paymentDate = typeof data.paymentDate === "string" ? new Date(data.paymentDate) : data.paymentDate;

      // Col 1: N° Quittance
      doc.font("Helvetica").fontSize(7).fillColor(mutedColor).text("N° DE QUITTANCE", margin + 10, metaY + 8);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(primaryColor).text(data.receiptNumber, margin + 10, metaY + 20);

      // Col 2: Facture Acquittée
      doc.font("Helvetica").fontSize(7).fillColor(mutedColor).text("FACTURE ACQUITTÉE", margin + colW + 10, metaY + 8);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(darkColor).text(data.invoiceNumber, margin + colW + 10, metaY + 20);

      // Col 3: Date de Règlement
      doc.font("Helvetica").fontSize(7).fillColor(mutedColor).text("DATE DU RÈGLEMENT", margin + colW * 2 + 10, metaY + 8);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(darkColor).text(paymentDate.toLocaleDateString("fr-DZ"), margin + colW * 2 + 10, metaY + 20);

      // Col 4: Mode de Règlement
      const methodLabel = formatPaymentMethodLabel(data.paymentMethod, "fr");
      doc.font("Helvetica").fontSize(7).fillColor(mutedColor).text("MODE DE RÈGLEMENT", margin + colW * 3 + 10, metaY + 8);
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(darkColor).text(methodLabel, margin + colW * 3 + 10, metaY + 20);

      // 4. Cadre Parties (Créancier & Débiteur)
      const partiesY = metaY + 50;
      const boxWidth = (contentWidth - 12) / 2;
      const boxHeight = template.key === "COMPACT" ? 90 : 100;

      // Box Créancier
      doc.roundedRect(margin, partiesY, boxWidth, boxHeight, cornerRadius).strokeColor(borderColor).stroke();
      doc.rect(margin, partiesY, boxWidth, 16).fill(palette.lightBgHex);
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(primaryColor).text("CRÉANCIER (BÉNÉFICIAIRE)", margin + 8, partiesY + 4);

      let textY = partiesY + 22;
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(darkColor).text(data.seller.fullName, margin + 8, textY);
      textY += 12;
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(`N° RNAE : ${data.seller.rnaeNumber}`, margin + 8, textY);
      textY += 10;
      doc.text(`NIF : ${data.seller.nif || "—"}`, margin + 8, textY);
      textY += 10;
      doc.text(`Activité : ${data.seller.activityCode} - ${data.seller.activityLabel}`, margin + 8, textY, { width: boxWidth - 16 });
      textY += 12;
      doc.text(`Adresse : ${data.seller.address}`, margin + 8, textY, { width: boxWidth - 16 });

      // Box Débiteur
      const clientBoxX = margin + boxWidth + 12;
      doc.roundedRect(clientBoxX, partiesY, boxWidth, boxHeight, cornerRadius).strokeColor(borderColor).stroke();
      doc.rect(clientBoxX, partiesY, boxWidth, 16).fill("#f1f5f9");
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(darkColor).text("DÉBITEUR (CLIENT PAYEUR)", clientBoxX + 8, partiesY + 4);

      textY = partiesY + 22;
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(darkColor).text(data.client.name, clientBoxX + 8, textY);
      textY += 12;
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(`Statut : ${data.client.clientType === "PROFESSIONAL" ? "Personne Morale / Société" : "Particulier"}`, clientBoxX + 8, textY);
      textY += 10;
      if (data.client.nif) {
        doc.text(`NIF : ${data.client.nif}`, clientBoxX + 8, textY);
        textY += 10;
      }
      if (data.client.rc) {
        doc.text(`RC : ${data.client.rc}`, clientBoxX + 8, textY);
        textY += 10;
      }
      doc.text(`Adresse : ${data.client.address}`, clientBoxX + 8, textY, { width: boxWidth - 16 });

      // 5. Cadre Montant Acquitté & Transcription en Lettres
      const amountY = partiesY + boxHeight + 12;
      doc.roundedRect(margin, amountY, contentWidth, 90, cornerRadius).fill(palette.lightBgHex);
      doc.roundedRect(margin, amountY, contentWidth, 90, cornerRadius).strokeColor(palette.borderHex).stroke();

      doc.fontSize(8).font("Helvetica-Bold").fillColor(primaryColor).text("MONTANT INTÉGRAL ENCAISSÉ ET ACQUITTÉ", margin + 14, amountY + 12);
      doc.fontSize(22).font("Helvetica-Bold").fillColor(primaryColor).text(formatDZD(data.total), margin + 14, amountY + 26);

      const wordsText = getFrenchAmountInWords(data.total);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("Soit en toutes lettres :", margin + 14, amountY + 56);
      doc.fontSize(8).font("Helvetica-Oblique").fillColor(darkColor).text(wordsText, margin + 110, amountY + 56, { width: contentWidth - 124 });

      if (data.paymentReference) {
        doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor).text(
          `Référence de la transaction / N° chèque / virement : ${data.paymentReference}`,
          margin + 14,
          amountY + 74
        );
      }

      // 6. Mention Légale Libératoire
      const legalY = amountY + 102;
      doc.roundedRect(margin, legalY, contentWidth, 54, cornerRadius).fill("#f8fafc");
      doc.roundedRect(margin, legalY, contentWidth, 54, cornerRadius).strokeColor(borderColor).stroke();

      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(darkColor).text("DÉCHARGE & QUITTANCE LIBÉRATOIRE :", margin + 10, legalY + 8);
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor).text(
        "Le bénéficiaire soussigné certifie avoir reçu ce jour la totalité de la somme susvisée en règlement de la facture précitée, pour solde de tout compte et quittance définitive sans réserve. En vertu des dispositions de la loi n° 22-23 relative au statut de l'auto-entrepreneur, cette opération est exonérée de la Taxe sur la Valeur Ajoutée (TVA).",
        margin + 10,
        legalY + 20,
        { width: contentWidth - 20, lineGap: 2 }
      );

      // 7. Cadre Signature et Sceau Administratif
      const sigY = legalY + 66;
      const sigBoxWidth = contentWidth;
      const sigBoxHeight = 120;
      doc.roundedRect(margin, sigY, sigBoxWidth, sigBoxHeight, cornerRadius).strokeColor(borderColor).stroke();

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor).text(
        `Fait à Alger, le ${paymentDate.toLocaleDateString("fr-DZ")}`,
        margin + 12,
        sigY + 12
      );
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(darkColor).text(
        "Pour l'Auto-Entrepreneur (Cachet & Signature valant quittance) :",
        margin + 12,
        sigY + 28
      );

      // Empreinte du cachet officiel
      if (data.seller.showStampSignature !== false) {
        drawOfficialSealPdf(doc, {
          x: margin + sigBoxWidth - 192,
          y: sigY + 40,
          width: 176,
          height: 60,
          centerX: margin + sigBoxWidth - 104,
          centerY: sigY + 70,
          radius: 30,
          seller: data.seller,
          sealColor: primaryColor,
        });
      }

      // 8. Pied de page
      const footerY = 788;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Quittance officielle générée par Auto Entrepreneur DZ pour ${data.seller.fullName} • NIF : ${data.seller.nif || "—"} • Conforme Loi 22-23`,
        margin,
        footerY + 6,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates official Client Statement (Relevé de Compte Client & Bordereau de Situation) PDF buffer.
 */
export function generateClientStatementPdfBuffer(data: ClientLedgerData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Relevé de Compte - ${data.client.name}`,
          Author: data.seller.fullName,
          Subject: "Relevé de Compte Client Auto-Entrepreneur Algérie (Loi 22-23)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const margin = 40;
      const contentWidth = 595.28 - margin * 2;
      const sellerBranding = data.seller as any;
      const palette = getBrandPalette(sellerBranding?.brandColor);
      const template = getTemplateStyle(sellerBranding?.templateStyle);
      const primaryColor = palette.hex;
      const darkColor = palette.darkHex;
      const mutedColor = "#64748b";
      const borderColor = palette.borderHex;
      const cornerRadius = template.key === "CLASSIC" ? 2 : template.key === "MINIMALIST" ? 3 : 6;

      // Top colored bar
      drawTemplateAccentBar(doc, template.key, palette, margin, contentWidth);

      // 1. En-tête
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor);
      doc.text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE", margin, 38, {
        align: "center",
        width: contentWidth,
      });
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text("Régime de l'Auto-Entrepreneur (Loi n° 22-23) • Franchise de TVA", margin, 49, {
        align: "center",
        width: contentWidth,
      });

      // 2. Bannière Titre
      const bannerY = 64;
      doc.roundedRect(margin, bannerY, contentWidth, 34, cornerRadius).fill(darkColor);
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("RELEVÉ DE COMPTE & GRAND LIVRE CLIENT", margin, bannerY + 6, {
        align: "center",
        width: contentWidth,
      });
      doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8");
      doc.text("SITUATION FINANCIÈRE GLOBALE ET CHRONOLOGIQUE DES OPÉRATIONS", margin, bannerY + 22, {
        align: "center",
        width: contentWidth,
      });

      // 3. Cadre Métadonnées Seller & Client
      const partiesY = 106;
      const boxWidth = (contentWidth - 12) / 2;
      const boxHeight = 74;

      // Prestataire
      doc.roundedRect(margin, partiesY, boxWidth, boxHeight, cornerRadius).strokeColor(borderColor).stroke();
      doc.rect(margin, partiesY, boxWidth, 14).fill("#f8fafc");
      doc.fontSize(7).font("Helvetica-Bold").fillColor(primaryColor).text("CRÉANCIER (AUTO-ENTREPRENEUR)", margin + 6, partiesY + 3);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text(data.seller.fullName, margin + 6, partiesY + 18);
      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`N° RNAE : ${data.seller.rnaeNumber} • NIF : ${data.seller.nif || "—"}`, margin + 6, partiesY + 29);
      doc.text(`Activité : ${data.seller.activityCode} - ${data.seller.activityLabel}`, margin + 6, partiesY + 39, { width: boxWidth - 12 });
      doc.text(`Tél : ${data.seller.phone} • Email : ${data.seller.email}`, margin + 6, partiesY + 57);

      // Client
      const clientBoxX = margin + boxWidth + 12;
      doc.roundedRect(clientBoxX, partiesY, boxWidth, boxHeight, 4).strokeColor(borderColor).stroke();
      doc.rect(clientBoxX, partiesY, boxWidth, 14).fill("#f8fafc");
      doc.fontSize(7).font("Helvetica-Bold").fillColor(darkColor).text("CLIENT (DÉBITEUR)", clientBoxX + 6, partiesY + 3);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text(data.client.name, clientBoxX + 6, partiesY + 18);
      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`Statut : ${data.client.clientType === "PROFESSIONAL" ? "Société / Entreprise" : "Particulier"}`, clientBoxX + 6, partiesY + 29);
      if (data.client.nif) doc.text(`NIF : ${data.client.nif} ${data.client.rc ? `• RC : ${data.client.rc}` : ""}`, clientBoxX + 6, partiesY + 39);
      doc.text(`Adresse : ${data.client.address}`, clientBoxX + 6, partiesY + 49, { width: boxWidth - 12 });

      // 4. Synthèse Financière (4 Cards)
      const cardsY = 188;
      const cardW = (contentWidth - 18) / 4;
      const cardH = 50;

      // Card 1: Total Facturé
      doc.roundedRect(margin, cardsY, cardW, cardH, 4).fill("#f8fafc");
      doc.roundedRect(margin, cardsY, cardW, cardH, 4).strokeColor(borderColor).stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(mutedColor).text("TOTAL FACTURÉ", margin + 6, cardsY + 6);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(darkColor).text(formatDZD(data.metrics.totalBilledDzd), margin + 6, cardsY + 18);
      doc.fontSize(6).font("Helvetica").fillColor(mutedColor).text(`${data.metrics.invoicesCount} factures émises`, margin + 6, cardsY + 34);

      // Card 2: Total Encaissé
      const card2X = margin + cardW + 6;
      doc.roundedRect(card2X, cardsY, cardW, cardH, 4).fill("#f0fdf4");
      doc.roundedRect(card2X, cardsY, cardW, cardH, 4).strokeColor("#bbf7d0").stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(primaryColor).text("TOTAL ENCAISSÉ", card2X + 6, cardsY + 6);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(primaryColor).text(formatDZD(data.metrics.totalPaidDzd), card2X + 6, cardsY + 18);
      doc.fontSize(6).font("Helvetica").fillColor(primaryColor).text(`${data.metrics.paidInvoicesCount} règlements reçus`, card2X + 6, cardsY + 34);

      // Card 3: Avoirs Déduits
      const card3X = card2X + cardW + 6;
      doc.roundedRect(card3X, cardsY, cardW, cardH, 4).fill("#fff1f2");
      doc.roundedRect(card3X, cardsY, cardW, cardH, 4).strokeColor("#fecdd3").stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#be123c").text("AVOIRS DÉDUITS", card3X + 6, cardsY + 6);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#be123c").text(`- ${formatDZD(data.metrics.totalCreditNotesDzd)}`, card3X + 6, cardsY + 18);
      doc.fontSize(6).font("Helvetica").fillColor("#be123c").text(`${data.metrics.creditNotesCount} avoirs`, card3X + 6, cardsY + 34);

      // Card 4: Solde Restant Dû
      const card4X = card3X + cardW + 6;
      const isSettled = data.metrics.isSettled;
      doc.roundedRect(card4X, cardsY, cardW, cardH, 4).fill(isSettled ? "#f0fdf4" : "#fffbeb");
      doc.roundedRect(card4X, cardsY, cardW, cardH, 4).strokeColor(isSettled ? "#86efac" : "#fde68a").stroke();
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor(isSettled ? primaryColor : "#b45309").text("SOLDE RESTANT DÛ", card4X + 6, cardsY + 6);
      doc.fontSize(10.5).font("Helvetica-Bold").fillColor(isSettled ? primaryColor : "#b45309").text(formatDZD(data.metrics.outstandingBalanceDzd), card4X + 6, cardsY + 18);
      doc.fontSize(6).font("Helvetica-Bold").fillColor(isSettled ? primaryColor : "#b45309").text(isSettled ? "Compte Soldé ✓" : "En attente de paiement", card4X + 6, cardsY + 34);

      // 5. Tableau Chronologique des Opérations
      let curY = 248;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("JOURNAL CHRONOLOGIQUE DES OPÉRATIONS & RÈGLEMENTS :", margin, curY);
      curY += 12;

      // Header tableau
      const rowHeight = 18;
      doc.rect(margin, curY, contentWidth, rowHeight).fill("#f1f5f9");
      doc.fontSize(7).font("Helvetica-Bold").fillColor(darkColor);

      const colDateW = 55;
      const colTypeW = 60;
      const colRefW = 75;
      const colDescW = 145;
      const colNumW = 60;

      let colX = margin + 4;
      doc.text("DATE", colX, curY + 5);
      colX += colDateW;
      doc.text("TYPE", colX, curY + 5);
      colX += colTypeW;
      doc.text("RÉFÉRENCE", colX, curY + 5);
      colX += colRefW;
      doc.text("DESCRIPTION", colX, curY + 5);
      colX += colDescW;
      doc.text("DÉBIT (+)", colX, curY + 5, { width: colNumW, align: "right" });
      colX += colNumW;
      doc.text("CRÉDIT (-)", colX, curY + 5, { width: colNumW, align: "right" });
      colX += colNumW;
      doc.text("SOLDE", colX, curY + 5, { width: colNumW, align: "right" });

      curY += rowHeight;

      if (data.entries.length === 0) {
        doc.rect(margin, curY, contentWidth, 24).fill("#ffffff");
        doc.roundedRect(margin, curY, contentWidth, 24, 0).strokeColor(borderColor).stroke();
        doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor).text("Aucune opération enregistrée pour ce client.", margin, curY + 8, {
          align: "center",
          width: contentWidth,
        });
        curY += 24;
      } else {
        // Render max 18 entries cleanly
        const entriesToDisplay = data.entries.slice(0, 18);
        for (let i = 0; i < entriesToDisplay.length; i++) {
          const entry = entriesToDisplay[i];
          const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
          doc.rect(margin, curY, contentWidth, rowHeight).fill(bg);
          doc.roundedRect(margin, curY, contentWidth, rowHeight, 0).strokeColor(borderColor).stroke();

          doc.fontSize(6.5).font("Helvetica").fillColor(darkColor);
          colX = margin + 4;

          const d = new Date(entry.date);
          doc.text(d.toLocaleDateString("fr-DZ"), colX, curY + 5);
          colX += colDateW;

          const typeText =
            entry.type === "INVOICE" ? "Facture" : entry.type === "PAYMENT" ? "Règlement" : "Avoir";
          doc.font("Helvetica-Bold").text(typeText, colX, curY + 5);
          colX += colTypeW;

          doc.font("Helvetica").text(entry.reference, colX, curY + 5);
          colX += colRefW;

          doc.text(entry.description, colX, curY + 5, { width: colDescW - 6, ellipsis: true });
          colX += colDescW;

          doc.font("Helvetica-Bold").fillColor(darkColor).text(entry.debit > 0 ? formatDZD(entry.debit) : "—", colX, curY + 5, { width: colNumW, align: "right" });
          colX += colNumW;

          doc.font("Helvetica-Bold").fillColor(primaryColor).text(entry.credit > 0 ? formatDZD(entry.credit) : "—", colX, curY + 5, { width: colNumW, align: "right" });
          colX += colNumW;

          doc.font("Helvetica-Bold").fillColor(entry.runningBalance > 0 ? "#b45309" : primaryColor).text(formatDZD(entry.runningBalance), colX, curY + 5, { width: colNumW, align: "right" });

          curY += rowHeight;
        }
      }

      // 6. Cadre Attestation & Visa
      const certY = Math.min(curY + 16, 680);
      doc.roundedRect(margin, certY, contentWidth, 80, 4).strokeColor(borderColor).stroke();
      doc.rect(margin, certY, contentWidth, 14).fill("#f8fafc");
      doc.fontSize(7).font("Helvetica-Bold").fillColor(darkColor).text("CERTIFICATION DE SITUATION COMPTABLE", margin + 8, certY + 3);

      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor).text(
        `Je soussigné(e), ${data.seller.fullName}, auto-entrepreneur immatriculé(e) sous le N° RNAE ${data.seller.rnaeNumber}, certifie que le présent relevé de compte retrace fidèlement la situation des opérations et règlements intervenus avec le client ${data.client.name} à la date du ${new Date().toLocaleDateString("fr-DZ")}.`,
        margin + 8,
        certY + 20,
        { width: contentWidth - 16, lineGap: 1.5 }
      );

      doc.fontSize(7).font("Helvetica-Bold").fillColor(darkColor).text("Signature & Cachet de l'Auto-Entrepreneur :", margin + 8, certY + 55);

      // 7. Footer
      const footerY = 788;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(6.5).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Relevé de compte certifié édité par Auto Entrepreneur DZ pour ${data.seller.fullName} • NIF : ${data.seller.nif || "—"} • Conforme Loi 22-23`,
        margin,
        footerY + 6,
        { align: "center", width: contentWidth }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

