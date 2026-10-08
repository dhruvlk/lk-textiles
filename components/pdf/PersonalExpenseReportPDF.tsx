import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { PersonalExpense } from '@/types/personal-expenses';

const PRIMARY_COLOR = '#0f172a'; // Slate 900
const BRAND_INDIGO = '#4f46e5'; // Indigo 600
const ACCENT_BG = '#f8fafc'; // Slate 50
const CARD_BG = '#f1f5f9'; // Slate 100
const BORDER_COLOR = '#cbd5e1'; // Slate 300
const TEXT_MUTED = '#64748b'; // Slate 500
const TEXT_DARK = '#0f172a'; // Slate 900

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_INDIGO,
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  reportSubtitle: {
    fontSize: 9,
    color: BRAND_INDIGO,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  preparedFor: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  generatedDate: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_INDIGO,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 3,
  },
  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    padding: 6,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    marginTop: 3,
    color: PRIMARY_COLOR,
  },
  // Tables
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableHeaderCol: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 7.5,
    color: TEXT_DARK,
  },
  tableCellBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  tableCellRight: {
    fontSize: 7.5,
    textAlign: 'right',
    color: TEXT_DARK,
  },
  tableCellRightBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: TEXT_DARK,
  },
  totalCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 5,
    padding: 8,
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_INDIGO,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_INDIGO,
  },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
});

function formatInr(val: number): string {
  return `INR ${Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface PersonalReportData {
  reportTitle: string; // e.g. "Personal Expense Report"
  periodLabel: string; // e.g. "October 2026", "Financial Year 2026–27", "Calendar Year 2026"
  userName?: string;
  summaryKpis: Array<{
    label: string;
    value: string;
  }>;
  categoryBreakdown?: Array<{
    categoryName: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  monthlyBreakdown?: Array<{
    monthName: string;
    count: number;
    totalAmount: number;
  }>;
  expenses: PersonalExpense[];
  totalAmount: number;
}

export function PersonalExpenseReportPDF({ data }: { data: PersonalReportData }) {
  const {
    reportTitle,
    periodLabel,
    userName,
    summaryKpis,
    categoryBreakdown,
    monthlyBreakdown,
    expenses,
    totalAmount,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.reportTitle}>{reportTitle}</Text>
            <Text style={styles.reportSubtitle}>{periodLabel}</Text>
          </View>
          <View style={styles.metaContainer}>
            {userName ? (
              <Text style={styles.preparedFor}>Prepared for: {userName}</Text>
            ) : null}
            <Text style={styles.generatedDate}>
              Generated on: {new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Summary KPIs Grid */}
        <View style={styles.kpiGrid}>
          {summaryKpis.map((kpi, idx) => (
            <View key={idx} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
            </View>
          ))}
        </View>

        {/* Category Summary */}
        {categoryBreakdown && categoryBreakdown.length > 0 ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Category Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '45%' }]}>Category</Text>
                <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'center' }]}>
                  Transactions
                </Text>
                <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'right' }]}>
                  Total Amount
                </Text>
                <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>
                  Share
                </Text>
              </View>
              {categoryBreakdown.map((cat, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? { backgroundColor: '#fcfcfc' } : {},
                  ]}
                >
                  <Text style={[styles.tableCellBold, { width: '45%' }]}>
                    {cat.categoryName}
                  </Text>
                  <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>
                    {cat.count}
                  </Text>
                  <Text style={[styles.tableCellRight, { width: '20%' }]}>
                    {formatInr(cat.totalAmount)}
                  </Text>
                  <Text style={[styles.tableCellRight, { width: '15%' }]}>
                    {cat.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Monthly Summary (if Yearly Report) */}
        {monthlyBreakdown && monthlyBreakdown.length > 0 ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '50%' }]}>Month</Text>
                <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'center' }]}>
                  Transactions
                </Text>
                <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'right' }]}>
                  Amount
                </Text>
              </View>
              {monthlyBreakdown.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? { backgroundColor: '#fcfcfc' } : {},
                  ]}
                >
                  <Text style={[styles.tableCellBold, { width: '50%' }]}>{m.monthName}</Text>
                  <Text style={[styles.tableCell, { width: '25%', textAlign: 'center' }]}>
                    {m.count}
                  </Text>
                  <Text style={[styles.tableCellRight, { width: '25%' }]}>
                    {formatInr(m.totalAmount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Detailed Transactions */}
        <Text style={styles.sectionTitle}>
          Expense Details ({expenses.length} Transactions)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '13%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCol, { width: '14%' }]}>Number</Text>
            <Text style={[styles.tableHeaderCol, { width: '20%' }]}>Category</Text>
            <Text style={[styles.tableHeaderCol, { width: '23%' }]}>Description</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%' }]}>Paid To</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>
              Amount
            </Text>
          </View>
          {expenses.map((exp, idx) => (
            <View
              key={exp.id || idx}
              style={[
                styles.tableRow,
                idx % 2 === 1 ? { backgroundColor: '#fcfcfc' } : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.tableCell, { width: '13%' }]}>{exp.expense_date}</Text>
              <Text style={[styles.tableCellBold, { width: '14%' }]}>
                {exp.expense_number}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>
                {exp.category_name}
                {exp.subcategory_name ? ` (${exp.subcategory_name})` : ''}
              </Text>
              <Text style={[styles.tableCell, { width: '23%' }]}>{exp.description}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>{exp.paid_to || '—'}</Text>
              <Text style={[styles.tableCellRightBold, { width: '15%' }]}>
                {formatInr(exp.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total Box */}
        <View style={styles.totalCard} wrap={false}>
          <Text style={styles.totalLabel}>TOTAL PERSONAL EXPENSES</Text>
          <Text style={styles.totalValue}>{formatInr(totalAmount)}</Text>
        </View>

        {/* Page Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>
            Personal & Household Expense Record · Not for Company Accounting
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
