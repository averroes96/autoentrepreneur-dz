import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 36,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0284c7",
    paddingBottom: 16,
  },
  titleCol: {
    flexDirection: "column",
  },
  docTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  regimeBadge: {
    marginTop: 4,
    fontSize: 8.5,
    color: "#0284c7",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  invoiceMetaCol: {
    alignItems: "flex-end",
  },
  metaItem: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    color: "#64748b",
    marginRight: 6,
  },
  metaValue: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 16,
  },
  partyBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  partyHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 3,
  },
  partyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  partyText: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  colDesc: {
    flex: 5,
  },
  colQty: {
    flex: 1.2,
    textAlign: "right",
  },
  colPrice: {
    flex: 2,
    textAlign: "right",
  },
  colTotal: {
    flex: 2.2,
    textAlign: "right",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: "48%",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0284c7",
  },
  vatNoticeContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 3,
    borderLeftColor: "#16a34a",
    borderRadius: 4,
    marginBottom: 20,
  },
  vatNoticeTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#166534",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  vatNoticeText: {
    fontSize: 8,
    color: "#14532d",
    lineHeight: 1.3,
  },
  notesBox: {
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 3,
  },
  notesText: {
    fontSize: 8,
    color: "#334155",
  },
  footer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

interface InvoicePdfProps {
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
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      currency: string;
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

export function InvoicePdfDocument({ invoice, seller, client }: InvoicePdfProps) {
  // Use snapshot if present (preserves legal immutability), otherwise fallback
  const sellerData = invoice.sellerSnapshot
    ? JSON.parse(invoice.sellerSnapshot)
    : seller;

  const clientData = invoice.clientSnapshot
    ? JSON.parse(invoice.clientSnapshot)
    : client;

  const formattedDate = new Date(invoice.issueDate).toLocaleDateString("fr-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatMoney = (val: number) => {
    return (
      (val || 0).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ` ${invoice.currency || "DZD"}`
    );
  };

  return (
    <Document title={`Facture-${invoice.invoiceNumber || "Brouillon"}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.docTitle}>FACTURE</Text>
            <Text style={styles.regimeBadge}>Régime Auto-Entrepreneur — Algérie (Loi 22-23)</Text>
          </View>
          <View style={styles.invoiceMetaCol}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Numéro :</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber || "BROUILLON"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date d'émission :</Text>
              <Text style={styles.metaValue}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Seller & Client Boxes */}
        <View style={styles.partiesRow}>
          {/* Seller / Auto-Entrepreneur */}
          <View style={styles.partyBox}>
            <Text style={styles.partyHeader}>Émetteur (Auto-Entrepreneur)</Text>
            <Text style={styles.partyName}>{sellerData.fullName || "Auto-Entrepreneur"}</Text>
            <Text style={styles.partyText}>N° RNAE : {sellerData.rnaeNumber || "—"}</Text>
            <Text style={styles.partyText}>NIF : {sellerData.nif || "—"}</Text>
            <Text style={styles.partyText}>Activité : {sellerData.activityCode ? `[${sellerData.activityCode}] ` : ""}{sellerData.activityLabel || "Prestations de services"}</Text>
            <Text style={styles.partyText}>Adresse : {sellerData.address || "—"}</Text>
            {sellerData.phone ? <Text style={styles.partyText}>Tél : {sellerData.phone}</Text> : null}
            {sellerData.email ? <Text style={styles.partyText}>Email : {sellerData.email}</Text> : null}
          </View>

          {/* Client */}
          <View style={styles.partyBox}>
            <Text style={styles.partyHeader}>Client</Text>
            <Text style={styles.partyName}>{clientData.name || "Client"}</Text>
            <Text style={styles.partyText}>Type : {clientData.clientType === "PROFESSIONAL" ? "Professionnel / Entreprise" : "Particulier"}</Text>
            <Text style={styles.partyText}>Adresse : {clientData.address || "—"}</Text>
            {clientData.nif ? <Text style={styles.partyText}>NIF : {clientData.nif}</Text> : null}
            {clientData.nis ? <Text style={styles.partyText}>NIS : {clientData.nis}</Text> : null}
            {clientData.rc ? <Text style={styles.partyText}>RC : {clientData.rc}</Text> : null}
            {clientData.email ? <Text style={styles.partyText}>Email : {clientData.email}</Text> : null}
            {clientData.phone ? <Text style={styles.partyText}>Tél : {clientData.phone}</Text> : null}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Désignation de la prestation / service</Text>
            <Text style={styles.colQty}>Quantité</Text>
            <Text style={styles.colPrice}>Prix Unitaire</Text>
            <Text style={styles.colTotal}>Montant</Text>
          </View>
          {invoice.lineItems.map((item, index) => (
            <View key={item.id || index} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatMoney(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section (STRICTLY NO VAT, NO HT/TTC SPLIT) */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL NET À PAYER :</Text>
              <Text style={styles.totalAmount}>{formatMoney(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Mandatory VAT Exemption Note (Editable Template String) */}
        <View style={styles.vatNoticeContainer}>
          <Text style={styles.vatNoticeTitle}>Mention légale obligatoire d'exonération de TVA :</Text>
          <Text style={styles.vatNoticeText}>{invoice.vatExemptionNote}</Text>
        </View>

        {/* Optional Notes */}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notes / Modalités de règlement :</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Legal Footer */}
        <View style={styles.footer}>
          <Text>
            Facture établie par {sellerData.fullName || "l'auto-entrepreneur"} conformément à la loi n° 22-23 du 18 décembre 2022.
          </Text>
          <Text>
            Activité immatriculée au Registre National de l'Auto-Entrepreneur (RNAE n° {sellerData.rnaeNumber || "—"}).
          </Text>
        </View>
      </Page>
    </Document>
  );
}
export default InvoicePdfDocument;
