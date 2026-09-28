import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Polygon } from '@react-pdf/renderer';
import { Company, SalarySlip, MultiMonthSummaryData } from '@/types';
import { numberToWords } from '@/lib/number-to-words';
import { formatCompanyAddress } from '@/lib/pdf-utils';
import { generateSalaryRevisionNotes } from '@/lib/salary-revision-notes';
import { SalarySlipPage, salarySlipAuthorization, salarySlipTypography } from '@/components/pdf/SalarySlipPDF';
import { CompanyWatermark } from '@/components/pdf/common/CompanyWatermark';

// Register Gujarati font for traditional header
const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process.cwd);
const gujaratiRegular = isNode
  ? `${process.cwd().replace(/\\/g, '/')}/public/fonts/NotoSansGujarati-Regular.ttf`
  : '/fonts/NotoSansGujarati-Regular.ttf';
const gujaratiBold = isNode
  ? `${process.cwd().replace(/\\/g, '/')}/public/fonts/NotoSansGujarati-Bold.ttf`
  : '/fonts/NotoSansGujarati-Bold.ttf';

Font.register({
  family: 'Gujarati',
  fonts: [
    { src: gujaratiRegular },
    { src: gujaratiBold, fontWeight: 'bold' },
  ],
});

export const PRIMARY_COLOR = '#0C1E40'; // Deep Navy Blue
export const SECONDARY_COLOR = '#C89B53'; // Warm Gold
export const BEIGE_BG = '#EDE4D3'; // Table Header Beige
export const CREAM_BG = '#FAF7F2'; // Net Salary Cream
export const LIGHT_BLUE_GRAY = '#EDF1F7'; // Section Header Bar
export const BORDER_COLOR = '#DCE2EA'; // Subtle Gray-Blue Border
export const TEXT_DARK = '#111827';
export const TEXT_MUTED = '#4B5563';

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      fill={PRIMARY_COLOR}
    />
  </Svg>
);

const PinIcon = () => (
  <Svg viewBox="0 0 24 24" width="9" height="9">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5-2.5 2.5-1.12 2.5-2.5 2.5z"
      fill={PRIMARY_COLOR}
    />
  </Svg>
);

const FlankedDiamonds = () => (
  <View style={styles.diamondsRow}>
    <View style={styles.diamondLine} />
    <Svg viewBox="0 0 40 8" width="34" height="7" style={styles.diamondSvg}>
      <Polygon points="8,4 12,1 16,4 12,7" fill="#C89B53" />
      <Polygon points="18,4 22,1 26,4 22,7" fill="#C89B53" />
      <Polygon points="28,4 32,1 36,4 32,7" fill="#C89B53" />
    </Svg>
    <View style={styles.diamondLine} />
  </View>
);

const NoteIcon = () => (
  <Svg viewBox="0 0 24 24" width="13" height="13">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      fill="none"
      stroke={PRIMARY_COLOR}
      strokeWidth="1.5"
    />
    <Path
      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
      stroke={PRIMARY_COLOR}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

const TopAccentBar = () => (
  <View style={styles.topAccent}>
    <View style={styles.topAccentNavy} />
    <View style={styles.topAccentGold} />
  </View>
);

const BottomWave = () => (
  <Svg viewBox="0 0 595 55" width="595" height="55" style={styles.bottomWaveSvg}>
    <Path
      d="M0,55 L595,55 L595,22 C485,48 380,16 280,36 C180,52 90,22 0,38 Z"
      fill="#F5EDE1"
      opacity="0.65"
    />
    <Path
      d="M0,55 L595,55 L595,32 C500,50 400,26 300,42 C200,54 100,30 0,44 Z"
      fill="#EFE4D4"
      opacity="0.85"
    />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#FFFFFF',
    padding: 0,
    color: TEXT_DARK,
    position: 'relative',
  },
  pageBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E6ED',
    margin: 10,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 14,
    width: 22,
    height: 72,
    flexDirection: 'row',
    zIndex: 10,
  },
  topAccentNavy: {
    width: 15,
    height: 72,
    backgroundColor: PRIMARY_COLOR,
  },
  topAccentGold: {
    width: 4,
    height: 72,
    backgroundColor: SECONDARY_COLOR,
    marginLeft: 2.5,
  },

  // COMPANY HEADER
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  phoneRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 3,
  },
  phoneText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    marginLeft: 4.5,
  },
  companyName: {
    fontSize: 31,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 10.5,
    fontFamily: 'Helvetica',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 2,
  },
  diamondsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  diamondLine: {
    width: 55,
    height: 0.75,
    backgroundColor: '#D6C19D',
  },
  diamondSvg: {
    marginHorizontal: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#374151',
    marginLeft: 4,
  },

  // DOCUMENT HEADER
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 7,
    marginBottom: 8,
  },
  docTitle: {
    ...salarySlipTypography.docTitle,
    color: PRIMARY_COLOR,
  },
  docPeriodCol: {
    alignItems: 'flex-end',
  },
  docPeriodText: {
    ...salarySlipTypography.docPeriod,
    color: PRIMARY_COLOR,
  },
  docPeriodLabel: {
    ...salarySlipTypography.docPeriodLabel,
    color: '#6B7280',
    marginTop: 1,
  },

  // EMPLOYEE DETAILS
  empSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  empCard: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  empCardHeader: {
    backgroundColor: LIGHT_BLUE_GRAY,
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  empCardHeaderText: {
    ...salarySlipTypography.empCardHeader,
    color: PRIMARY_COLOR,
  },
  empCardBody: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5.5,
  },
  empLabel: {
    width: 95,
    ...salarySlipTypography.empLabel,
    color: TEXT_MUTED,
  },
  empColon: {
    width: 14,
    ...salarySlipTypography.empColon,
    color: TEXT_MUTED,
  },
  empValue: {
    flex: 1,
    ...salarySlipTypography.empValue,
    color: TEXT_DARK,
  },

  // BREAKDOWN TABLE
  tableSection: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  tableHeader: {
    backgroundColor: LIGHT_BLUE_GRAY,
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  tableHeaderText: {
    ...salarySlipTypography.tableHeader,
    color: PRIMARY_COLOR,
  },
  tableHeadRow: {
    flexDirection: 'row',
    backgroundColor: BEIGE_BG,
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CEBE',
  },
  tableHeadMonth: {
    width: '28%',
    ...salarySlipTypography.tableHead,
    color: PRIMARY_COLOR,
  },
  tableHeadBasic: {
    width: '24%',
    ...salarySlipTypography.tableHead,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableHeadDeduct: {
    width: '24%',
    ...salarySlipTypography.tableHead,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableHeadNet: {
    width: '24%',
    ...salarySlipTypography.tableHead,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 3.8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableDataRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  tableCellMonth: {
    width: '28%',
    ...salarySlipTypography.tableCell,
    color: '#374151',
  },
  tableCellBasic: {
    width: '24%',
    ...salarySlipTypography.tableCell,
    color: TEXT_DARK,
    textAlign: 'right',
  },
  tableCellDeduct: {
    width: '24%',
    ...salarySlipTypography.tableCell,
    color: TEXT_DARK,
    textAlign: 'right',
  },
  tableCellNet: {
    width: '24%',
    ...salarySlipTypography.tableCellBold,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableFooterRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  tableFooterMonth: {
    width: '28%',
    ...salarySlipTypography.tableTotal,
    color: PRIMARY_COLOR,
  },
  tableFooterBasic: {
    width: '24%',
    ...salarySlipTypography.tableTotal,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableFooterDeduct: {
    width: '24%',
    ...salarySlipTypography.tableTotal,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  tableFooterNet: {
    width: '24%',
    ...salarySlipTypography.tableTotal,
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },

  // SUMMARY BOX
  summaryBox: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    borderRadius: 3.5,
    backgroundColor: CREAM_BG,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    ...salarySlipTypography.summaryTitle,
    color: PRIMARY_COLOR,
  },
  summaryAmount: {
    ...salarySlipTypography.summaryAmount,
    color: PRIMARY_COLOR,
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  summarySubText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: TEXT_MUTED,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8DEC9',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryWordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordsLabel: {
    ...salarySlipTypography.wordsLabel,
    color: '#6B7280',
    marginRight: 4,
  },
  wordsValue: {
    ...salarySlipTypography.wordsValue,
    color: PRIMARY_COLOR,
    flex: 1,
  },

  // DYNAMIC NOTE CALLOUT BOX
  noteBox: {
    marginHorizontal: 20,
    backgroundColor: '#F0F4FA',
    borderWidth: 1,
    borderColor: '#D0DCEE',
    borderRadius: 3.5,
    padding: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteIconCol: {
    marginRight: 6,
    marginTop: 1,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    ...salarySlipTypography.noteTitle,
    color: PRIMARY_COLOR,
    marginBottom: 2.5,
  },
  noteLine: {
    ...salarySlipTypography.noteLine,
    color: '#374151',
    marginBottom: 1,
  },

  // AUTHORIZATION FOOTER SECTION
  authFooter: {
    ...salarySlipAuthorization.authFooter,
  },
  authBlock: {
    ...salarySlipAuthorization.authBlock,
  },
  authCompanyHeader: {
    ...salarySlipAuthorization.authCompanyHeader,
  },
  authStampSpace: {
    ...salarySlipAuthorization.authStampSpace,
  },
  authLine: {
    ...salarySlipAuthorization.authLine,
  },
  authSignatoryTitle: {
    ...salarySlipAuthorization.authSignatoryTitle,
  },
  authSignatorySubtitle: {
    ...salarySlipAuthorization.authSignatorySubtitle,
  },

  bottomWaveSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: -1,
  },
});

function formatAmount(val: number | string | null | undefined): string {
  return Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompanyPhone(phone?: string | null): string {
  if (!phone) return '+91 9825121931';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+91')) {
    const rest = trimmed.slice(3).trim();
    return `+91 ${rest}`;
  }
  if (trimmed.startsWith('91') && trimmed.length > 10) {
    const rest = trimmed.slice(2).trim();
    return `+91 ${rest}`;
  }
  return `+91 ${trimmed}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export interface MultiMonthSalarySlipPDFProps {
  summary: MultiMonthSummaryData;
  company: Company;
  mode?: 'summary' | 'detailed';
  detailedSlips?: SalarySlip[];
}

export function MultiMonthSalarySlipPDF({
  summary,
  company,
  mode = 'summary',
  detailedSlips = [],
}: MultiMonthSalarySlipPDFProps) {
  const companyAddress =
    formatCompanyAddress(company) ||
    'Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Surat.';
  const words =
    summary.amountInWords ||
    numberToWords(Math.round(summary.totalNetSalary));

  // If detailed mode, render each slip using SalarySlipPage on its own page
  if (mode === 'detailed' && detailedSlips.length > 0) {
    return (
      <Document
        title={`Salary-Slips-${summary.employeeName.replace(/\s+/g, '_')}-${summary.periodDisplay.replace(/\s+/g, '_')}`}
      >
        {detailedSlips.map((slip) => (
          <SalarySlipPage
            key={slip.id}
            salarySlip={slip}
            company={company}
            variant="single"
          />
        ))}
      </Document>
    );
  }

  // Generate dynamic notes for the statement
  const notesList = generateSalaryRevisionNotes(detailedSlips, summary.notes);

  // Summary Mode: 1-Page Comprehensive Statement
  const isCompact = summary.rows.length > 6;
  const isUltraCompact = summary.rows.length > 9;

  const hasDeductions =
    Number(summary.totalDeductions || 0) > 0 ||
    summary.rows.some((r) => Number(r.totalDeductions || 0) > 0);

  return (
    <Document
      title={`Salary-Statement-${summary.employeeName.replace(/\s+/g, '_')}-${summary.periodDisplay.replace(/\s+/g, '_')}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.pageBorder}>
          {/* Top Left Decorative Accent Stripe */}
          <TopAccentBar />

          {/* Background Watermark */}
          <CompanyWatermark company={company} />

          {/* 1. COMPANY HEADER */}
          <View style={[styles.header, isCompact ? { marginBottom: 2 } : {}]}>
            <View style={styles.phoneRow}>
              <PhoneIcon />
              <Text style={styles.phoneText}>{formatCompanyPhone(company.phone)}</Text>
            </View>

            <Text style={styles.companyName}>{company.name || 'Vaishali Textile'}</Text>
            <Text style={styles.companyTagline}>
              {company.tagline || 'Manufacturers : Art Silk Cloth'}
            </Text>

            <FlankedDiamonds />

            <View style={styles.addressRow}>
              <PinIcon />
              <Text style={styles.addressText}>{companyAddress}</Text>
            </View>
          </View>

          {/* 2. DOCUMENT HEADER */}
          <View style={[styles.docHeader, isCompact ? { marginTop: 4, marginBottom: 4 } : {}]}>
            <Text style={styles.docTitle}>Salary Statement</Text>
            <View style={styles.docPeriodCol}>
              <Text style={styles.docPeriodText}>{summary.periodDisplay}</Text>
              <Text style={styles.docPeriodLabel}>S T A T E M E N T   P E R I O D</Text>
            </View>
          </View>

          {/* 3. EMPLOYEE DETAILS */}
          <View style={[styles.empSection, isCompact ? { marginBottom: 5 } : {}]}>
            <View style={styles.empCard}>
              <View style={[styles.empCardHeader, isCompact ? { paddingVertical: 3 } : {}]}>
                <Text style={styles.empCardHeaderText}>EMPLOYEE DETAILS</Text>
              </View>
              <View style={[styles.empCardBody, isCompact ? { paddingVertical: 4 } : {}]}>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>Employee Name</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{summary.employeeName}</Text>
                </View>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>Joining Date</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{formatDate(summary.joiningDate)}</Text>
                </View>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>PAN Number</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{summary.panNumber || '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. SALARY BREAKDOWN TABLE */}
          <View style={[styles.tableSection, isCompact ? { marginBottom: 5 } : {}]}>
            <View style={[styles.tableHeader, isCompact ? { paddingVertical: 3 } : {}]}>
              <Text style={styles.tableHeaderText}>
                MONTHLY SALARY BREAKDOWN ({summary.rows.length} {summary.rows.length === 1 ? 'MONTH' : 'MONTHS'})
              </Text>
            </View>
            <View style={[styles.tableHeadRow, isUltraCompact ? { paddingVertical: 3 } : {}]}>
              <Text style={[styles.tableHeadMonth, !hasDeductions ? { width: '34%' } : {}]}>Salary Month</Text>
              <Text style={[styles.tableHeadBasic, !hasDeductions ? { width: '33%' } : {}]}>Basic Salary (Rs.)</Text>
              {hasDeductions && <Text style={styles.tableHeadDeduct}>Deductions (Rs.)</Text>}
              <Text style={[styles.tableHeadNet, !hasDeductions ? { width: '33%' } : {}]}>Net Salary (Rs.)</Text>
            </View>
            {summary.rows.map((r, i) => (
              <View
                key={`${r.month}-${r.year}`}
                style={[
                  styles.tableDataRow,
                  i % 2 === 1 ? styles.tableDataRowAlt : {},
                  isUltraCompact
                    ? { paddingVertical: 2.2, paddingHorizontal: 8 }
                    : isCompact
                    ? { paddingVertical: 3, paddingHorizontal: 10 }
                    : {},
                ]}
              >
                <Text style={[styles.tableCellMonth, !hasDeductions ? { width: '34%' } : {}]}>
                  {r.monthDisplay}
                </Text>
                <Text style={[styles.tableCellBasic, !hasDeductions ? { width: '33%' } : {}]}>
                  {formatAmount(r.basicSalary)}
                </Text>
                {hasDeductions && (
                  <Text style={styles.tableCellDeduct}>
                    {formatAmount(r.totalDeductions)}
                  </Text>
                )}
                <Text style={[styles.tableCellNet, !hasDeductions ? { width: '33%' } : {}]}>
                  {formatAmount(r.netSalary)}
                </Text>
              </View>
            ))}
            {/* Totals Row */}
            <View style={[styles.tableFooterRow, isUltraCompact ? { paddingVertical: 3 } : {}]}>
              <Text style={[styles.tableFooterMonth, !hasDeductions ? { width: '34%' } : {}]}>TOTAL ({summary.rows.length} MONTHS)</Text>
              <Text style={[styles.tableFooterBasic, !hasDeductions ? { width: '33%' } : {}]}>{formatAmount(summary.totalBasicSalary)}</Text>
              {hasDeductions && (
                <Text style={styles.tableFooterDeduct}>{formatAmount(summary.totalDeductions)}</Text>
              )}
              <Text style={[styles.tableFooterNet, !hasDeductions ? { width: '33%' } : {}]}>{formatAmount(summary.totalNetSalary)}</Text>
            </View>
          </View>

          {/* 5. TOTAL SALARY SUMMARY BOX */}
          <View style={[styles.summaryBox, isCompact ? { paddingVertical: 5, marginBottom: 5 } : {}]}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryTitle}>Total Net Salary</Text>
              <Text style={styles.summaryAmount}>
                Rs. {formatAmount(summary.totalNetSalary)}
              </Text>
            </View>
            <View style={styles.summarySubRow}>
              <Text style={styles.summarySubText}>
                Total Basic: Rs. {formatAmount(summary.totalBasicSalary)}
              </Text>
              {hasDeductions && (
                <Text style={styles.summarySubText}>
                  Total Deductions: Rs. {formatAmount(summary.totalDeductions)}
                </Text>
              )}
              <Text style={styles.summarySubText}>
                Period: {summary.periodDisplay} ({summary.monthsCount} Months)
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryWordsRow}>
              <Text style={styles.wordsLabel}>Amount in Words:</Text>
              <Text style={styles.wordsValue}>{words}</Text>
            </View>
          </View>

          {/* 6. NOTE CALLOUT BOX */}
          {notesList.length > 0 ? (
            <View style={[styles.noteBox, isCompact ? { padding: 5, marginBottom: 5 } : {}]}>
              <View style={styles.noteIconCol}>
                <NoteIcon />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Note:</Text>
                {notesList.map((noteText, idx) => (
                  <Text key={idx} style={styles.noteLine}>
                    {noteText}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {/* 7. AUTHORIZATION FOOTER */}
          <View style={styles.authFooter}>
            <View style={styles.authBlock}>
              <Text style={styles.authCompanyHeader}>For {company.name}</Text>
              <View style={styles.authStampSpace} />
              <View style={styles.authLine} />
              <Text style={styles.authSignatoryTitle}>Authorized Signatory</Text>
              <Text style={styles.authSignatorySubtitle}>(Director)</Text>
            </View>
          </View>

          {/* Subtle Bottom Wave Decoration */}
          <BottomWave />
        </View>
      </Page>
    </Document>
  );
}
