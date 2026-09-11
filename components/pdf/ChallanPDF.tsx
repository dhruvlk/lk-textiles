import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Line, Polygon, Circle } from '@react-pdf/renderer';
import { Challan, Company, Customer } from '@/types';
import { numberToWords } from '@/lib/number-to-words';
import {
  formatCompanyAddress,
  getBankDetailRows,
  itemDescription,
  resolveHsnCode,
  resolveInvoiceTerms,
} from '@/lib/pdf-utils';
import { getItemPieces, getItemQuantityDisplay } from '@/lib/challan-item';

// Register standard fonts
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
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={TEXT_COLOR} />
  </Svg>
);

const UserIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#FFFFFF" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#FFFFFF" />
  </Svg>
);

const BankIcon = () => (
  <Svg viewBox="0 0 24 24" width="16" height="16">
    <Path d="M4 10h3v7H4zm6.5 0h3v7h-3zM2 19h20v3H2zm15-9h3v7h-3zm-5-9L2 6v2h20V6z" fill={SECONDARY_COLOR} />
  </Svg>
);

const DocIcon = () => (
  <Svg viewBox="0 0 24 24" width="16" height="16">
    <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill={SECONDARY_COLOR} />
  </Svg>
);

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="12" height="12">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={TEXT_COLOR} />
  </Svg>
);

const FancyDivider = () => (
  <Svg viewBox="0 0 300 10" width="300" height="10">
    <Line x1="0" y1="5" x2="134" y2="5" stroke={SECONDARY_COLOR} strokeWidth="1" />
    <Polygon points="138,5 142,2 146,5 142,8" fill={SECONDARY_COLOR} />
    <Circle cx="150" cy="5" r="2.5" fill={SECONDARY_COLOR} />
    <Polygon points="154,5 158,2 162,5 158,8" fill={SECONDARY_COLOR} />
    <Line x1="166" y1="5" x2="300" y2="5" stroke={SECONDARY_COLOR} strokeWidth="1" />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
    padding: 0,
    color: TEXT_COLOR,
  },
  pageBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
    margin: 10, // Optimized margin
    display: 'flex',
    flexDirection: 'column',
  },
  // HEADER
  header: {
    paddingHorizontal: 15,
    paddingTop: 10, // Optimized padding
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gstin: {
    fontSize: 10,
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
    fontSize: 12,
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
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 4,
  },
  companyName: {
    fontSize: 42, // Optimized font size
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 2,
  },
  companyTagline: {
    fontSize: 15,
    fontFamily: 'Helvetica',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 1,
  },
  headerDividerWrapper: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  headerDividerLine: {
    width: '40%',
    height: 1,
    backgroundColor: SECONDARY_COLOR,
  },
  addressBar: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  addressText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginLeft: 6,
  },

  // CUSTOMER & INVOICE DETAILS
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  infoCol: {
    width: '45%',
  },
  badge: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  fieldLabel: {
    width: 65,
    fontSize: 10,
    color: '#333',
  },
  fieldLabelRight: {
    width: 75,
    fontSize: 10,
    color: '#333',
  },
  fieldValueLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
    minHeight: 12,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    paddingBottom: 1,
    paddingLeft: 4,
  },
  colon: {
    marginRight: 4,
    fontSize: 10,
  },

  // TABLE
  tableContainer: {
    marginTop: 10,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#A0A0A0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
  },
  th: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#A0A0A0',
  },
  thLast: {
    borderRightWidth: 0,
  },
  col1: { width: '42%' },
  col2: { width: '13%' },
  col3: { width: '15%' },
  col4: { width: '14%' },
  col5: { width: '16%' },

  tableBodyRowWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  tdWrapper: {
    borderRightWidth: 1,
    borderRightColor: '#A0A0A0',
    display: 'flex',
    flexDirection: 'column',
  },
  tdWrapperLast: {
    borderRightWidth: 0,
  },
  tdContent: {
    padding: 5,
    flex: 1,
  },
  cellText: {
    fontSize: 10,
    marginBottom: 4,
  },
  cellTextCenter: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  cellTextRight: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 4,
  },

  tdBottomCol1: {
    padding: 5,
  },
  bottomFieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  bottomLabel: {
    width: 85,
    fontSize: 9,
    color: '#333',
  },
  bottomValueLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
    minHeight: 12,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingBottom: 1,
    paddingLeft: 4,
  },
  noDyeingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  noDyeingLine: {
    width: 30,
    height: 1,
    backgroundColor: SECONDARY_COLOR,
    marginHorizontal: 10,
  },
  noDyeingText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
  },

  taxRowWrapper: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#A0A0A0',
    height: 18,
    alignItems: 'center',
  },
  taxRowWrapperTotal: {
    backgroundColor: SECONDARY_COLOR,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#A0A0A0',
    height: 22,
    alignItems: 'center',
  },
  taxLabel: { flex: 1, fontSize: 9, textAlign: 'center' },
  taxValue: { flex: 1, fontSize: 9, textAlign: 'right', paddingRight: 4 },
  totalLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  totalValue: { flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingRight: 4 },

  // FOOTER (Bank, Signature, Terms)
  footerSection: {
    marginTop: 10,
  },
  bankSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  bankBox: {
    width: '50%',
  },
  bankBorderedBox: {
    borderWidth: 1,
    borderColor: SECONDARY_COLOR,
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 6,
  },
  bankTextRow: {
    marginBottom: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 22,
  },
  bankTextLabel: {
    width: 70,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  bankTextValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT_RED,
    flexShrink: 1,
  },
  bankText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  preparedBox: {
    marginTop: 10,
  },
  preparedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  preparedLabel: {
    width: 65,
    fontSize: 9,
    color: '#333',
  },
  preparedValueLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
    minHeight: 12,
  },
  signBox: {
    width: '40%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  forCompanyText: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    fontStyle: 'italic',
    width: 160,
    textAlign: 'center',
  },
  signatureLineWrapper: {
    alignItems: 'center',
    width: 160,
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 4,
  },
  signatureText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },

  termsBox: {
    marginTop: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  termsTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginLeft: 6,
  },
  termLine: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  termBullet: {
    fontSize: 8,
    marginRight: 6,
  },
  termText: {
    fontSize: 8,
    flex: 1,
    lineHeight: 1.2,
  },
  thankYouWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  thankYouLine: {
    width: 40,
    height: 1,
    backgroundColor: PRIMARY_COLOR,
    marginHorizontal: 10,
  },
  thankYouText: {
    textAlign: 'center',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    letterSpacing: 2,
  },
});

interface ChallanPDFProps {
  challan: Challan;
  company: Company;
  party?: Customer;
}

export function ChallanPDF({ challan, company, party }: ChallanPDFProps) {
  const customer = party ?? challan.customer ?? challan.party;
  const items = challan.items ?? [];
  const subtotal = challan.subtotal ?? items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const cgst = challan.cgst_amount ?? 0;
  const sgst = challan.sgst_amount ?? 0;
  const igst = challan.igst_amount ?? 0;
  const grandTotal = challan.grand_total ?? subtotal + cgst + sgst + igst + (challan.other_charges ?? 0);
  const bankRows = getBankDetailRows(company);
  const terms = resolveInvoiceTerms(company);
  const hsnCode = resolveHsnCode(company, items);
  const MIN_ROWS = 5; // Reduced padded rows to guarantee 1 page
  const displayItems = Array(Math.max(MIN_ROWS, items.length)).fill(null).map((_, i) => items[i] ?? null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageBorder} wrap={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.gstin}>GSTIN: {company.gst_number || '-'}</Text>
              <View style={styles.religiousTextWrapper}>
                <Text style={styles.religiousText}>|| શ્રી ગણેશાય નમઃ ||</Text>
              </View>
              <View style={styles.phoneWrapper}>
                <PhoneIcon />
                <Text style={styles.phoneText}>{company.phone || '-'}</Text>
              </View>
            </View>
            <Text style={styles.companyName}>
              {(company.name || '').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())}
            </Text>
            {company.tagline ? (
              <Text style={styles.companyTagline}>{company.tagline}</Text>
            ) : null}
            <View style={styles.headerDividerWrapper}>
              <FancyDivider />
            </View>
          </View>

          <View style={styles.addressBar}>
            <PinIcon />
            <Text style={styles.addressText}>{formatCompanyAddress(company) || company.address || '-'}</Text>
          </View>

          {/* CUSTOMER & INVOICE DETAILS */}
          <View style={styles.infoSection}>
            <View style={styles.infoCol}>
              <View style={styles.badge}>
                <UserIcon />
                <Text style={styles.badgeText}>BILLED TO</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{customer?.name || ''}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Address</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{customer?.address || ''}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}></Text>
                <Text style={styles.colon}> </Text>
                <Text style={styles.fieldValueLine}>{customer?.city ? `${customer.city}${customer.state ? `, ${customer.state}` : ''}` : ''}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>GST No.</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{customer?.gst_number || ''}</Text>
              </View>
            </View>

            <View style={styles.infoCol}>
              <View style={styles.badge}>
                <CalendarIcon />
                <Text style={styles.badgeText}>INVOICE DETAILS</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelRight}>Date</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{new Date(challan.date).toLocaleDateString('en-GB')}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelRight}>Bill No.</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{challan.bill_number || ''}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelRight}>Challan No.</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{challan.challan_number}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelRight}>HSN Code</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{hsnCode}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelRight}>Broker</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.fieldValueLine}>{challan.broker || '-'}</Text>
              </View>
            </View>
          </View>

          {/* TABLE */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.col1]}>DESCRIPTION OF GOODS</Text>
              <Text style={[styles.th, styles.col2]}>TOTAL{'\n'}PIECES</Text>
              <Text style={[styles.th, styles.col3]}>TOTAL{'\n'}MTS./KGS</Text>
              <Text style={[styles.th, styles.col4]}>RATE PER{'\n'}MTRS.</Text>
              <Text style={[styles.th, styles.col5, styles.thLast]}>AMOUNT</Text>
            </View>

            <View style={styles.tableBodyRowWrapper}>
              <View style={[styles.tdWrapper, styles.col1]}>
                <View style={styles.tdContent}>
                  {displayItems.map((item, i) => (
                    <Text key={i} style={styles.cellText}>{item ? itemDescription(item) : ' '}</Text>
                  ))}
                </View>
                <View style={styles.tdBottomCol1}>
                  <View style={styles.bottomFieldRow}>
                    <Text style={styles.bottomLabel}>Delivered By</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.bottomValueLine}>{challan.delivered_by || challan.driver_name || ''}</Text>
                  </View>
                  <View style={styles.bottomFieldRow}>
                    <Text style={styles.bottomLabel}>Payment Within</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.bottomValueLine}>{challan.payment_within_value ? `${challan.payment_within_value} ${challan.payment_within_unit}` : ''}</Text>
                  </View>
                  <View style={styles.bottomFieldRow}>
                    <Text style={styles.bottomLabel}>Due Date</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.bottomValueLine}>{challan.due_date ? new Date(challan.due_date).toLocaleDateString('en-GB') : ''}</Text>
                  </View>
                  <View style={styles.bottomFieldRow}>
                    <Text style={styles.bottomLabel}>Rupees</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.bottomValueLine}>{numberToWords(Math.round(grandTotal))}</Text>
                  </View>
                  <View style={styles.noDyeingWrapper}>
                    <View style={styles.noDyeingLine} />
                    <Text style={styles.noDyeingText}>NO DYEING GUARANTEE</Text>
                    <View style={styles.noDyeingLine} />
                  </View>
                </View>
              </View>

              <View style={[styles.tdWrapper, styles.col2]}>
                <View style={styles.tdContent}>
                  {displayItems.map((item, i) => (
                    <Text key={i} style={styles.cellTextCenter}>{item ? getItemPieces(item) : ' '}</Text>
                  ))}
                </View>
              </View>

              <View style={[styles.tdWrapper, styles.col3]}>
                <View style={styles.tdContent}>
                  {displayItems.map((item, i) => (
                    <Text key={i} style={styles.cellTextCenter}>{item ? getItemQuantityDisplay(item) : ' '}</Text>
                  ))}
                </View>
              </View>

              <View style={[styles.tdWrapper, styles.col4]}>
                <View style={styles.tdContent}>
                  {displayItems.map((item, i) => (
                    <Text key={i} style={styles.cellTextCenter}>{item ? item.rate : ' '}</Text>
                  ))}
                </View>
                <View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxLabel}>CGST {challan.cgst_percent ?? 0}%</Text>
                  </View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxLabel}>SGST {challan.sgst_percent ?? 0}%</Text>
                  </View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxLabel}>IGST {challan.igst_percent ?? 0}%</Text>
                  </View>
                  <View style={styles.taxRowWrapperTotal}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.tdWrapper, styles.col5, styles.tdWrapperLast]}>
                <View style={styles.tdContent}>
                  {displayItems.map((item, i) => (
                    <Text key={i} style={styles.cellTextRight}>{item ? (item.amount || 0).toFixed(2) : ' '}</Text>
                  ))}
                </View>
                <View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxValue}>{cgst.toFixed(2)}</Text>
                  </View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxValue}>{sgst.toFixed(2)}</Text>
                  </View>
                  <View style={styles.taxRowWrapper}>
                    <Text style={styles.taxValue}>{igst.toFixed(2)}</Text>
                  </View>
                  <View style={styles.taxRowWrapperTotal}>
                    <Text style={styles.totalValue}>{grandTotal.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footerSection}>
            <View style={styles.bankSignRow}>
              <View style={styles.bankBox}>
                <View style={styles.bankBorderedBox}>
                  <View style={styles.bankHeader}>
                    <BankIcon />
                    <Text style={styles.bankTitle}>BANK DETAILS:</Text>
                  </View>
                  {bankRows.length > 0 ? (
                    bankRows.map((row, i) =>
                      row.label ? (
                        <View key={i} style={styles.bankTextRow}>
                          <Text style={styles.bankTextLabel}>{row.label}</Text>
                          <Text style={styles.bankTextValue}>{row.value}</Text>
                        </View>
                      ) : (
                        <View key={i} style={styles.bankTextRow}>
                          <Text style={styles.bankTextValue}>{row.value}</Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text style={styles.bankText}>-</Text>
                  )}
                </View>

                <View style={styles.preparedBox}>
                  <View style={styles.preparedRow}>
                    <Text style={styles.preparedLabel}>Prepared By</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.preparedValueLine} />
                  </View>
                  <View style={styles.preparedRow}>
                    <Text style={styles.preparedLabel}>Checked By</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.preparedValueLine} />
                  </View>
                </View>
              </View>

              <View style={styles.signBox}>
                <Text style={styles.forCompanyText}>For, {company.name}</Text>
                <View style={styles.signatureLineWrapper}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>AUTHORIZED SIGNATURE</Text>
                </View>
              </View>
            </View>

            {terms.length > 0 ? (
              <View style={styles.termsBox}>
                <View style={styles.termsHeader}>
                  <DocIcon />
                  <Text style={styles.termsTitle}>TERMS & CONDITIONS:</Text>
                </View>
                <View style={{ paddingLeft: 22 }}>
                  {terms.map((term, i) => (
                    <View key={i} style={styles.termLine}>
                      <Text style={styles.termBullet}>•</Text>
                      <Text style={styles.termText}>{term}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.thankYouWrapper}>
              <View style={styles.thankYouLine} />
              <Text style={styles.thankYouText}>THANK YOU FOR YOUR BUSINESS</Text>
              <View style={styles.thankYouLine} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
