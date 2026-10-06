import PDFDocument from "pdfkit";
import { formatDZD } from "./tax";

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
