import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CompleteYearEndReportData } from '@/types';

const PRIMARY_COLOR = '#0F172A'; // Slate 900
const BRAND_BLUE = '#1E3A8A'; // Blue 900
const ACCENT_BG = '#F8FAFC'; // Slate 50
const CARD_BG = '#F1F5F9'; // Slate 100
const BORDER_COLOR = '#CBD5E1'; // Slate 300
const TEXT_MUTED = '#64748B'; // Slate 500
const TEXT_DARK = '#0F172A'; // Slate 900
const EMERALD = '#047857'; // Green 700
const AMBER = '#B45309'; // Amber 700
const ROSE = '#BE123C'; // Rose 700

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_DARK,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
    paddingBottom: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  companySubtext: {
    fontSize: 8.5,
    color: TEXT_MUTED,
    marginTop: 2,
    lineHeight: 1.3,
  },
  reportBadgeContainer: {
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
  },
  fyBadge: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#E0E7FF',
    color: '#3730A3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 3,
  },
  generatedDate: {
    fontSize: 7.5,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_BLUE,
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
    width: '19%',
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 5,
    padding: 6,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 10,
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
  },
  tableHeaderCol: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 8,
    color: TEXT_DARK,
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },
  tableCellMuted: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  // Checklist
  checklistCard: {
    backgroundColor: ACCENT_BG,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  checkIcon: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: EMERALD,
    width: 14,
  },
  warnIcon: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
    width: 14,
  },
  checklistText: {
    fontSize: 8,
    color: TEXT_DARK,
  },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
  signatoryContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatoryBlock: {
    width: 180,
    alignItems: 'center',
  },
  stampBox: {
    height: 48,
  },
  signLine: {
    width: 160,
    borderTopWidth: 1,
    borderTopColor: PRIMARY_COLOR,
    marginBottom: 3,
  },
  signTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  signSub: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
});

function formatInr(val: number): string {
  return `₹${Math.round(val || 0).toLocaleString('en-IN')}`;
}

export function YearEndClosingReportPDF({ data }: { data: CompleteYearEndReportData }) {
  const {
    company,
    financialYear,
    dateRange,
    generatedAt,
    executiveSummary,
    salesSummary,
    purchaseSummary,
    expenseSummary,
    gstSummary,
    stockSummary,
    customerSummary,
    supplierSummary,
    employeeSummary,
    documentSummary,
    checklist,
  } = data;

  const formattedDate = new Date(generatedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Document>
      {/* =========================================================================
          PAGE 1: COVER, EXECUTIVE SUMMARY, SALES & PURCHASES
          ========================================================================= */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ maxWidth: '60%' }}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companySubtext}>
              {[company.address, company.city, company.state, company.pincode].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.companySubtext}>
              {company.gstin ? `GSTIN: ${company.gstin}` : ''}
              {company.pan ? `  ·  PAN: ${company.pan}` : ''}
              {company.phone ? `  ·  Phone: ${company.phone}` : ''}
            </Text>
          </View>
          <View style={styles.reportBadgeContainer}>
            <Text style={styles.reportTitle}>ANNUAL AUDIT REPORT</Text>
            <Text style={styles.fyBadge}>
              {financialYear.startsWith('FY') ? financialYear : `FY ${financialYear}`}
            </Text>
            <Text style={styles.generatedDate}>Period: {dateRange.start} to {dateRange.end}</Text>
            <Text style={styles.generatedDate}>Generated: {formattedDate}</Text>
          </View>
        </View>

        {/* 1. Executive Summary Cards */}
        <Text style={styles.sectionTitle}>1. Executive Financial Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Sales</Text>
            <Text style={[styles.kpiValue, { color: EMERALD }]}>{formatInr(executiveSummary.totalSales)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Purchases</Text>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{formatInr(executiveSummary.totalPurchases)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Company Expenses</Text>
            <Text style={[styles.kpiValue, { color: AMBER }]}>{formatInr(executiveSummary.totalExpenses)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Receivables</Text>
            <Text style={[styles.kpiValue, { color: ROSE }]}>{formatInr(executiveSummary.totalReceivables)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Payables</Text>
            <Text style={[styles.kpiValue, { color: ROSE }]}>{formatInr(executiveSummary.totalPayables)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Input GST (ITC)</Text>
            <Text style={styles.kpiValue}>{formatInr(executiveSummary.totalInputGst)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Output GST</Text>
            <Text style={styles.kpiValue}>{formatInr(executiveSummary.totalOutputGst)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Net GST Position</Text>
            <Text style={[styles.kpiValue, { color: executiveSummary.netGstPosition > 0 ? ROSE : EMERALD }]}>
              {executiveSummary.netGstPosition > 0 ? `+${formatInr(executiveSummary.netGstPosition)} (Pay)` : `${formatInr(Math.abs(executiveSummary.netGstPosition))} (ITC)`}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Opening Stock</Text>
            <Text style={styles.kpiValue}>{Math.round(executiveSummary.openingStockTaka)} Taka</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Closing Stock</Text>
            <Text style={[styles.kpiValue, { color: EMERALD }]}>{Math.round(executiveSummary.closingStockTaka)} Taka</Text>
          </View>
        </View>

        {/* 2. Sales Summary */}
        <Text style={styles.sectionTitle}>2. Sales & Revenue Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Total Invoices</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Taxable Sales</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Total Output GST</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'right' }]}>Grand Sales Total</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { width: '25%' }]}>{salesSummary.totalInvoices} Invoices</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{formatInr(salesSummary.taxableSales)}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{formatInr(salesSummary.totalGst)}</Text>
            <Text style={[styles.tableCellBold, { width: '25%', textAlign: 'right', color: EMERALD }]}>
              {formatInr(salesSummary.totalSales)}
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>Breakdown:</Text>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>CGST: {formatInr(salesSummary.cgst)}</Text>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>SGST: {formatInr(salesSummary.sgst)}</Text>
            <Text style={[styles.tableCellMuted, { width: '25%', textAlign: 'right' }]}>IGST: {formatInr(salesSummary.igst)}</Text>
          </View>
        </View>

        {/* 3. Purchases Summary */}
        <Text style={styles.sectionTitle}>3. Purchase Bills Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Total Purchase Bills</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Taxable Purchases</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%' }]}>Input GST (ITC)</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'right' }]}>Grand Purchases</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { width: '25%' }]}>{purchaseSummary.totalPurchaseBills} Bills</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{formatInr(purchaseSummary.taxablePurchases)}</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{formatInr(purchaseSummary.inputGst)}</Text>
            <Text style={[styles.tableCellBold, { width: '25%', textAlign: 'right', color: '#2563EB' }]}>
              {formatInr(purchaseSummary.totalPurchases)}
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>Breakdown:</Text>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>CGST: {formatInr(purchaseSummary.cgst)}</Text>
            <Text style={[styles.tableCellMuted, { width: '25%' }]}>SGST: {formatInr(purchaseSummary.sgst)}</Text>
            <Text style={[styles.tableCellMuted, { width: '25%', textAlign: 'right' }]}>IGST: {formatInr(purchaseSummary.igst)}</Text>
          </View>
        </View>

        {/* 4. GST Position Reconciliation */}
        <Text style={styles.sectionTitle}>4. GST Tax Liability & ITC Reconciliation</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '30%' }]}>Component</Text>
            <Text style={[styles.tableHeaderCol, { width: '18%', textAlign: 'right' }]}>CGST</Text>
            <Text style={[styles.tableHeaderCol, { width: '18%', textAlign: 'right' }]}>SGST</Text>
            <Text style={[styles.tableHeaderCol, { width: '18%', textAlign: 'right' }]}>IGST</Text>
            <Text style={[styles.tableHeaderCol, { width: '16%', textAlign: 'right' }]}>Total GST</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '30%' }]}>Total Input Tax Credit (ITC)</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.inputCgst)}</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.inputSgst)}</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.inputIgst)}</Text>
            <Text style={[styles.tableCellBold, { width: '16%', textAlign: 'right', color: EMERALD }]}>{formatInr(gstSummary.totalInputGst)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { width: '30%' }]}>Total Output Tax Liability</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.outputCgst)}</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.outputSgst)}</Text>
            <Text style={[styles.tableCell, { width: '18%', textAlign: 'right' }]}>{formatInr(gstSummary.outputIgst)}</Text>
            <Text style={[styles.tableCellBold, { width: '16%', textAlign: 'right', color: ROSE }]}>{formatInr(gstSummary.totalOutputGst)}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#EEF2F6' }]}>
            <Text style={[styles.tableCellBold, { width: '50%' }]}>Net Position (Output - Input):</Text>
            <Text style={[styles.tableCellBold, { width: '50%', textAlign: 'right', color: gstSummary.netGstPosition > 0 ? ROSE : EMERALD }]}>
              {gstSummary.netGstPosition > 0
                ? `${formatInr(gstSummary.netGstPosition)} (Payable to Government)`
                : `${formatInr(Math.abs(gstSummary.netGstPosition))} (Net ITC Available / Carried Forward)`}
            </Text>
          </View>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>{company.name} · Annual Report · {financialYear}</Text>
          <Text style={styles.footerText}>Page 1 of 3</Text>
        </View>
      </Page>

      {/* =========================================================================
          PAGE 2: EXPENSES, STOCK & DOCUMENT VAULT
          ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={[styles.companyName, { fontSize: 14 }]}>{company.name}</Text>
            <Text style={styles.companySubtext}>Financial Year {financialYear} · Detailed Audit Schedules</Text>
          </View>
          <Text style={styles.fyBadge}>Page 2</Text>
        </View>

        {/* 5. Expense Categories */}
        <Text style={styles.sectionTitle}>5. Company Expenses by Category</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '45%' }]}>Expense Category</Text>
            <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'center' }]}>Entries</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>GST (ITC)</Text>
            <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'right' }]}>Total Amount</Text>
          </View>
          {expenseSummary.categories.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellMuted, { width: '100%', textAlign: 'center' }]}>
                No expenses recorded for this financial year.
              </Text>
            </View>
          ) : (
            expenseSummary.categories.map((c, i) => (
              <View key={c.categoryName} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '45%' }]}>{c.categoryName}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>{c.count}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatInr(c.gstAmount)}</Text>
                <Text style={[styles.tableCellBold, { width: '20%', textAlign: 'right' }]}>{formatInr(c.totalAmount)}</Text>
              </View>
            ))
          )}
          <View style={[styles.tableRow, { backgroundColor: '#EEF2F6' }]}>
            <Text style={[styles.tableCellBold, { width: '45%' }]}>Total Expenses</Text>
            <Text style={[styles.tableCellBold, { width: '20%', textAlign: 'center' }]}>
              {expenseSummary.categories.reduce((acc, x) => acc + x.count, 0)}
            </Text>
            <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right' }]}>{formatInr(expenseSummary.totalGst)}</Text>
            <Text style={[styles.tableCellBold, { width: '20%', textAlign: 'right', color: AMBER }]}>
              {formatInr(expenseSummary.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* 6. Stock Position */}
        <Text style={styles.sectionTitle}>6. Stock Inventory Summary</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '40%' }]}>Quality / Item</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>Opening</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>Purchased/Mfg</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>Sold</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'right' }]}>Closing Balance</Text>
          </View>
          {stockSummary.items.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellMuted, { width: '100%', textAlign: 'center' }]}>
                No stock inventory records found.
              </Text>
            </View>
          ) : (
            stockSummary.items.slice(0, 10).map((item, i) => (
              <View key={item.qualityName} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{item.qualityName}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{item.openingTaka} Taka</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{item.purchasedTaka} Taka</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{item.soldTaka} Taka</Text>
                <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right', color: EMERALD }]}>
                  {item.closingTaka} Taka
                </Text>
              </View>
            ))
          )}
          <View style={[styles.tableRow, { backgroundColor: '#EEF2F6' }]}>
            <Text style={[styles.tableCellBold, { width: '40%' }]}>Inventory Totals</Text>
            <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right' }]}>{Math.round(stockSummary.totalOpeningTaka)} Taka</Text>
            <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right' }]}>—</Text>
            <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right' }]}>{Math.round(stockSummary.totalSoldTaka)} Taka</Text>
            <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'right', color: EMERALD }]}>
              {Math.round(stockSummary.totalClosingTaka)} Taka
            </Text>
          </View>
        </View>

        {/* 7. Document Vault Status & HR Summary */}
        <Text style={styles.sectionTitle}>7. Digital Document Vault & Workforce Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { width: '23%' }]}>
            <Text style={styles.kpiLabel}>Purchase Bills</Text>
            <Text style={styles.kpiValue}>{documentSummary.totalPurchaseBills}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '23%' }]}>
            <Text style={styles.kpiLabel}>Bills Uploaded</Text>
            <Text style={[styles.kpiValue, { color: EMERALD }]}>{documentSummary.uploadedPurchaseDocs}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '23%' }]}>
            <Text style={styles.kpiLabel}>Missing Attachments</Text>
            <Text style={[styles.kpiValue, { color: documentSummary.missingPurchaseDocs > 0 ? ROSE : EMERALD }]}>
              {documentSummary.missingPurchaseDocs}
            </Text>
          </View>
          <View style={[styles.kpiCard, { width: '23%' }]}>
            <Text style={styles.kpiLabel}>Expense Receipts</Text>
            <Text style={styles.kpiValue}>{documentSummary.expenseDocsCount}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '31%' }]}>
            <Text style={styles.kpiLabel}>Active Employees</Text>
            <Text style={styles.kpiValue}>{employeeSummary.totalEmployees}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '31%' }]}>
            <Text style={styles.kpiLabel}>Salary Slips Generated</Text>
            <Text style={styles.kpiValue}>{employeeSummary.salarySlipsGenerated}</Text>
          </View>
          <View style={[styles.kpiCard, { width: '32%' }]}>
            <Text style={styles.kpiLabel}>Total Salary Disbursed</Text>
            <Text style={[styles.kpiValue, { color: PRIMARY_COLOR }]}>{formatInr(employeeSummary.totalSalaryPaid)}</Text>
          </View>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>{company.name} · Annual Report · {financialYear}</Text>
          <Text style={styles.footerText}>Page 2 of 3</Text>
        </View>
      </Page>

      {/* =========================================================================
          PAGE 3: CUSTOMERS, SUPPLIERS & AUDIT CHECKLIST
          ========================================================================= */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={[styles.companyName, { fontSize: 14 }]}>{company.name}</Text>
            <Text style={styles.companySubtext}>Parties Outstanding & Audit Verification · FY {financialYear}</Text>
          </View>
          <Text style={styles.fyBadge}>Page 3</Text>
        </View>

        {/* 8. Top Customers & Receivables */}
        <Text style={styles.sectionTitle}>8. Customer Receivables Schedule</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '40%' }]}>Customer</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'center' }]}>Invoices</Text>
            <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'right' }]}>Total Billed</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'right' }]}>Outstanding Due</Text>
          </View>
          {customerSummary.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellMuted, { width: '100%', textAlign: 'center' }]}>No customer invoices recorded.</Text>
            </View>
          ) : (
            customerSummary.slice(0, 7).map((c, i) => (
              <View key={c.customerName} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{c.customerName}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{c.invoicesCount}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatInr(c.totalSales)}</Text>
                <Text style={[styles.tableCellBold, { width: '25%', textAlign: 'right', color: c.outstanding > 0 ? ROSE : EMERALD }]}>
                  {formatInr(c.outstanding)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 9. Top Suppliers & Payables */}
        <Text style={styles.sectionTitle}>9. Supplier Payables Schedule</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '40%' }]}>Supplier / Vendor</Text>
            <Text style={[styles.tableHeaderCol, { width: '15%', textAlign: 'center' }]}>Bills</Text>
            <Text style={[styles.tableHeaderCol, { width: '20%', textAlign: 'right' }]}>Total Purchases</Text>
            <Text style={[styles.tableHeaderCol, { width: '25%', textAlign: 'right' }]}>Balance Payable</Text>
          </View>
          {supplierSummary.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellMuted, { width: '100%', textAlign: 'center' }]}>No supplier purchases recorded.</Text>
            </View>
          ) : (
            supplierSummary.slice(0, 7).map((s, i) => (
              <View key={s.supplierName} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{s.supplierName}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{s.billsCount}</Text>
                <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>{formatInr(s.totalPurchases)}</Text>
                <Text style={[styles.tableCellBold, { width: '25%', textAlign: 'right', color: s.outstanding > 0 ? ROSE : EMERALD }]}>
                  {formatInr(s.outstanding)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 10. Audit Verification Checklist */}
        <Text style={styles.sectionTitle}>10. March Closing Verification & Audit Checklist</Text>
        <View style={styles.checklistCard}>
          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.checklistText}>Sales Invoices reconciled against delivery challans and bank statements.</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.checklistText}>Purchase bills verified with supplier GSTINs and input tax credit accounts.</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.checklistText}>Operating expenses categorized and GST tax credits factored into filing.</Text>
          </View>
          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✓</Text>
            <Text style={styles.checklistText}>Physical stock Taka matched against digital system inventory records.</Text>
          </View>

          {checklist.actionableIssues.length > 0 ? (
            <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: BORDER_COLOR, paddingTop: 4 }}>
              <Text style={[styles.kpiLabel, { color: AMBER, marginBottom: 2 }]}>Outstanding Audit Issues:</Text>
              {checklist.actionableIssues.map((issue, idx) => (
                <View key={idx} style={styles.checklistItem}>
                  <Text style={styles.warnIcon}>⚠</Text>
                  <Text style={[styles.checklistText, { color: AMBER }]}>{issue}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.checklistItem, { marginTop: 4 }]}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={[styles.checklistText, { color: EMERALD, fontFamily: 'Helvetica-Bold' }]}>
                Zero critical audit alerts. Books ready for financial year closure.
              </Text>
            </View>
          )}
        </View>

        {/* Signatory block */}
        <View style={styles.signatoryContainer}>
          <View style={styles.signatoryBlock}>
            <Text style={styles.signTitle}>For {company.name}</Text>
            <View style={styles.stampBox} />
            <View style={styles.signLine} />
            <Text style={styles.signTitle}>Authorized Signatory</Text>
            <Text style={styles.signSub}>Certified Correct as per Books of Accounts</Text>
          </View>
        </View>

        <View style={styles.pageFooter}>
          <Text style={styles.footerText}>{company.name} · Annual Report · {financialYear}</Text>
          <Text style={styles.footerText}>Page 3 of 3</Text>
        </View>
      </Page>
    </Document>
  );
}
