import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PersonalExpense } from '@/types/personal-expenses';

const PRIMARY_COLOR = '#0f172a'; // Slate 900
const BRAND_INDIGO = '#4f46e5'; // Indigo 600
const ACCENT_BG = '#f8fafc'; // Slate 50
const CARD_BG = '#f1f5f9'; // Slate 100
const BORDER_COLOR = '#e2e8f0'; // Slate 200
const TEXT_MUTED = '#64748b'; // Slate 500
const TEXT_DARK = '#0f172a'; // Slate 900
const EMERALD = '#047857'; // Green 700
const AMBER = '#b45309'; // Amber 700

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_INDIGO,
    paddingBottom: 14,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  expenseNumberBadge: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eef2ff',
    color: BRAND_INDIGO,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  metaDate: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  // Hero Amount Card
  heroCard: {
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_INDIGO,
    marginTop: 4,
  },
  statusBadgePaid: {
    backgroundColor: '#dcfce7',
    color: EMERALD,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
    color: AMBER,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  // Details Section
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  colHalf: {
    width: '50%',
    paddingVertical: 6,
    paddingRight: 10,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10.5,
    color: TEXT_DARK,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValueNormal: {
    fontSize: 9.5,
    color: TEXT_DARK,
  },
  // Notes Box
  notesBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
  },
  // Documents Box
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  docName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_INDIGO,
  },
  docSize: {
    fontSize: 8,
    color: TEXT_MUTED,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
});

function formatInr(val: number): string {
  return `INR ${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface PersonalExpenseVoucherPDFProps {
  expense: PersonalExpense;
  userName?: string;
}

export function PersonalExpenseVoucherPDF({ expense, userName }: PersonalExpenseVoucherPDFProps) {
  const isPaid = expense.payment_status === 'Paid';
  const documents = expense.documents || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>PERSONAL EXPENSE</Text>
            <Text style={styles.headerSubtitle}>
              Personal Expense Record & Payment Voucher
            </Text>
            {userName ? (
              <Text style={{ fontSize: 8.5, color: TEXT_MUTED, marginTop: 4 }}>
                Prepared for: {userName}
              </Text>
            ) : null}
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.expenseNumberBadge}>{expense.expense_number}</Text>
            <Text style={styles.metaDate}>Date: {expense.expense_date}</Text>
          </View>
        </View>

        {/* Hero Amount Card */}
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.amountLabel}>Total Expense Amount</Text>
            <Text style={styles.amountValue}>{formatInr(expense.amount)}</Text>
            {expense.payment_status === 'Partially Paid' ? (
              <Text style={{ fontSize: 8.5, color: TEXT_MUTED, marginTop: 3 }}>
                Paid: {formatInr(expense.paid_amount)} · Pending: {formatInr(expense.pending_amount)}
              </Text>
            ) : null}
          </View>
          <View>
            <Text style={isPaid ? styles.statusBadgePaid : styles.statusBadgePending}>
              {expense.payment_status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <Text style={styles.sectionTitle}>Expense Details</Text>
        <View style={styles.grid}>
          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Text style={styles.fieldValue}>
              {expense.category_name}
              {expense.subcategory_name ? ` › ${expense.subcategory_name}` : ''}
            </Text>
          </View>

          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>Paid To / Merchant</Text>
            <Text style={styles.fieldValue}>{expense.paid_to || '—'}</Text>
          </View>

          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <Text style={styles.fieldValueNormal}>{expense.payment_method}</Text>
          </View>

          <View style={styles.colHalf}>
            <Text style={styles.fieldLabel}>Payment Status</Text>
            <Text style={styles.fieldValueNormal}>{expense.payment_status}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>{expense.description}</Text>
        </View>

        {/* Notes */}
        {expense.notes ? (
          <>
            <Text style={styles.sectionTitle}>Personal Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{expense.notes}</Text>
            </View>
          </>
        ) : null}

        {/* Attachments Section */}
        {documents.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Attached Bills & Documents ({documents.length})
            </Text>
            <View style={{ marginBottom: 16 }}>
              {documents.map((doc, idx) => (
                <View key={doc.id || idx} style={styles.docItem}>
                  <Text style={styles.docName}>• {doc.file_name}</Text>
                  <Text style={styles.docSize}>
                    {(doc.file_size / 1024).toFixed(1)} KB ({doc.file_type || 'File'})
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Personal & Household Expense Record · Not for Company Accounting
          </Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString('en-IN')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
