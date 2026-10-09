import { Resend } from "resend";
import { captureException } from "./sentry";

const resendApiKey = process.env.RESEND_API_KEY;

export function resolveSenderEmail(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (envFrom) {
    const isPublicWebmail = /@(gmail|yahoo|hotmail|outlook|live)\.[a-z]+/i.test(envFrom);
    if (!isPublicWebmail) {
      return envFrom;
    }
  }
  return "Auto Entrepreneur DZ <onboarding@resend.dev>";
}

export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendInvoiceEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  totalAmount: number;
  currency?: string;
  pdfBuffer: Buffer | Uint8Array;
  notes?: string | null;
  sellerName?: string;
  sellerEmail?: string;
}

export interface SendPaymentReceiptEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amountPaid: number;
  currency?: string;
  paymentDate: Date;
  sellerName?: string;
}

export interface SendCeilingAlertEmailParams {
  to: string;
  entrepreneurName: string;
  currentTurnover: number;
  ceilingLimit?: number;
  percentage: number;
  fiscalYear: number;
}

/**
 * Send an official invoice email with PDF attached to client.
 */
export async function sendInvoiceEmail({
  to,
  clientName,
  invoiceNumber,
  totalAmount,
  currency = "DZD",
  pdfBuffer,
  notes,
  sellerName = "Auto-Entrepreneur",
  sellerEmail,
}: SendInvoiceEmailParams) {
  if (!resend) {
    console.info(
      `[Resend Dev/Mock] sendInvoiceEmail -> To: ${to}, Invoice: ${invoiceNumber}, Amount: ${totalAmount.toLocaleString("fr-DZ")} ${currency}`
    );
    return { success: true, mocked: true };
  }

  const formattedAmount = `${totalAmount.toLocaleString("fr-DZ")} ${currency}`;
  const filename = `Facture-${invoiceNumber}.pdf`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
          .content { line-height: 1.6; font-size: 15px; }
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f1f5f9; border-radius: 6px; }
          .summary-table td { padding: 12px 16px; }
          .summary-table tr:first-child td { border-bottom: 1px solid #cbd5e1; }
          .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">Facture N° ${invoiceNumber}</span>
            <h1 class="title" style="margin-top: 10px;">Bonjour ${clientName},</h1>
          </div>
          <div class="content">
            <p>Veuillez trouver ci-joint votre facture <strong>N° ${invoiceNumber}</strong> émise par <strong>${sellerName}</strong>.</p>
            
            <table class="summary-table">
              <tr>
                <td><strong>Montant total net :</strong></td>
                <td style="text-align: right; font-size: 17px; font-weight: bold; color: #0284c7;">${formattedAmount}</td>
              </tr>
              <tr>
                <td><strong>Régime fiscal :</strong></td>
                <td style="text-align: right; font-size: 13px; color: #475569;">Exonéré de TVA (Loi 22-23)</td>
              </tr>
            </table>

            ${notes ? `<p><strong>Instructions / Modalités :</strong><br />${notes}</p>` : ""}

            <p>Le document original certifié en format PDF est joint à cet email.</p>
          </div>
          <div class="footer">
            <p>Document généré via la plateforme conforme pour auto-entrepreneurs en Algérie conformément à la Loi n° 22-23.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSenderEmail(),
      to,
      replyTo: sellerEmail || undefined,
      subject: `Facture N° ${invoiceNumber} - ${sellerName}`,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      captureException(error, { action: "sendInvoiceEmail", invoiceNumber, to });
      console.error("[Resend Error] API returned error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    captureException(err, { action: "sendInvoiceEmail", invoiceNumber, to });
    console.error("[Resend Error] Failed to send invoice email:", err);
    return { success: false, error: err.message || "Erreur de connexion Resend" };
  }
}

/**
 * Send payment receipt confirmation email to client.
 */
export async function sendPaymentReceiptEmail({
  to,
  clientName,
  invoiceNumber,
  amountPaid,
  currency = "DZD",
  paymentDate,
  sellerName = "Auto-Entrepreneur",
}: SendPaymentReceiptEmailParams) {
  if (!resend) {
    console.info(
      `[Resend Dev/Mock] sendPaymentReceiptEmail -> To: ${to}, Invoice: ${invoiceNumber}, Paid: ${amountPaid} ${currency}`
    );
    return { success: true, mocked: true };
  }

  const formattedAmount = `${amountPaid.toLocaleString("fr-DZ")} ${currency}`;
  const formattedDate = paymentDate.toLocaleDateString("fr-DZ");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #16a34a; margin-top: 0;">✓ Règlement Confirmé</h2>
          <p>Bonjour ${clientName},</p>
          <p>Nous vous confirmons la bonne réception de votre paiement de <strong>${formattedAmount}</strong> pour la facture <strong>N° ${invoiceNumber}</strong> en date du <strong>${formattedDate}</strong>.</p>
          <p>Nous vous remercions pour votre confiance.</p>
          <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Cordialement,<br />${sellerName}</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSenderEmail(),
      to,
      subject: `Confirmation de paiement - Facture N° ${invoiceNumber}`,
      html: htmlContent,
    });

    if (error) {
      captureException(error, { action: "sendPaymentReceiptEmail", invoiceNumber, to });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    captureException(err, { action: "sendPaymentReceiptEmail", invoiceNumber, to });
    return { success: false, error: err.message || "Erreur de connexion Resend" };
  }
}

/**
 * Send an alert email to the entrepreneur when approaching annual turnover limits.
 */
export async function sendCeilingAlertEmail({
  to,
  entrepreneurName,
  currentTurnover,
  ceilingLimit = 5_000_000,
  percentage,
  fiscalYear,
}: SendCeilingAlertEmailParams) {
  if (!resend) {
    console.info(`[Resend Dev/Mock] sendCeilingAlertEmail -> Alert for ${entrepreneurName}: ${percentage}%`);
    return { success: true, mocked: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <body style="font-family: sans-serif; background-color: #fef2f2; padding: 24px; color: #1e293b;">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca;">
          <h2 style="color: #dc2626; margin-top: 0;">⚠️ Alerte Seuil IFU - Exercice ${fiscalYear}</h2>
          <p>Bonjour ${entrepreneurName},</p>
          <p>Votre chiffre d'affaires encaissé pour l'exercice <strong>${fiscalYear}</strong> s'élève à <strong>${currentTurnover.toLocaleString("fr-DZ")} DZD</strong>, soit <strong>${percentage.toFixed(1)}%</strong> du plafond légal de <strong>${ceilingLimit.toLocaleString("fr-DZ")} DZD</strong> (Loi 22-23).</p>
          <p>Attention : tout dépassement consécutif sur 3 ans entraîne l'exclusion du régime simplifié de l'auto-entrepreneur et le basculement vers le régime du réel.</p>
          <p style="margin-top: 24px;"><a href="${getAppUrl()}/dashboard" style="background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">Accéder au tableau de bord</a></p>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSenderEmail(),
      to,
      subject: `⚠️ Alerte Plafond IFU (${percentage.toFixed(0)}%) - Exercice ${fiscalYear}`,
      html: htmlContent,
    });

    if (error) {
      captureException(error, { action: "sendCeilingAlertEmail", to });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    captureException(err, { action: "sendCeilingAlertEmail", to });
    return { success: false, error: err.message || "Erreur de connexion Resend" };
  }
}

export interface SendQuoteEmailParams {
  to: string;
  clientName: string;
  quoteNumber: string;
  totalAmount: number;
  currency?: string;
  pdfBuffer: Buffer | Uint8Array;
  validUntil?: Date | null;
  notes?: string | null;
  sellerName?: string;
  sellerEmail?: string;
}

export async function sendQuoteEmail({
  to,
  clientName,
  quoteNumber,
  totalAmount,
  currency = "DZD",
  pdfBuffer,
  validUntil,
  notes,
  sellerName = "Auto-Entrepreneur",
  sellerEmail,
}: SendQuoteEmailParams) {
  if (!resend) {
    console.info(
      `[Resend Dev/Mock] sendQuoteEmail -> To: ${to}, Quote: ${quoteNumber}, Amount: ${totalAmount.toLocaleString("fr-DZ")} ${currency}`
    );
    return { success: true, mocked: true };
  }

  const formattedAmount = `${totalAmount.toLocaleString("fr-DZ")} ${currency}`;
  const filename = `Devis-${quoteNumber}.pdf`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
          .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
          .content { line-height: 1.6; font-size: 15px; }
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f1f5f9; border-radius: 6px; }
          .summary-table td { padding: 12px 16px; }
          .summary-table tr:first-child td { border-bottom: 1px solid #cbd5e1; }
          .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">Proposition Commerciale / Devis N° ${quoteNumber}</span>
            <h1 class="title" style="margin-top: 10px;">Bonjour ${clientName},</h1>
          </div>
          <div class="content">
            <p>Veuillez trouver ci-joint votre devis <strong>N° ${quoteNumber}</strong> préparé par <strong>${sellerName}</strong>.</p>
            
            <table class="summary-table">
              <tr>
                <td><strong>Montant total estimé (Net) :</strong></td>
                <td style="text-align: right; font-size: 17px; font-weight: bold; color: #0284c7;">${formattedAmount}</td>
              </tr>
              ${
                validUntil
                  ? `<tr>
                      <td><strong>Validité de l'offre :</strong></td>
                      <td style="text-align: right; font-size: 13px; color: #475569;">Jusqu'au ${new Date(validUntil).toLocaleDateString("fr-DZ")}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td><strong>Régime fiscal :</strong></td>
                <td style="text-align: right; font-size: 13px; color: #475569;">Exonéré de TVA (Loi 22-23)</td>
              </tr>
            </table>

            ${notes ? `<p><strong>Conditions & Modalités :</strong><br />${notes}</p>` : ""}

            <p>Pour valider ce devis, vous pouvez nous renvoyer le document joint avec la mention 'Bon pour accord' et signature.</p>
          </div>
          <div class="footer">
            <p>Document établi conformément aux dispositions de la Loi n° 22-23 relative au statut de l'auto-entrepreneur en Algérie.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSenderEmail(),
      to,
      subject: `Devis N° ${quoteNumber} - ${sellerName}`,
      html: htmlContent,
      replyTo: sellerEmail || undefined,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      captureException(error, { action: "sendQuoteEmail", to, quoteNumber });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    captureException(err, { action: "sendQuoteEmail", to, quoteNumber });
    return { success: false, error: err.message || "Erreur de connexion Resend" };
  }
}

export interface SendCreditNoteEmailParams {
  to: string;
  clientName: string;
  creditNoteNumber: string;
  originalInvoiceNumber: string;
  totalAmount: number;
  currency?: string;
  pdfBuffer: Buffer | Uint8Array;
  reason: string;
  notes?: string | null;
  sellerName?: string;
  sellerEmail?: string;
}

export async function sendCreditNoteEmail({
  to,
  clientName,
  creditNoteNumber,
  originalInvoiceNumber,
  totalAmount,
  currency = "DZD",
  pdfBuffer,
  reason,
  notes,
  sellerName = "Auto-Entrepreneur",
  sellerEmail,
}: SendCreditNoteEmailParams) {
  if (!resend) {
    console.info(
      `[Resend Dev/Mock] sendCreditNoteEmail -> To: ${to}, CreditNote: ${creditNoteNumber}, Amount: ${totalAmount.toLocaleString("fr-DZ")} ${currency}`
    );
    return { success: true, mocked: true };
  }

  const formattedAmount = `${totalAmount.toLocaleString("fr-DZ")} ${currency}`;
  const filename = `Avoir-${creditNoteNumber}.pdf`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 8px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #e11d48; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
          .badge { display: inline-block; background: #ffe4e6; color: #be123c; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
          .content { line-height: 1.6; font-size: 15px; }
          .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f1f5f9; border-radius: 6px; }
          .summary-table td { padding: 12px 16px; }
          .summary-table tr:first-child td { border-bottom: 1px solid #cbd5e1; }
          .footer { margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">Facture d'Avoir N° ${creditNoteNumber}</span>
            <h1 class="title" style="margin-top: 10px;">Bonjour ${clientName},</h1>
          </div>
          <div class="content">
            <p>Veuillez trouver ci-joint votre facture d'avoir <strong>N° ${creditNoteNumber}</strong> émise en rectification de la facture <strong>N° ${originalInvoiceNumber}</strong> par <strong>${sellerName}</strong>.</p>
            
            <table class="summary-table">
              <tr>
                <td><strong>Montant du crédit :</strong></td>
                <td style="text-align: right; font-size: 17px; font-weight: bold; color: #e11d48;">- ${formattedAmount}</td>
              </tr>
              <tr>
                <td><strong>Facture rectifiée :</strong></td>
                <td style="text-align: right; font-size: 13px; color: #475569;">${originalInvoiceNumber}</td>
              </tr>
              <tr>
                <td><strong>Motif de l'avoir :</strong></td>
                <td style="text-align: right; font-size: 13px; color: #475569;">${reason}</td>
              </tr>
            </table>

            ${notes ? `<p><strong>Remarques :</strong><br />${notes}</p>` : ""}

            <p>L'avoir officiel au format PDF est disponible en pièce jointe.</p>
          </div>
          <div class="footer">
            <p>Document émis conformément aux obligations comptables de la Loi n° 22-23 (Algérie).</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSenderEmail(),
      to,
      subject: `Avoir N° ${creditNoteNumber} (Réf. ${originalInvoiceNumber}) - ${sellerName}`,
      html: htmlContent,
      replyTo: sellerEmail || undefined,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
        },
      ],
    });

    if (error) {
      captureException(error, { action: "sendCreditNoteEmail", to, creditNoteNumber });
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    captureException(err, { action: "sendCreditNoteEmail", to, creditNoteNumber });
    return { success: false, error: err.message || "Erreur de connexion Resend" };
  }
}

