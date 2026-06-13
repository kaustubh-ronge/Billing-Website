import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: '#ffffff',
    color: '#111827',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e5e7eb',
  },
  businessName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 8.5,
    color: '#6b7280',
    marginBottom: 2,
    lineHeight: 1.4,
  },
  gstin: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 6,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  invoiceLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceNum: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 4,
  },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  statusPaid: { backgroundColor: '#dcfce7', color: '#16a34a' },
  statusPartial: { backgroundColor: '#fef9c3', color: '#ca8a04' },
  statusPending: { backgroundColor: '#fee2e2', color: '#dc2626' },
  statusText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Bill-to / payment info
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    gap: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    border: '1px solid #e5e7eb',
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 3 },
  infoDetail: { fontSize: 8.5, color: '#6b7280', marginBottom: 2 },

  // Payment terms box
  termsBox: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    padding: 12,
    border: '1px solid #bae6fd',
  },

  // Table
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: '1px solid #f3f4f6',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
  },
  colItem: { flex: 4 },
  colPrice: { flex: 2, textAlign: 'right' },
  colQty: { width: 40, textAlign: 'center' },
  colTax: { width: 44, textAlign: 'center' },
  colTotal: { flex: 2, textAlign: 'right' },
  th: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { fontSize: 9, color: '#374151' },
  tdBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827' },
  serviceTag: { fontSize: 7, color: '#6b7280', backgroundColor: '#e5e7eb', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2, marginTop: 1 },

  // Totals
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  footerMessage: {
    flex: 1,
    fontSize: 8.5,
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: 1.5,
    paddingRight: 24,
    paddingTop: 8,
  },
  totalsBox: {
    width: 220,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    border: '1px solid #e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: { fontSize: 8.5, color: '#6b7280' },
  totalValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
  discountValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1.5px solid #e5e7eb',
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 5,
  },
  grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
  grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
  paidValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 5,
    marginTop: 2,
  },
  balanceLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  balanceValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#dc2626' },

  // Signature
  signatureSection: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: 160,
    borderTop: '1px solid #9ca3af',
    paddingTop: 6,
    alignItems: 'center',
  },
  signatureName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 2 },
  signatureRole: { fontSize: 7.5, color: '#9ca3af' },
});

const TERMS_LABEL = {
  IMMEDIATE: 'Immediate — Paid on delivery',
  NET_7: 'Net 7 days',
  NET_15: 'Net 15 days',
  NET_30: 'Net 30 days',
  NET_45: 'Net 45 days',
  CUSTOM: 'Custom terms',
};

export function InvoicePDF({ invoice }) {
  const { customer, shop, items, payments } = invoice;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const balance = Math.max(0, invoice.grandTotal - invoice.amountPaid);

  const statusStyle =
    invoice.status === 'PAID'
      ? styles.statusPaid
      : invoice.status === 'PARTIAL'
      ? styles.statusPartial
      : styles.statusPending;

  const fmtCurrency = (n) => `Rs.${Number(n).toFixed(2)}`;
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <Document
      title={`Invoice ${invoice.invoiceNum} - ${shop.businessName}`}
      author={shop.businessName}
      subject="Tax Invoice"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{shop.businessName}</Text>
            {shop.ownerName && <Text style={styles.businessDetail}>Owner: {shop.ownerName}</Text>}
            {shop.address && <Text style={styles.businessDetail}>{shop.address}</Text>}
            {shop.phone && <Text style={styles.businessDetail}>Phone: {shop.phone}</Text>}
            {shop.email && <Text style={styles.businessDetail}>Email: {shop.email}</Text>}
            {shop.taxId && <Text style={styles.gstin}>GSTIN: {shop.taxId}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>Tax Invoice</Text>
            <Text style={styles.invoiceNum}>{invoice.invoiceNum}</Text>
            <Text style={styles.invoiceDate}>Date: {fmtDate(invoice.issuedAt)}</Text>
            {invoice.dueDate && (
              <Text style={styles.invoiceDate}>Due: {fmtDate(invoice.dueDate)}</Text>
            )}
            <View style={[styles.statusBadge, statusStyle]}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* Bill To + Payment Terms */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoName}>{customer.name}</Text>
            <Text style={styles.infoDetail}>Phone: {customer.phone}</Text>
            {customer.email && <Text style={styles.infoDetail}>Email: {customer.email}</Text>}
            {customer.address && <Text style={styles.infoDetail}>{customer.address}</Text>}
            {customer.gstNumber && (
              <Text style={[styles.infoDetail, { fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 3 }]}>
                GSTIN: {customer.gstNumber}
              </Text>
            )}
          </View>

          <View style={styles.termsBox}>
            <Text style={styles.infoLabel}>Payment Info</Text>
            <Text style={styles.infoDetail}>
              Terms: {TERMS_LABEL[invoice.paymentTerms] ?? invoice.paymentTerms ?? 'Immediate'}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.infoDetail}>Due Date: {fmtDate(invoice.dueDate)}</Text>
            )}
            {shop.bankName && (
              <>
                <Text style={[styles.infoDetail, { marginTop: 6 }]}>Bank: {shop.bankName}</Text>
                {shop.accountNum && <Text style={styles.infoDetail}>A/c: {shop.accountNum}</Text>}
                {shop.ifscCode && <Text style={styles.infoDetail}>IFSC: {shop.ifscCode}</Text>}
              </>
            )}
            {shop.upiId && <Text style={styles.infoDetail}>UPI: {shop.upiId}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colItem]}>Item & Description</Text>
            <Text style={[styles.th, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colTax]}>Tax %</Text>
            <Text style={[styles.th, styles.colTotal]}>Amount</Text>
          </View>

          {items.map((item, idx) => (
            <View key={item.id ?? idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={styles.colItem}>
                <Text style={styles.tdBold}>{item.product?.name ?? 'Item'}</Text>
                {item.product?.isService && <Text style={styles.serviceTag}>Service</Text>}
              </View>
              <Text style={[styles.td, styles.colPrice]}>{fmtCurrency(item.unitPrice)}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colTax]}>{item.product?.taxRate ?? 0}%</Text>
              <Text style={[styles.tdBold, styles.colTotal]}>
                {fmtCurrency(item.quantity * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <Text style={styles.footerMessage}>
            {shop.footerMessage ?? 'Thank you for your business!'}
          </Text>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmtCurrency(subtotal)}</Text>
            </View>

            {invoice.discountPercentage > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount ({invoice.discountPercentage}%)</Text>
                <Text style={styles.discountValue}>-{fmtCurrency(discountAmount)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST Tax</Text>
              <Text style={styles.totalValue}>{fmtCurrency(invoice.totalTax)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{fmtCurrency(invoice.grandTotal)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={styles.paidValue}>{fmtCurrency(invoice.amountPaid)}</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Due</Text>
              <Text style={styles.balanceValue}>{fmtCurrency(balance)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>{shop.businessName}</Text>
            <Text style={styles.signatureRole}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
