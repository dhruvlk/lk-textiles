import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Polygon } from '@react-pdf/renderer';
import { Company, SalarySlip } from '@/types';
import { numberToWords } from '@/lib/number-to-words';
import { formatCompanyAddress } from '@/lib/pdf-utils';
import { generateSalaryRevisionNotes } from '@/lib/salary-revision-notes';

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

// ----------------------------------------------------------------------------
// SHARED SALARY SLIP DESIGN TOKENS (SOURCE OF TRUTH: SINGLE MONTH)
// ----------------------------------------------------------------------------
export const salarySlipAuthorization = {
  authFooter: {
    marginTop: 'auto',
    paddingHorizontal: 28,
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  authBlock: {
    alignItems: 'center',
    width: 175,
  },
  authCompanyHeader: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  authStampSpace: {
    height: 65, // ~25-28mm generous stamp area
  },
  authLine: {
    width: 165,
    borderTopWidth: 1,
    borderTopColor: PRIMARY_COLOR,
    marginBottom: 3,
  },
  authSignatoryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  authSignatorySubtitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
  },
} as const;

export const salarySlipTypography = {
  // Document Header
  docTitle: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
  },
  docPeriod: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
  },
  docPeriodLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.8,
  },
  // Employee Info
  empCardHeader: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  empLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
  },
  empColon: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  empValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  // Breakdown & History Table
  tableHeader: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  tableHead: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  tableCellBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableTotal: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  // Net / Total Salary Summary Box
  summaryTitle: {
    fontSize: 19,
    fontFamily: 'Times-Bold',
  },
  summaryAmount: {
    fontSize: 19,
    fontFamily: 'Times-Bold',
  },
  wordsLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  wordsValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  // Note Callout Box
  noteTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  noteLine: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    lineHeight: 1.35,
  },
  // Authorization
  authCompanyHeader: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
  },
  authSignatoryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  authSignatorySubtitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
  },
} as const;


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
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5-2.5 2.5-2.5 2.5-2.5 2.5 1.12 2.5 2.5 2.5-1.12 2.5-2.5 2.5z"
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

  // DOCUMENT TITLE BAR
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
  },
  docPeriodCol: {
    alignItems: 'flex-end',
  },
  docPeriodMonth: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
  },
  docPeriodLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6B7280',
    letterSpacing: 1.8,
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
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  empCardHeaderText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.8,
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
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: TEXT_MUTED,
  },
  empColon: {
    width: 14,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
  },
  empValue: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },

  // --------------------------------------------------------------------------
  // REFERENCE IMAGE 1: SINGLE-MONTH FULL-WIDTH STACKED TABLES
  // --------------------------------------------------------------------------
  singleTableWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  singleTableCard: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 9,
  },
  singleTableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BEIGE_BG,
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CEBE',
  },
  singleTableHeaderLeft: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.6,
  },
  singleTableHeaderRight: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  singleTableItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  singleTableItemRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  singleTableItemLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#374151',
    flex: 1,
  },
  singleTableItemAmount: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: TEXT_DARK,
    width: 100,
    textAlign: 'right',
  },
  singleTableTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  singleTableTotalLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  singleTableTotalAmount: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    width: 100,
    textAlign: 'right',
  },

  // --------------------------------------------------------------------------
  // REFERENCE IMAGE 2: MULTI-MONTH SIDE-BY-SIDE TABLES
  // --------------------------------------------------------------------------
  sideBySideContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  sideCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  sideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BEIGE_BG,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CEBE',
  },
  sideHeaderLeft: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  sideHeaderRight: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  sideItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  sideItemRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  sideItemLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#374151',
    flex: 1,
  },
  sideItemAmount: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: TEXT_DARK,
    width: 85,
    textAlign: 'right',
  },
  sideTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  sideTotalLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  sideTotalAmount: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    width: 85,
    textAlign: 'right',
  },

  // --------------------------------------------------------------------------
  // NET SALARY SUMMARY BOX (COMMON)
  // --------------------------------------------------------------------------
  netSalaryBox: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    borderRadius: 3.5,
    backgroundColor: CREAM_BG,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  netSalaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netSalaryTitle: {
    fontSize: 19,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
  },
  netSalaryAmount: {
    fontSize: 19,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
  },
  netSalaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8DEC9',
    marginTop: 4,
    marginBottom: 4,
  },
  netSalaryWordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordsLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#6B7280',
    marginRight: 4,
  },
  wordsValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    flex: 1,
  },

  // --------------------------------------------------------------------------
  // SALARY HISTORY TABLE (REFERENCE IMAGE 2)
  // --------------------------------------------------------------------------
  historySection: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 3.5,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  historyHeader: {
    backgroundColor: LIGHT_BLUE_GRAY,
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  historyHeaderText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.8,
  },
  historyTableHead: {
    flexDirection: 'row',
    backgroundColor: BEIGE_BG,
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8CEBE',
  },
  historyHeadMonth: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  historyHeadBasic: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  historyHeadDeduct: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  historyHeadNet: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 3.6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  historyCellMonth: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#374151',
  },
  historyCellBasic: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: TEXT_DARK,
    textAlign: 'right',
  },
  historyCellDeduct: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: TEXT_DARK,
    textAlign: 'right',
  },
  historyCellNet: {
    width: '25%',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'right',
  },

  // --------------------------------------------------------------------------
  // DYNAMIC NOTE CALLOUT BOX (REFERENCE IMAGE 2)
  // --------------------------------------------------------------------------
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
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    marginBottom: 2.5,
  },
  noteLine: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#374151',
    lineHeight: 1.35,
    marginBottom: 1,
  },

  // --------------------------------------------------------------------------
  // AUTHORIZATION FOOTER
  // --------------------------------------------------------------------------
  authFooter: {
    marginTop: 'auto',
    paddingHorizontal: 28,
    paddingBottom: 30,
    alignItems: 'flex-end',
  },
  authBlock: {
    alignItems: 'center',
    width: 175,
  },
  authCompanyHeader: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  authStampSpaceSingle: {
    height: 65, // ~25-28mm generous stamp area for Single Month
  },
  authStampSpaceMulti: {
    height: 65, // Exact same stamp area as Single Month
  },
  authLine: {
    width: 165,
    borderTopWidth: 1,
    borderTopColor: PRIMARY_COLOR,
    marginBottom: 3,
  },
  authSignatoryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  authSignatorySubtitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
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

export interface SalarySlipPDFProps {
  salarySlip: SalarySlip;
  company: Company;
  historySlips?: SalarySlip[];
  showHistory?: boolean;
  variant?: 'single' | 'multi';
  wrapInDocument?: boolean;
}

export function SalarySlipPDF({
  salarySlip,
  company,
  historySlips = [],
  showHistory = true,
  variant,
  wrapInDocument = true,
}: SalarySlipPDFProps) {
  // Determine mode: if variant is explicitly provided, use it; otherwise, if history exists and showHistory is true, use 'multi'
  const isMulti =
    variant === 'multi' ||
    (variant === undefined && showHistory && historySlips && historySlips.length > 0);

  const words =
    salarySlip.amount_in_words ||
    numberToWords(Math.round(salarySlip.net_salary));

  const earningsList = [
    { label: 'Basic Salary', amount: salarySlip.basic_salary },
    { label: 'House Rent Allowance (HRA)', amount: salarySlip.hra },
    { label: 'Conveyance Allowance', amount: salarySlip.conveyance },
    { label: 'Medical Allowance', amount: salarySlip.medical_allowance },
    { label: 'Special Allowance', amount: salarySlip.special_allowance },
    { label: 'Bonus', amount: salarySlip.bonus },
    { label: 'Overtime', amount: salarySlip.overtime },
    { label: 'Other Earnings', amount: salarySlip.other_earnings },
  ].filter((item) => Number(item.amount) > 0 || item.label === 'Basic Salary');

  const deductionsList = [
    { label: 'Professional Tax (PT)', amount: salarySlip.professional_tax },
    { label: 'Provident Fund (PF)', amount: salarySlip.pf },
    { label: 'Tax Deducted at Source (TDS)', amount: salarySlip.tds },
    { label: 'ESIC', amount: salarySlip.esic },
    { label: 'Loan Deduction', amount: salarySlip.loan_deduction },
    { label: 'Advance Deduction', amount: salarySlip.advance_deduction },
    { label: 'Other Deduction', amount: salarySlip.other_deduction },
  ].filter((item) => Number(item.amount) > 0);

  const hasDeductions =
    Number(salarySlip.total_deductions || 0) > 0 ||
    deductionsList.length > 0;

  const companyAddress =
    formatCompanyAddress(company);

  // Generate dynamic notes for multi-month mode
  const dynamicNotes = isMulti
    ? generateSalaryRevisionNotes(historySlips, salarySlip.notes)
    : [];

  const pageContent = (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageBorder}>
          {/* Top Left Decorative Accent Stripe */}
          <TopAccentBar />

          {/* 1. COMPANY HEADER */}
          <View style={styles.header}>
            <View style={styles.phoneRow}>
              <PhoneIcon />
              <Text style={styles.phoneText}>{formatCompanyPhone(company.phone)}</Text>
            </View>

            <Text style={styles.companyName}>{company.name}</Text>
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
          <View style={styles.docHeader}>
            <Text style={styles.docTitle}>Salary Slip</Text>
            <View style={styles.docPeriodCol}>
              <Text style={styles.docPeriodMonth}>
                {salarySlip.salary_month} {salarySlip.salary_year}
              </Text>
              <Text style={styles.docPeriodLabel}>S A L A R Y   M O N T H</Text>
            </View>
          </View>

          {/* 3. EMPLOYEE DETAILS */}
          <View style={styles.empSection}>
            <View style={styles.empCard}>
              <View style={styles.empCardHeader}>
                <Text style={styles.empCardHeaderText}>EMPLOYEE DETAILS</Text>
              </View>
              <View style={styles.empCardBody}>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>Employee Name</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{salarySlip.employee_name}</Text>
                </View>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>Joining Date</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{formatDate(salarySlip.joining_date)}</Text>
                </View>
                <View style={styles.empRow}>
                  <Text style={styles.empLabel}>PAN Number</Text>
                  <Text style={styles.empColon}>:</Text>
                  <Text style={styles.empValue}>{salarySlip.pan_number || '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. EARNINGS & DEDUCTIONS TABLES */}
          {!isMulti || !hasDeductions ? (
            /* ========================================================== */
            /* REFERENCE IMAGE 1: STACKED FULL-WIDTH TABLES               */
            /* ========================================================== */
            <View style={styles.singleTableWrapper}>
              {/* EARNINGS TABLE */}
              <View style={styles.singleTableCard}>
                <View style={styles.singleTableHeaderRow}>
                  <Text style={styles.singleTableHeaderLeft}>
                    {!isMulti ? 'PARTICULARS' : 'EARNINGS'}
                  </Text>
                  <Text style={styles.singleTableHeaderRight}>AMOUNT (Rs.)</Text>
                </View>
                {earningsList.map((item, idx) => (
                  <View
                    key={item.label}
                    style={[styles.singleTableItemRow, idx % 2 === 1 ? styles.singleTableItemRowAlt : {}]}
                  >
                    <Text style={styles.singleTableItemLabel}>{item.label}</Text>
                    <Text style={styles.singleTableItemAmount}>{formatAmount(item.amount)}</Text>
                  </View>
                ))}
                <View style={styles.singleTableTotalRow}>
                  <Text style={styles.singleTableTotalLabel}>Gross Earnings</Text>
                  <Text style={styles.singleTableTotalAmount}>
                    {formatAmount(salarySlip.gross_earnings)}
                  </Text>
                </View>
              </View>

              {/* DEDUCTIONS TABLE */}
              {hasDeductions && (
                <View style={styles.singleTableCard}>
                  <View style={styles.singleTableHeaderRow}>
                    <Text style={styles.singleTableHeaderLeft}>DEDUCTIONS</Text>
                    <Text style={styles.singleTableHeaderRight}>AMOUNT (Rs.)</Text>
                  </View>
                  {deductionsList.map((item, idx) => (
                    <View
                      key={item.label}
                      style={[styles.singleTableItemRow, idx % 2 === 1 ? styles.singleTableItemRowAlt : {}]}
                    >
                      <Text style={styles.singleTableItemLabel}>{item.label}</Text>
                      <Text style={styles.singleTableItemAmount}>{formatAmount(item.amount)}</Text>
                    </View>
                  ))}
                  <View style={styles.singleTableTotalRow}>
                    <Text style={styles.singleTableTotalLabel}>Total Deductions</Text>
                    <Text style={styles.singleTableTotalAmount}>
                      {formatAmount(salarySlip.total_deductions)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* ========================================================== */
            /* REFERENCE IMAGE 2: SIDE-BY-SIDE TABLES                     */
            /* ========================================================== */
            <View style={styles.sideBySideContainer}>
              {/* EARNINGS */}
              <View style={styles.sideCol}>
                <View style={styles.sideHeaderRow}>
                  <Text style={styles.sideHeaderLeft}>EARNINGS</Text>
                  <Text style={styles.sideHeaderRight}>AMOUNT (Rs.)</Text>
                </View>
                {earningsList.map((item, idx) => (
                  <View
                    key={item.label}
                    style={[styles.sideItemRow, idx % 2 === 1 ? styles.sideItemRowAlt : {}]}
                  >
                    <Text style={styles.sideItemLabel}>{item.label}</Text>
                    <Text style={styles.sideItemAmount}>{formatAmount(item.amount)}</Text>
                  </View>
                ))}
                <View style={{ flex: 1 }} />
                <View style={styles.sideTotalRow}>
                  <Text style={styles.sideTotalLabel}>Gross Earnings</Text>
                  <Text style={styles.sideTotalAmount}>
                    {formatAmount(salarySlip.gross_earnings)}
                  </Text>
                </View>
              </View>

              {/* DEDUCTIONS */}
              <View style={styles.sideCol}>
                <View style={styles.sideHeaderRow}>
                  <Text style={styles.sideHeaderLeft}>DEDUCTIONS</Text>
                  <Text style={styles.sideHeaderRight}>AMOUNT (Rs.)</Text>
                </View>
                {deductionsList.map((item, idx) => (
                  <View
                    key={item.label}
                    style={[styles.sideItemRow, idx % 2 === 1 ? styles.sideItemRowAlt : {}]}
                  >
                    <Text style={styles.sideItemLabel}>{item.label}</Text>
                    <Text style={styles.sideItemAmount}>{formatAmount(item.amount)}</Text>
                  </View>
                ))}
                <View style={{ flex: 1 }} />
                <View style={styles.sideTotalRow}>
                  <Text style={styles.sideTotalLabel}>Total Deductions</Text>
                  <Text style={styles.sideTotalAmount}>
                    {formatAmount(salarySlip.total_deductions)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 5. NET SALARY SUMMARY BOX */}
          <View style={styles.netSalaryBox}>
            <View style={styles.netSalaryTop}>
              <Text style={styles.netSalaryTitle}>Net Salary</Text>
              <Text style={styles.netSalaryAmount}>
                Rs. {formatAmount(salarySlip.net_salary)}
              </Text>
            </View>
            <View style={styles.netSalaryDivider} />
            <View style={styles.netSalaryWordsRow}>
              <Text style={styles.wordsLabel}>Amount in Words:</Text>
              <Text style={styles.wordsValue}>{words}</Text>
            </View>
          </View>

          {/* 6. SALARY HISTORY TABLE (REFERENCE IMAGE 2 ONLY) */}
          {isMulti && historySlips.length > 0 ? (
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyHeaderText}>
                  SALARY HISTORY ({historySlips.length <= 6 ? `LAST ${historySlips.length} MONTHS` : 'LAST 6 MONTHS'})
                </Text>
              </View>
              <View style={styles.historyTableHead}>
                <Text style={styles.historyHeadMonth}>Month</Text>
                <Text style={styles.historyHeadBasic}>Basic Salary (Rs.)</Text>
                <Text style={styles.historyHeadDeduct}>Deductions (Rs.)</Text>
                <Text style={styles.historyHeadNet}>Net Salary (Rs.)</Text>
              </View>
              {historySlips.slice(-6).map((h, i) => (
                <View
                  key={`${h.salary_month}-${h.salary_year}`}
                  style={[styles.historyRow, i % 2 === 1 ? styles.historyRowAlt : {}]}
                >
                  <Text style={styles.historyCellMonth}>
                    {h.salary_month.slice(0, 3)} {h.salary_year}
                  </Text>
                  <Text style={styles.historyCellBasic}>
                    {formatAmount(h.basic_salary)}
                  </Text>
                  <Text style={styles.historyCellDeduct}>
                    {formatAmount(h.total_deductions)}
                  </Text>
                  <Text style={styles.historyCellNet}>
                    {formatAmount(h.net_salary)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* 7. NOTE CALLOUT BOX (REFERENCE IMAGE 2 ONLY) */}
          {isMulti && dynamicNotes.length > 0 ? (
            <View style={styles.noteBox}>
              <View style={styles.noteIconCol}>
                <NoteIcon />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>Note:</Text>
                {dynamicNotes.map((noteText, idx) => (
                  <Text key={idx} style={styles.noteLine}>
                    {noteText}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}

          {/* 8. AUTHORIZATION FOOTER */}
          <View style={styles.authFooter}>
            <View style={styles.authBlock}>
              <Text style={styles.authCompanyHeader}>For {company.name}</Text>
              <View style={!isMulti ? styles.authStampSpaceSingle : styles.authStampSpaceMulti} />
              <View style={styles.authLine} />
              <Text style={styles.authSignatoryTitle}>Authorized Signatory</Text>
              <Text style={styles.authSignatorySubtitle}>(Director)</Text>
            </View>
          </View>

          {/* Subtle Bottom Wave Decoration */}
          <BottomWave />
        </View>
      </Page>
  );

  if (wrapInDocument === false) {
    return pageContent;
  }

  return (
    <Document title={`Salary-Slip-${salarySlip.salary_slip_number}`}>
      {pageContent}
    </Document>
  );
}

export function SalarySlipPage(props: Omit<SalarySlipPDFProps, 'wrapInDocument'>) {
  return <SalarySlipPDF {...props} wrapInDocument={false} />;
}
