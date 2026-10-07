import PDFDocument from "pdfkit";
import { formatDZD } from "./tax";
import type { AnnualTaxSummary } from "./taxSummary";

export interface InvoicePdfData {
  invoice: {
    invoiceNumber: string | null;
    issueDate: Date | string;
    total: number;
    currency: string;
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
        margin: 40,
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

      const seller = data.invoice.sellerSnapshot
        ? JSON.parse(data.invoice.sellerSnapshot)
        : data.seller;

      const client = data.invoice.clientSnapshot
        ? JSON.parse(data.invoice.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Primary Brand Colors
      const primaryColor = "#059669"; // Emerald 600
      const darkColor = "#0f172a";    // Slate 900
      const mutedColor = "#64748b";   // Slate 500
      const lightBg = "#f8fafc";      // Slate 50
      const borderColor = "#e2e8f0";  // Slate 200

      // --- HEADER ---
      doc.rect(margin, margin, contentWidth, 3).fill(primaryColor);

      doc.y = margin + 15;
      doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE", margin, doc.y);
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / IFU)");

      // Invoice metadata on the right
      const metaY = margin + 15;
      const dateStr = new Date(data.invoice.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc.fontSize(9).font("Helvetica").fillColor(mutedColor);
      doc.text("N° de Facture :", 360, metaY, { width: 90, align: "right" });
      doc
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(data.invoice.invoiceNumber || "BROUILLON", 455, metaY, { width: 100 });

      doc.font("Helvetica").fillColor(mutedColor);
      doc.text("Date d'émission :", 360, metaY + 16, { width: 90, align: "right" });
      doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 455, metaY + 16, { width: 100 });

      doc.moveDown(2);

      // --- SELLER & CLIENT BOXES ---
      const boxesY = 120;
      const boxWidth = (contentWidth - 16) / 2;
      const boxHeight = 120;

      // Seller Box
      doc.roundedRect(margin, boxesY, boxWidth, boxHeight, 6).fillAndStroke(lightBg, borderColor);
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
      doc.roundedRect(clientX, boxesY, boxWidth, boxHeight, 6).fillAndStroke(lightBg, borderColor);
      doc.fillColor(mutedColor).fontSize(8).font("Helvetica-Bold").text("CLIENT (DESTINATAIRE)", clientX + 12, boxesY + 10);
      doc.fillColor(darkColor).fontSize(11).font("Helvetica-Bold").text(client.name || "Client", clientX + 12, boxesY + 24);

      doc.fontSize(8.5).font("Helvetica").fillColor(darkColor);
      doc.text(`Type : ${client.clientType === "PROFESSIONAL" ? "Entreprise / Professionnel" : "Particulier"}`, clientX + 12, boxesY + 40);
      doc.text(`Adresse : ${client.address || "—"}`, clientX + 12, boxesY + 54, { width: boxWidth - 24 });
      if (client.nif) doc.text(`NIF : ${client.nif}`, clientX + 12, boxesY + 76);
      if (client.rc) doc.text(`RC : ${client.rc}`, clientX + 12, boxesY + 90);
      if (client.email) doc.text(`Email : ${client.email}`, clientX + 12, boxesY + 104);

      // --- TABLE OF LINE ITEMS ---
      let tableY = 260;
      const isDetailed = Boolean((data.invoice as any).showDetailedItems);

      const col1 = margin + 12;
      const col2 = 320;
      const col3 = 390;
      const col4 = 475;

      // Table Header
      doc.roundedRect(margin, tableY, contentWidth, 24, 4).fillAndStroke("#f1f5f9", borderColor);
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
        const rowHeight = 24;
        if (index % 2 === 1) {
          doc.rect(margin, tableY - 4, contentWidth, rowHeight).fill("#fafafa");
        }

        doc.fillColor(darkColor).fontSize(8.5).font("Helvetica");

        if (isDetailed) {
          doc.text(item.description, col1, tableY, { width: 260 });
          doc.text(String(item.quantity), col2, tableY, { width: 50, align: "right" });
          doc.text(formatDZD(item.unitPrice), col3, tableY, { width: 75, align: "right" });
          doc.font("Helvetica-Bold").text(formatDZD(item.totalPrice), col4, tableY, { width: 70, align: "right" });
        } else {
          doc.text(item.description, col1, tableY, { width: contentWidth - 150 });
          doc.font("Helvetica-Bold").text(formatDZD(item.totalPrice), margin + contentWidth - 130, tableY, {
            width: 120,
            align: "right",
          });
        }

        tableY += rowHeight;
      });

      doc.moveTo(margin, tableY).lineTo(margin + contentWidth, tableY).strokeColor(borderColor).stroke();
      tableY += 15;

      // --- TOTAL BOX (NO VAT, NO HT/TTC SPLIT) ---
      const totalBoxWidth = 230;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, 42, 6).fillAndStroke(lightBg, borderColor);

      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL NET À PAYER :", totalBoxX + 12, tableY + 14);
      doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text(formatDZD(data.invoice.total), totalBoxX + 110, tableY + 13, {
        width: 110,
        align: "right",
      });

      tableY += 56;

      // --- MANDATORY VAT EXEMPTION NOTE (EDITABLE TEMPLATE STRING) ---
      doc.roundedRect(margin, tableY, contentWidth, 44, 4).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.rect(margin, tableY, 4, 44).fill(primaryColor);

      doc.fillColor("#166534").fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE OBLIGATOIRE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, tableY + 8);
      doc.fillColor("#14532d").fontSize(7.5).font("Helvetica-Oblique").text(data.invoice.vatExemptionNote, margin + 12, tableY + 20, {
        width: contentWidth - 24,
      });

      tableY += 56;

      // --- NOTES / MODALITÉS DE RÈGLEMENT ---
      if (data.invoice.notes) {
        doc.roundedRect(margin, tableY, contentWidth, 36, 4).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica-Bold").text("MODALITÉS DE RÈGLEMENT & REMARQUES :", margin + 10, tableY + 7);
        doc.fillColor(darkColor).fontSize(8).font("Helvetica").text(data.invoice.notes, margin + 10, tableY + 18, { width: contentWidth - 20 });
      }

      // --- FOOTER ---
      const footerY = 770;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Facture émise conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur.`,
        margin,
        footerY + 8,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerY + 18,
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
    total: number;
    currency: string;
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
        margin: 40,
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

      const seller = data.quote.sellerSnapshot
        ? JSON.parse(data.quote.sellerSnapshot)
        : data.seller;

      const client = data.quote.clientSnapshot
        ? JSON.parse(data.quote.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Theme colors for Devis: Classic slate & sky accent
      const accentColor = "#0284c7"; // Sky 600
      const darkColor = "#0f172a";   // Slate 900
      const mutedColor = "#64748b";  // Slate 500
      const lightBg = "#f8fafc";     // Slate 50
      const borderColor = "#e2e8f0"; // Slate 200

      // Top colored bar
      doc.rect(margin, margin, contentWidth, 3).fill(accentColor);

      doc.y = margin + 15;
      doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("DEVIS", margin, doc.y);
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(accentColor)
        .text("RÉGIME DE L'AUTO-ENTREPRENEUR — ALGÉRIE (LOI 22-23 / PROFORMA)");

      // Metadata on the right
      const metaY = margin + 15;
      const dateStr = new Date(data.quote.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc.fontSize(9).font("Helvetica").fillColor(mutedColor);
      doc.text("N° de Devis :", 360, metaY, { width: 90, align: "right" });
      doc
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(data.quote.quoteNumber || "PROJET BROUILLON", 455, metaY, { width: 100, align: "right" });

      doc.font("Helvetica").fillColor(mutedColor);
      doc.text("Date d'émission :", 360, metaY + 14, { width: 90, align: "right" });
      doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 455, metaY + 14, { width: 100, align: "right" });

      if (data.quote.validUntil) {
        const validStr = new Date(data.quote.validUntil).toLocaleDateString("fr-DZ", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        doc.font("Helvetica").fillColor(mutedColor);
        doc.text("Valable jusqu'au :", 350, metaY + 28, { width: 100, align: "right" });
        doc.font("Helvetica-Bold").fillColor(accentColor).text(validStr, 455, metaY + 28, { width: 100, align: "right" });
      }

      // --- SENDER & CLIENT CARDS ---
      const cardY = margin + 65;
      const cardWidth = (contentWidth - 16) / 2;
      const cardHeight = 110;

      // Prestataire
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, 4).fillAndStroke(lightBg, borderColor);
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
      doc.roundedRect(clientX, cardY, cardWidth, cardHeight, 4).fillAndStroke(lightBg, borderColor);
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
      doc.rect(margin, tableY, contentWidth, 22).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("DESCRIPTION DES PRESTATIONS", margin + 10, tableY + 7);
      doc.text("QTÉ", margin + 300, tableY + 7, { width: 40, align: "center" });
      doc.text("P.U (DZD)", margin + 345, tableY + 7, { width: 75, align: "right" });
      doc.text("TOTAL (DZD)", margin + 425, tableY + 7, { width: 80, align: "right" });

      tableY += 22;

      // Rows
      doc.font("Helvetica").fontSize(8);
      data.quote.lineItems.forEach((item, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(margin, tableY, contentWidth, 24).fill(rowBg);
        doc.rect(margin, tableY + 23, contentWidth, 1).fill("#f1f5f9");

        doc.fillColor(darkColor).text(item.description, margin + 10, tableY + 7, { width: 285 });
        doc.fillColor(mutedColor).text(String(item.quantity), margin + 300, tableY + 7, { width: 40, align: "center" });
        doc.text(formatDZD(item.unitPrice), margin + 345, tableY + 7, { width: 75, align: "right" });
        doc.fillColor(darkColor).font("Helvetica-Bold").text(formatDZD(item.totalPrice), margin + 425, tableY + 7, { width: 80, align: "right" });

        doc.font("Helvetica");
        tableY += 24;
      });

      // --- TOTAL BOX ---
      const totalBoxWidth = 240;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      tableY += 12;

      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, 42, 4).fillAndStroke("#f0f9ff", "#bae6fd");
      doc.rect(totalBoxX, tableY, 4, 42).fill(accentColor);
      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL ESTIMÉ (NET) :", totalBoxX + 12, tableY + 14);
      doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(formatDZD(data.quote.total), totalBoxX + 110, tableY + 13, {
        width: 115,
        align: "right",
      });

      tableY += 54;

      // --- LEGAL NOTE ---
      doc.roundedRect(margin, tableY, contentWidth, 38, 4).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.rect(margin, tableY, 4, 38).fill("#059669");
      doc.fillColor("#166534").fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, tableY + 6);
      doc.fillColor("#14532d").fontSize(7.5).font("Helvetica-Oblique").text(data.quote.vatExemptionNote, margin + 12, tableY + 18, {
        width: contentWidth - 24,
      });

      tableY += 48;

      // --- NOTES & APPROVAL BOX ---
      if (data.quote.notes) {
        doc.roundedRect(margin, tableY, contentWidth - 180, 50, 4).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica-Bold").text("CONDITIONS DU DEVIS :", margin + 10, tableY + 7);
        doc.fillColor(darkColor).fontSize(8).font("Helvetica").text(data.quote.notes, margin + 10, tableY + 18, { width: contentWidth - 200 });
      }

      // Client Signature & Stamp Box
      const sigX = margin + contentWidth - 165;
      doc.roundedRect(sigX, tableY, 165, 50, 4).fillAndStroke("#ffffff", borderColor);
      doc.fillColor(mutedColor).fontSize(7).font("Helvetica-Bold").text("BON POUR ACCORD ET COMMANDE", sigX + 8, tableY + 6, { width: 150, align: "center" });
      doc.fontSize(6.5).font("Helvetica").text("Date et signature précédées de la mention 'Bon pour accord'", sigX + 8, tableY + 17, { width: 150, align: "center" });

      // --- FOOTER ---
      const footerY = 770;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Devis établi conformément aux dispositions de la loi n° 22-23 du 18 décembre 2022 portant statut de l'auto-entrepreneur.`,
        margin,
        footerY + 8,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerY + 18,
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
        margin: 40,
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

      const seller = data.creditNote.sellerSnapshot
        ? JSON.parse(data.creditNote.sellerSnapshot)
        : data.seller;

      const client = data.creditNote.clientSnapshot
        ? JSON.parse(data.creditNote.clientSnapshot)
        : data.client;

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Theme colors for Avoir: Slate & Rose/Crimson accent
      const accentColor = "#e11d48"; // Rose 600
      const darkColor = "#0f172a";   // Slate 900
      const mutedColor = "#64748b";  // Slate 500
      const lightBg = "#f8fafc";     // Slate 50
      const borderColor = "#e2e8f0"; // Slate 200

      // Top colored bar
      doc.rect(margin, margin, contentWidth, 3).fill(accentColor);

      doc.y = margin + 15;
      doc.fontSize(22).font("Helvetica-Bold").fillColor(darkColor).text("FACTURE D'AVOIR", margin, doc.y);
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(accentColor)
        .text("NOTE DE CRÉDIT COMPTABLE — ALGÉRIE (LOI 22-23 / IFU)");

      // Metadata on the right
      const metaY = margin + 15;
      const dateStr = new Date(data.creditNote.issueDate).toLocaleDateString("fr-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      doc.fontSize(9).font("Helvetica").fillColor(mutedColor);
      doc.text("N° d'Avoir :", 360, metaY, { width: 90, align: "right" });
      doc
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(data.creditNote.creditNoteNumber || "BROUILLON", 455, metaY, { width: 100, align: "right" });

      doc.font("Helvetica").fillColor(mutedColor);
      doc.text("Date d'émission :", 360, metaY + 14, { width: 90, align: "right" });
      doc.font("Helvetica-Bold").fillColor(darkColor).text(dateStr, 455, metaY + 14, { width: 100, align: "right" });

      // Referenced invoice badge
      const refY = margin + 50;
      doc.roundedRect(margin, refY, contentWidth, 24, 4).fillAndStroke("#fff1f2", "#fecdd3");
      doc.rect(margin, refY, 4, 24).fill(accentColor);
      doc.fillColor("#9f1239").fontSize(8).font("Helvetica-Bold").text("RÉFÉRENCE FACTURE D'ORIGINE :", margin + 12, refY + 7);
      doc.fillColor(darkColor).fontSize(8.5).font("Helvetica-Bold").text(data.creditNote.originalInvoiceNumber || "—", margin + 165, refY + 6.5);
      doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica").text(`Motif : ${data.creditNote.reason}`, margin + 270, refY + 7.5, { width: contentWidth - 280 });

      // --- SENDER & CLIENT CARDS ---
      const cardY = refY + 34;
      const cardWidth = (contentWidth - 16) / 2;
      const cardHeight = 105;

      // Prestataire
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, 4).fillAndStroke(lightBg, borderColor);
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
      doc.roundedRect(clientX, cardY, cardWidth, cardHeight, 4).fillAndStroke(lightBg, borderColor);
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
      doc.rect(margin, tableY, contentWidth, 22).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
      doc.text("LIGNES CRÉDITÉES / ANNULÉES", margin + 10, tableY + 7);
      doc.text("QTÉ", margin + 300, tableY + 7, { width: 40, align: "center" });
      doc.text("P.U (DZD)", margin + 345, tableY + 7, { width: 75, align: "right" });
      doc.text("CRÉDIT (DZD)", margin + 425, tableY + 7, { width: 80, align: "right" });

      tableY += 22;

      // Rows
      doc.font("Helvetica").fontSize(8);
      data.creditNote.lineItems.forEach((item, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#fff1f2";
        doc.rect(margin, tableY, contentWidth, 24).fill(rowBg);
        doc.rect(margin, tableY + 23, contentWidth, 1).fill("#f1f5f9");

        doc.fillColor(darkColor).text(item.description, margin + 10, tableY + 7, { width: 285 });
        doc.fillColor(mutedColor).text(String(item.quantity), margin + 300, tableY + 7, { width: 40, align: "center" });
        doc.text(formatDZD(item.unitPrice), margin + 345, tableY + 7, { width: 75, align: "right" });
        doc.fillColor(accentColor).font("Helvetica-Bold").text(`- ${formatDZD(item.totalPrice)}`, margin + 425, tableY + 7, { width: 80, align: "right" });

        doc.font("Helvetica");
        tableY += 24;
      });

      // --- TOTAL BOX ---
      const totalBoxWidth = 240;
      const totalBoxX = margin + contentWidth - totalBoxWidth;
      tableY += 12;

      doc.roundedRect(totalBoxX, tableY, totalBoxWidth, 42, 4).fillAndStroke("#fff1f2", "#fecdd3");
      doc.rect(totalBoxX, tableY, 4, 42).fill(accentColor);
      doc.fillColor(darkColor).fontSize(9.5).font("Helvetica-Bold").text("TOTAL CRÉDIT NET :", totalBoxX + 12, tableY + 14);
      doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(`- ${formatDZD(data.creditNote.total)}`, totalBoxX + 100, tableY + 13, {
        width: 125,
        align: "right",
      });

      tableY += 54;

      // --- LEGAL NOTE ---
      doc.roundedRect(margin, tableY, contentWidth, 38, 4).fillAndStroke("#f0fdf4", "#bbf7d0");
      doc.rect(margin, tableY, 4, 38).fill("#059669");
      doc.fillColor("#166534").fontSize(7.5).font("Helvetica-Bold").text("MENTION LÉGALE D'EXONÉRATION DE TVA (LOI 22-23 / RÉGIME IFU) :", margin + 12, tableY + 6);
      doc.fillColor("#14532d").fontSize(7.5).font("Helvetica-Oblique").text(data.creditNote.vatExemptionNote, margin + 12, tableY + 18, {
        width: contentWidth - 24,
      });

      tableY += 48;

      if (data.creditNote.notes) {
        doc.roundedRect(margin, tableY, contentWidth, 36, 4).fillAndStroke(lightBg, borderColor);
        doc.fillColor(mutedColor).fontSize(7.5).font("Helvetica-Bold").text("REMARQUES & MODALITÉS :", margin + 10, tableY + 7);
        doc.fillColor(darkColor).fontSize(8).font("Helvetica").text(data.creditNote.notes, margin + 10, tableY + 18, { width: contentWidth - 20 });
      }

      // --- FOOTER ---
      const footerY = 770;
      doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).strokeColor(borderColor).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(mutedColor);
      doc.text(
        `Avoir émis conformément aux obligations comptables de la loi n° 22-23 portant statut de l'auto-entrepreneur.`,
        margin,
        footerY + 8,
        { align: "center", width: contentWidth }
      );
      doc.text(
        `Titulaire immatriculé au Registre National de l'Auto-Entrepreneur (RNAE N° ${seller.rnaeNumber || "—"}) — NIF : ${seller.nif || "—"}`,
        margin,
        footerY + 18,
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
        `Bordereau Récapitulatif Annuel édité par Moukawil.dz pour ${summary.seller.fullName} • NIF : ${summary.seller.nif || "—"} • Conforme Loi 22-23`,
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
