import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Line, Polygon, Circle } from '@react-pdf/renderer';
import { Company, SalarySlip } from '@/types';
import { numberToWords } from '@/lib/number-to-words';
import { formatCompanyAddress } from '@/lib/pdf-utils';

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


const PRIMARY_COLOR = '#0C1E40'; // Navy Dark Blue matching ChallanPDF
const SECONDARY_COLOR = '#E6D5B8'; // Beige accent border matching ChallanPDF
const ACCENT_RED = '#D3362E'; // Red accent matching ChallanPDF
const TEXT_COLOR = '#000000';

const PinIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={TEXT_COLOR} />
  </Svg>
);

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={TEXT_COLOR} />
  </Svg>
);

const FancyDivider = () => (
  <Svg viewBox="0 0 300 10" width="300" height="9">
    <Line x1="0" y1="4.5" x2="134" y2="4.5" stroke={SECONDARY_COLOR} strokeWidth="1" />
    <Polygon points="138,4.5 142,1.5 146,4.5 142,7.5" fill={SECONDARY_COLOR} />
    <Circle cx="150" cy="4.5" r="2.2" fill={SECONDARY_COLOR} />
    <Polygon points="154,4.5 158,1.5 162,4.5 158,7.5" fill={SECONDARY_COLOR} />
    <Line x1="166" y1="4.5" x2="300" y2="4.5" stroke={SECONDARY_COLOR} strokeWidth="1" />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#FFFFFF',
    padding: 0,
    color: TEXT_COLOR,
  },
  pageBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
    margin: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  // HEADER (~25-30mm presence)
  header: {
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 14,
  },
  gstin: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: '33%',
  },
  religiousTextWrapper: {
    width: '33%',
    alignItems: 'center',
  },
  religiousText: {
    color: ACCENT_RED,
    fontSize: 11.5,
    fontFamily: 'Gujarati',
    fontWeight: 'bold',
  },
  phoneWrapper: {
    width: '33%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 4,
  },
  companyName: {
    fontSize: 37,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 12.5,
    fontFamily: 'Helvetica',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 2,
  },
  headerDividerWrapper: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  addressBar: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 12,
  },
  addressText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginLeft: 6,
  },

  // TITLE BAR
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  titleBadge: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: 3,
  },
  titleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.8,
  },
  payPeriodWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payPeriodLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
  },
  payPeriodValue: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    marginLeft: 4,
  },

  // EMPLOYEE INFORMATION
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  infoCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 3,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  infoColTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_COLOR,
    paddingBottom: 4,
    marginBottom: 7,
    letterSpacing: 0.8,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoGridCol: {
    width: '49%',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  infoLabel: {
    width: 100,
    fontSize: 9.5,
    color: '#555555',
    fontFamily: 'Helvetica',
  },
  infoValue: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },

  // SECTION DIVIDER BARS (SALARY BREAKDOWN & SALARY AUTHORIZATION)
  sectionHeaderBar: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#D8DCE3',
    borderBottomWidth: 1,
    borderBottomColor: '#D8DCE3',
    backgroundColor: '#F7F8FA',
    paddingVertical: 4,
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 1.5,
  },

  // TWO-COLUMN TABLES: EARNINGS & DEDUCTIONS
  tablesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 8,
  },
  tableCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9E9E9E',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    minHeight: 23,
    alignItems: 'center',
  },
  tableHeaderLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  tableHeaderAmount: {
    width: 85,
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    minHeight: 21,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableRowLabel: {
    flex: 1,
    fontSize: 9,
    color: '#222222',
  },
  tableRowAmount: {
    width: 85,
    fontSize: 9,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 5.5,
    paddingHorizontal: 8,
    minHeight: 23,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#9E9E9E',
  },
  totalRowLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalRowAmount: {
    width: 85,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: '#000000',
  },

  // NET SALARY SUMMARY BOX
  netSalaryBox: {
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 4,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#F8F9FC',
  },
  netSalaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netSalaryLabel: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 0.5,
  },
  netSalaryValue: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DEE3EB',
    marginTop: 5,
    paddingTop: 5,
  },
  wordsLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    marginRight: 5,
  },
  wordsValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_RED,
    flex: 1,
  },

  // SALARY AUTHORIZATION COMPACT FOOTER SECTION (~45-60mm total height)
  authFooterSection: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 'auto',
  },
  authRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 8,
  },
  authCol: {
    width: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  signHeader: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  signSpace: {
    height: 62, // ~22mm clean space for physical signature
  },
  stampSpace: {
    height: 62, // ~22mm (20-25mm required) clean blank space for company stamp
  },
  signLine: {
    width: 175,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
  },
  signSubtitle: {
    fontSize: 7.5,
    color: '#666666',
    textAlign: 'center',
    marginTop: 1,
  },
  confidentialNotice: {
    textAlign: 'center',
    fontSize: 7.5,
    color: '#777777',
    marginTop: 10,
    paddingBottom: 10,
  },
});

function formatAmount(val: number | string | null | undefined): string {
  return Number(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompanyPhone(phone?: string | null): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+91')) {
    const rest = trimmed.slice(3).trim();
    return `+91 ${rest}`;
  }
  if (trimmed.startsWith('91') && trimmed.length > 10) {
    const rest = trimmed.slice(2).trim();
    return `+91 ${rest}`;
  }
  return trimmed;
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

interface SalarySlipPDFProps {
  salarySlip: SalarySlip;
  company: Company;
}

export function SalarySlipPDF({ salarySlip, company }: SalarySlipPDFProps) {
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
    { label: 'Provident Fund (PF)', amount: salarySlip.pf },
    { label: 'Professional Tax (PT)', amount: salarySlip.professional_tax },
    { label: 'Tax Deducted at Source (TDS)', amount: salarySlip.tds },
    { label: 'ESIC', amount: salarySlip.esic },
    { label: 'Loan Deduction', amount: salarySlip.loan_deduction },
    { label: 'Advance Deduction', amount: salarySlip.advance_deduction },
    { label: 'Other Deduction', amount: salarySlip.other_deduction },
  ].filter((item) => Number(item.amount) > 0);

  // If deductions list is empty, display a placeholder row for neat symmetry
  if (deductionsList.length === 0) {
    deductionsList.push({ label: 'Nil Deductions', amount: 0 });
  }

  const companyAddress = formatCompanyAddress(company);

  return (
    <Document title={`Salary-Slip-${salarySlip.salary_slip_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageBorder}>
          {/* 1. HEADER (~25-30mm) */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.gstin}>
              </Text>
             
              <View style={styles.phoneWrapper}>
                {company.phone ? (
                  <>
                    <PhoneIcon />
                    <Text style={styles.phoneText}>{formatCompanyPhone(company.phone)}</Text>
                  </>
                ) : null}
              </View>
            </View>

            <Text style={styles.companyName}>{company.name}</Text>
            {company.tagline ? (
              <Text style={styles.companyTagline}>{company.tagline}</Text>
            ) : null}

            <View style={styles.headerDividerWrapper}>
              <FancyDivider />
            </View>
          </View>

          {/* ADDRESS BAR */}
          {companyAddress ? (
            <View style={styles.addressBar}>
              <PinIcon />
              <Text style={styles.addressText}>{companyAddress}</Text>
            </View>
          ) : null}

          {/* 2. TITLE & PERIOD */}
          <View style={styles.titleBar}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>SALARY SLIP</Text>
            </View>
            <View style={styles.payPeriodWrapper}>
              <Text style={styles.payPeriodLabel}>Salary Month:</Text>
              <Text style={styles.payPeriodValue}>
                {salarySlip.salary_month} {salarySlip.salary_year}
              </Text>
            </View>
          </View>

          {/* 3. EMPLOYEE INFORMATION */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoColTitle}>EMPLOYEE INFORMATION</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoGridCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Employee Name:</Text>
                    <Text style={styles.infoValue}>{salarySlip.employee_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Joining Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(salarySlip.joining_date)}</Text>
                  </View>
                <View style={styles.infoGridCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>PAN Number:</Text>
                    <Text style={styles.infoValue}>
                      {[
                        salarySlip.pan_number ? `${salarySlip.pan_number}` : '',
                        salarySlip.uan_number || salarySlip.pf_number
                          ? `UAN: ${salarySlip.uan_number || salarySlip.pf_number}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' | ') || '—'}
                    </Text>
                  </View>
                </View>
                </View>
              </View>
            </View>
          </View>

          {/* 4. SALARY BREAKDOWN SECTION */}
          <View style={styles.sectionHeaderBar}>
            <Text style={styles.sectionHeaderText}>SALARY BREAKDOWN</Text>
          </View>

          {/* TWO-COLUMN TABLES: EARNINGS & DEDUCTIONS */}
          <View style={styles.tablesContainer}>
            {/* Earnings */}
            <View style={styles.tableCol}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderLabel}>EARNINGS</Text>
                <Text style={styles.tableHeaderAmount}>AMOUNT (Rs.)</Text>
              </View>
              {earningsList.map((item, idx) => (
                <View
                  key={item.label}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={styles.tableRowLabel}>{item.label}</Text>
                  <Text style={styles.tableRowAmount}>
                    {formatAmount(item.amount)}
                  </Text>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Gross Earnings</Text>
                <Text style={styles.totalRowAmount}>
                  Rs. {formatAmount(salarySlip.gross_earnings)}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={styles.tableCol}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderLabel}>DEDUCTIONS</Text>
                <Text style={styles.tableHeaderAmount}>AMOUNT (Rs.)</Text>
              </View>
              {deductionsList.map((item, idx) => (
                <View
                  key={item.label}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={styles.tableRowLabel}>{item.label}</Text>
                  <Text style={styles.tableRowAmount}>
                    {formatAmount(item.amount)}
                  </Text>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Total Deductions</Text>
                <Text style={styles.totalRowAmount}>
                  Rs. {formatAmount(salarySlip.total_deductions)}
                </Text>
              </View>
            </View>
          </View>

          {/* 5. NET SALARY SUMMARY BOX */}
          <View style={styles.netSalaryBox}>
            <View style={styles.netSalaryTop}>
              <Text style={styles.netSalaryLabel}>NET TAKE-HOME SALARY:</Text>
              <Text style={styles.netSalaryValue}>
                Rs. {formatAmount(salarySlip.net_salary)}
              </Text>
            </View>
            <View style={styles.wordsRow}>
              <Text style={styles.wordsLabel}>Amount in Words:</Text>
              <Text style={styles.wordsValue}>{words}</Text>
            </View>
          </View>

          {/* FLEXIBLE SPACER TO PUSH AUTHORIZATION FOOTER TO THE BOTTOM */}
          <View style={{ flex: 1, minHeight: 15 }} />

          {/* 6. SALARY AUTHORIZATION COMPACT FOOTER SECTION */}
          <View style={styles.authFooterSection}>
           

            <View style={styles.authRow}>
              {/* Employee Signature Column */}
              <View style={styles.authCol}>
                {/* <Text style={styles.signHeader}>Employee Signature</Text>
                <View style={styles.signSpace} />
                <View style={styles.signLine} />
                <Text style={styles.signTitle}>Employee Signature</Text>
                <Text style={styles.signSubtitle}>(Signature & Date)</Text> */}
              </View>

              {/* Company Authorization Column */}
              <View style={styles.authCol}>
                <Text style={styles.signHeader}>For {company.name}</Text>
                <View style={styles.stampSpace} />
                <View style={styles.signLine} />
                <Text style={styles.signTitle}>Authorized Signatory</Text>
                <Text style={styles.signSubtitle}>(Director / Accounts)</Text>
              </View>
            </View>

            {/* 7. CONFIDENTIAL FOOTER NOTE DIRECTLY BELOW SIGNATURES */}
            <Text style={styles.confidentialNotice}>
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

