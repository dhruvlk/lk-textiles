import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Line, Polygon, Circle } from '@react-pdf/renderer';
import { Company, SalarySlip } from '@/types';
import { numberToWords } from '@/lib/number-to-words';
import { formatCompanyAddress } from '@/lib/pdf-utils';
import { formatCurrency } from '@/lib/payment-status';

// Register Gujarati font
Font.register({
  family: 'Gujarati',
  fonts: [
    { src: '/fonts/NotoSansGujarati-Regular.ttf' },
    { src: '/fonts/NotoSansGujarati-Bold.ttf', fontWeight: 'bold' }
  ]
});

const PRIMARY_COLOR = '#0C1E40'; // Dark Blue
const SECONDARY_COLOR = '#E6D5B8'; // Beige
const ACCENT_RED = '#D3362E'; // Red
const TEXT_COLOR = '#000000';

const PinIcon = () => (
  <Svg viewBox="0 0 24 24" width="9" height="9">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={TEXT_COLOR} />
  </Svg>
);

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={TEXT_COLOR} />
  </Svg>
);

const FancyDivider = () => (
  <Svg viewBox="0 0 300 10" width="300" height="8">
    <Line x1="0" y1="4" x2="134" y2="4" stroke={SECONDARY_COLOR} strokeWidth="1" />
    <Polygon points="138,4 142,1 146,4 142,7" fill={SECONDARY_COLOR} />
    <Circle cx="150" cy="4" r="2" fill={SECONDARY_COLOR} />
    <Polygon points="154,4 158,1 162,4 158,7" fill={SECONDARY_COLOR} />
    <Line x1="166" y1="4" x2="300" y2="4" stroke={SECONDARY_COLOR} strokeWidth="1" />
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
  // HEADER
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gstin: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
    width: '33%',
  },
  religiousTextWrapper: {
    width: '33%',
    alignItems: 'center',
  },
  religiousText: {
    color: ACCENT_RED,
    fontSize: 11,
    fontFamily: 'Gujarati',
    fontWeight: 'bold',
    marginBottom: 2,
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
    fontSize: 32,
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 2,
  },
  companyTagline: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 1,
  },
  headerDividerWrapper: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  addressBar: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addressText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginLeft: 6,
  },

  // TITLE BAR
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  titleBadge: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  titleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  payPeriodText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },

  // INFO SECTION (Two columns: Document Info & Employee Info)
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  infoCol: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 4,
    padding: 8,
  },
  infoColTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    borderBottomWidth: 1,
    borderBottomColor: SECONDARY_COLOR,
    paddingBottom: 3,
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  infoLabel: {
    width: 80,
    fontSize: 8.5,
    color: '#555555',
  },
  infoValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },

  // EARNINGS & DEDUCTIONS TABLES
  tablesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  tableCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  tableHeaderAmount: {
    width: 75,
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableRowLabel: {
    flex: 1,
    fontSize: 8.5,
    color: '#333333',
  },
  tableRowAmount: {
    width: 75,
    fontSize: 8.5,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#A0A0A0',
  },
  totalRowLabel: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  totalRowAmount: {
    width: 75,
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: '#000000',
  },

  // NET SALARY BANNER
  netSalaryBox: {
    marginHorizontal: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F7F9FC',
  },
  netSalaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  netSalaryLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  netSalaryValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 4,
  },
  wordsLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#444444',
    marginRight: 4,
  },
  wordsValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_RED,
    flex: 1,
  },

  // NOTES ROW
  notesSection: {
    marginHorizontal: 14,
    marginTop: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 3,
    backgroundColor: '#FCFCFC',
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 8,
    color: '#333333',
  },

  // FOOTER (Signatures)
  footerSection: {
    marginTop: 'auto',
    marginBottom: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signBlock: {
    width: 170,
    alignItems: 'center',
  },
  signLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginBottom: 3,
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
  },
  confidentialNotice: {
    textAlign: 'center',
    fontSize: 7.5,
    color: '#777777',
    paddingBottom: 6,
  },
});

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
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.gstin}>
                {company.gst_number ? `GSTIN: ${company.gst_number}` : ''}
              </Text>
              <View style={styles.religiousTextWrapper}>
                <Text style={styles.religiousText}>॥ શ્રી ગણેશાય નમઃ ॥</Text>
              </View>
              <View style={styles.phoneWrapper}>
                {company.phone ? (
                  <>
                    <PhoneIcon />
                    <Text style={styles.phoneText}>{company.phone}</Text>
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

          {/* TITLE & PERIOD */}
          <View style={styles.titleBar}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>SALARY SLIP</Text>
            </View>
            <Text style={styles.payPeriodText}>
              Salary Month: {salarySlip.salary_month} {salarySlip.salary_year}
            </Text>
          </View>

          {/* METADATA INFO */}
          <View style={styles.infoSection}>
            {/* Document Details */}
            <View style={styles.infoCol}>
              <Text style={styles.infoColTitle}>DOCUMENT & PAYMENT INFO</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Slip Number:</Text>
                <Text style={styles.infoValue}>{salarySlip.salary_slip_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pay Date:</Text>
                <Text style={styles.infoValue}>{salarySlip.pay_date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Salary Period:</Text>
                <Text style={styles.infoValue}>
                  {salarySlip.salary_month} {salarySlip.salary_year}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Status:</Text>
                <Text style={styles.infoValue}>{salarySlip.payment_status}</Text>
              </View>
              {salarySlip.payment_mode ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Mode:</Text>
                  <Text style={styles.infoValue}>{salarySlip.payment_mode}</Text>
                </View>
              ) : null}
            </View>

            {/* Employee Details */}
            <View style={styles.infoCol}>
              <Text style={styles.infoColTitle}>EMPLOYEE INFORMATION</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employee Name:</Text>
                <Text style={styles.infoValue}>{salarySlip.employee_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employee ID:</Text>
                <Text style={styles.infoValue}>{salarySlip.employee_code || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Designation:</Text>
                <Text style={styles.infoValue}>{salarySlip.designation || '—'}</Text>
              </View>
              {salarySlip.department ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Department:</Text>
                  <Text style={styles.infoValue}>{salarySlip.department}</Text>
                </View>
              ) : null}
              {salarySlip.joining_date ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Joining Date:</Text>
                  <Text style={styles.infoValue}>{salarySlip.joining_date}</Text>
                </View>
              ) : null}
              {salarySlip.bank_name || salarySlip.bank_account_number ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bank & A/C:</Text>
                  <Text style={styles.infoValue}>
                    {[salarySlip.bank_name, salarySlip.bank_account_number]
                      .filter(Boolean)
                      .join(' - ')}
                  </Text>
                </View>
              ) : null}
              {salarySlip.pan_number || salarySlip.uan_number || salarySlip.pf_number ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>PAN / UAN:</Text>
                  <Text style={styles.infoValue}>
                    {[
                      salarySlip.pan_number ? `PAN: ${salarySlip.pan_number}` : '',
                      salarySlip.uan_number || salarySlip.pf_number
                        ? `UAN: ${salarySlip.uan_number || salarySlip.pf_number}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' | ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* TWO-COLUMN TABLES: EARNINGS & DEDUCTIONS */}
          <View style={styles.tablesContainer}>
            {/* Earnings */}
            <View style={styles.tableCol}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderLabel}>EARNINGS</Text>
                <Text style={styles.tableHeaderAmount}>AMOUNT (₹)</Text>
              </View>
              {earningsList.map((item, idx) => (
                <View
                  key={item.label}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={styles.tableRowLabel}>{item.label}</Text>
                  <Text style={styles.tableRowAmount}>
                    {formatCurrency(Number(item.amount)).replace('₹', '')}
                  </Text>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Gross Earnings</Text>
                <Text style={styles.totalRowAmount}>
                  {formatCurrency(salarySlip.gross_earnings)}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={styles.tableCol}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderLabel}>DEDUCTIONS</Text>
                <Text style={styles.tableHeaderAmount}>AMOUNT (₹)</Text>
              </View>
              {deductionsList.map((item, idx) => (
                <View
                  key={item.label}
                  style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
                >
                  <Text style={styles.tableRowLabel}>{item.label}</Text>
                  <Text style={styles.tableRowAmount}>
                    {formatCurrency(Number(item.amount)).replace('₹', '')}
                  </Text>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabel}>Total Deductions</Text>
                <Text style={styles.totalRowAmount}>
                  {formatCurrency(salarySlip.total_deductions)}
                </Text>
              </View>
            </View>
          </View>

          {/* NET SALARY CALLOUT BANNER */}
          <View style={styles.netSalaryBox}>
            <View style={styles.netSalaryTop}>
              <Text style={styles.netSalaryLabel}>NET TAKE-HOME SALARY:</Text>
              <Text style={styles.netSalaryValue}>
                {formatCurrency(salarySlip.net_salary)}
              </Text>
            </View>
            <View style={styles.wordsRow}>
              <Text style={styles.wordsLabel}>Amount in Words:</Text>
              <Text style={styles.wordsValue}>{words}</Text>
            </View>
          </View>

          {/* OPTIONAL NOTES */}
          {salarySlip.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes / Remarks:</Text>
              <Text style={styles.notesText}>{salarySlip.notes}</Text>
            </View>
          ) : null}

          {/* SIGNATURE SECTION */}
          <View style={styles.footerSection}>
            <View style={styles.signBlock}>
              <View style={styles.signLine} />
              <Text style={styles.signTitle}>Employee Signature</Text>
              <Text style={styles.signSubtitle}>Date: _______________</Text>
            </View>
            <View style={styles.signBlock}>
              <View style={styles.signLine} />
              <Text style={styles.signTitle}>For {company.name}</Text>
              <Text style={styles.signSubtitle}>Authorized Signatory</Text>
            </View>
          </View>

          <Text style={styles.confidentialNotice}>
            * This is a computer-generated salary slip and confidential.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
