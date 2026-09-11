import { Document, Page, Text, View, StyleSheet, Font, Svg, Path, Line, Polygon, Circle } from '@react-pdf/renderer';
import type { Company, Customer, DeliveryChallan } from '@/types';
import { formatCompanyAddress } from '@/lib/pdf-utils';

Font.register({
  family: 'Gujarati',
  fonts: [
    { src: '/fonts/NotoSansGujarati-Regular.ttf' },
    { src: '/fonts/NotoSansGujarati-Bold.ttf', fontWeight: 'bold' },
  ],
});

const PRIMARY_COLOR = '#091A42'; // Dark Blue
const SECONDARY_COLOR = '#DCA86A'; // Gold/Beige
const BORDER_COLOR = '#EFE3D3'; // Light beige for borders and bg

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="12" height="12">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={PRIMARY_COLOR} />
  </Svg>
);

const PinIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={PRIMARY_COLOR} />
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

const ROWS_PER_SIDE = 24;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'column',
    flex: 1,
  },
  pageBorder: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  badgeShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: SECONDARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -1,
    left: -1,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  religiousWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: 5,
    zIndex: 1,
  },
  religiousText: {
    color: '#D3362E',
    fontFamily: 'Gujarati',
    fontSize: 12,
    fontWeight: 'bold',
  },
  phonesWrap: {
    alignItems: 'flex-end',
    marginTop: 5,
    zIndex: 5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: PRIMARY_COLOR,
    marginLeft: 4,
  },
  companyWrap: {
    alignItems: 'center',
    marginTop: 25,
  },
  companyName: {
    fontSize: 42,
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    color: PRIMARY_COLOR,
    marginBottom: 5,
  },
  tagline: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    marginTop: 5,
    color: PRIMARY_COLOR,
  },
  headerDividerWrapper: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  gstin: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: SECONDARY_COLOR,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 5,
  },
  addressBar: {
    backgroundColor: BORDER_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    marginLeft: 6,
  },
  metaSection: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  metaCol: {
    width: '45%',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: PRIMARY_COLOR,
    width: 60,
  },
  fieldLabelRight: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: PRIMARY_COLOR,
    width: 70,
  },
  colon: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: PRIMARY_COLOR,
    marginRight: 6,
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
    minHeight: 14,
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  fieldLineText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY_COLOR,
    paddingLeft: 4,
  },
  tablesWrap: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  table: {
    width: '49%',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    flexDirection: 'column',
    display: 'flex',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  th: {
    backgroundColor: PRIMARY_COLOR,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
  },
  thLast: {
    borderRightWidth: 0,
  },
  td: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  tdLast: {
    borderRightWidth: 0,
  },
  colSno: { width: '15%' },
  colTaka: { width: '35%' },
  colMts: { width: '25%' },
  colWt: { width: '25%' },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F0E6',
  },
  totalLeftSpan: {
    width: '50%',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  totalTd: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textAlign: 'center',
    paddingTop: 3,
    paddingBottom: 3,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  summaryCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
    justifyContent: 'center',
  },
  summaryCellLast: {
    borderRightWidth: 0,
  },
  summaryText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: PRIMARY_COLOR,
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  footerAck: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  footerMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  termsCol: {
    width: '65%',
  },
  companyNameCol: {
    width: '30%',
    alignItems: 'center',
    paddingTop: 2,
  },
  termItemWrap: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  termBullet: {
    width: 10,
    fontSize: 8,
    color: PRIMARY_COLOR,
  },
  termText: {
    flex: 1,
    fontFamily: 'Helvetica',
    fontSize: 8,
    lineHeight: 1.2,
    color: PRIMARY_COLOR,
  },
  footerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 15,
  },
  buyerSignWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '32%',
  },
  buyerSignText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: PRIMARY_COLOR,
    marginRight: 4,
  },
  buyerSignLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
  },
  guaranteeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: SECONDARY_COLOR,
    textAlign: 'center',
    width: '100%',
  },
  signatureLineWrap: {
    width: '30%',
    alignItems: 'center',
  },
  forCompanyText: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 10,
    color: PRIMARY_COLOR,
    textAlign: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_COLOR,
    marginBottom: 4,
  },
  signatureText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: PRIMARY_COLOR,
  },
});

function formatPhones(phone?: string | null): string[] {
  if (!phone?.trim()) return [];
  return phone.split(/[,/|]+/).map((p) => p.trim()).filter(Boolean).slice(0, 2);
}

function splitAddressLines(address: string): [string, string] {
  if (!address) return ['', ''];
  if (address.length <= 40) return [address, ''];
  const cut = address.lastIndexOf(' ', 40);
  const idx = cut > 15 ? cut : 40;
  return [address.slice(0, idx).trim(), address.slice(idx).trim()];
}

type PdfItem = {
  taka_no: string;
  meters: number;
  weight: number;
};

function normalizePdfItems(
  items: DeliveryChallan['items'] | undefined | null
): PdfItem[] {
  const list = Array.isArray(items) ? items : [];
  return [...list]
    .map((item, index) => ({
      sort_order: Number(item?.sort_order ?? index),
      taka_no: item?.taka_no != null ? String(item.taka_no).trim() : '',
      meters: Number(item?.meters) || 0,
      weight: Number(item?.weight) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ taka_no, meters, weight }) => ({ taka_no, meters, weight }));
}

function chunkItems(items: PdfItem[], size: number): PdfItem[][] {
  if (items.length === 0) return [[]];
  const pages: PdfItem[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function formatCellNumber(value: number | undefined | null, hasItem: boolean): string {
  if (!hasItem) return ' ';
  return Number(value || 0).toFixed(2);
}

function sumTableTotals(rows: Array<PdfItem | null>) {
  return rows.reduce(
    (acc, item) => {
      if (!item) return acc;
      return {
        meters: acc.meters + (Number(item.meters) || 0),
        weight: acc.weight + (Number(item.weight) || 0),
      };
    },
    { meters: 0, weight: 0 }
  );
}

function ItemTable({
  rows,
  startIndex,
  totalMeters,
  totalWeight,
}: {
  rows: Array<PdfItem | null>;
  startIndex: number;
  totalMeters: number;
  totalWeight: number;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tr} wrap={false}>
        <Text style={[styles.th, styles.colSno]}>S.No.</Text>
        <Text style={[styles.th, styles.colTaka]}>Taka No.</Text>
        <Text style={[styles.th, styles.colMts]}>MTS.</Text>
        <Text style={[styles.th, styles.colWt, styles.thLast]}>Wt.</Text>
      </View>

      {rows.map((item, i) => (
        <View key={i} style={styles.tr} wrap={false}>
          <Text style={[styles.td, styles.colSno]}>{String(startIndex + i)}</Text>
          <Text style={[styles.td, styles.colTaka]}>
            {item?.taka_no ? item.taka_no : ' '}
          </Text>
          <Text style={[styles.td, styles.colMts]}>
            {formatCellNumber(item?.meters, !!item)}
          </Text>
          <Text style={[styles.td, styles.colWt, styles.tdLast]}>
            {formatCellNumber(item?.weight, !!item)}
          </Text>
        </View>
      ))}

      <View style={styles.totalRow} wrap={false}>
        <Text style={styles.totalLeftSpan}>Total</Text>
        <Text style={[styles.totalTd, styles.colMts]}>{totalMeters > 0 ? totalMeters.toFixed(2) : ' '}</Text>
        <Text style={[styles.totalTd, styles.colWt, styles.tdLast]}>{totalWeight > 0 ? totalWeight.toFixed(2) : ' '}</Text>
      </View>
    </View>
  );
}

interface DeliveryChallanPDFProps {
  challan: DeliveryChallan;
  company: Company;
  party?: Customer | null;
}

const DEFAULT_TERMS = [
  'No. claim or Dispute arising from change in quality or shortage in meter or any causes whatsoever will not be entertained once the goods are delivered.',
  '2% interest P.M. will be charged if payment is not made within due date.',
  'The goods are despatches at your risk.',
  'Subject to SURAT jurisdiction',
];

const PAGE_CAPACITY = ROWS_PER_SIDE * 2;

export function DeliveryChallanPDF({ challan, company, party }: DeliveryChallanPDFProps) {
  const customer = party ?? challan.customer;
  const items = normalizePdfItems(challan.items);

  const computedMeters = items.reduce((sum, item) => sum + item.meters, 0);
  const totalPieces = items.length > 0 ? items.length : Number(challan.total_pieces) || 0;
  const totalMeters = items.length > 0 ? computedMeters : Number(challan.total_meters) || 0;

  const phones = formatPhones(company.phone);
  const companyAddress = formatCompanyAddress(company) || company.address || '';
  const customerAddress = [customer?.address, customer?.city, customer?.state, customer?.pincode]
    .filter(Boolean)
    .join(', ');
  const [addrLine1, addrLine2] = splitAddressLines(customerAddress);

  const pages = chunkItems(items, PAGE_CAPACITY);

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const leftItems = Array.from(
          { length: ROWS_PER_SIDE },
          (_, i) => pageItems[i] ?? null
        );
        const rightItems = Array.from(
          { length: ROWS_PER_SIDE },
          (_, i) => pageItems[i + ROWS_PER_SIDE] ?? null
        );
        const leftTotals = sumTableTotals(leftItems);
        const rightTotals = sumTableTotals(rightItems);
        const pageOffset = pageIndex * PAGE_CAPACITY;

        return (
          <Page key={pageIndex} size="A4" style={styles.page}>
            <View style={styles.pageBorder} wrap={false}>
              <View style={styles.badgeShadow}>
                <Text style={[styles.badgeText, { color: 'transparent' }]}>DELIVERY CHALLAN</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DELIVERY CHALLAN</Text>
              </View>

              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.topRow}>
                  <View style={styles.religiousWrap}>
                    <Text style={styles.religiousText}>|| શ્રી ગણેશાય નમઃ ||</Text>
                  </View>
                  <View style={styles.phonesWrap}>
                    {phones.map((phone, i) => (
                      <View key={i} style={styles.phoneRow}>
                        <PhoneIcon />
                        <Text style={styles.phoneText}>{phone}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.companyWrap}>
                  <Text style={styles.companyName}>{company.name || ''}</Text>
                  <Text style={styles.tagline}>{(company.tagline || '').toUpperCase()}</Text>
                </View>

                <View style={styles.headerDividerWrapper}>
                  <FancyDivider />
                </View>

                <Text style={styles.gstin}>
                  {company.gst_number ? `GSTIN: ${company.gst_number}` : ''}
                </Text>
              </View>

              {/* ADDRESS BAR */}
              <View style={styles.addressBar}>
                <PinIcon />
                <Text style={styles.addressText}>{companyAddress}</Text>
              </View>

              {/* META SECTION */}
              <View style={styles.metaSection}>
                <View style={styles.metaCol}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Name</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{customer?.name || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Address</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{addrLine1}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={[styles.fieldLabel, { color: 'transparent' }]}>Address</Text>
                    <Text style={[styles.colon, { color: 'transparent' }]}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{addrLine2}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Gst no.</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{customer?.gst_number || ''}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.metaCol}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabelRight}>Date</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>
                        {challan.date ? new Date(challan.date).toLocaleDateString('en-GB') : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabelRight}>Challan No.</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{challan.challan_number || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabelRight}>Quality</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{challan.quality || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabelRight}>Broker</Text>
                    <Text style={styles.colon}>:</Text>
                    <View style={styles.fieldLine}>
                      <Text style={styles.fieldLineText}>{challan.broker || ''}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* TABLES */}
              <View style={styles.tablesWrap}>
                <ItemTable
                  rows={leftItems}
                  startIndex={pageOffset + 1}
                  totalMeters={leftTotals.meters}
                  totalWeight={leftTotals.weight}
                />
                <ItemTable
                  rows={rightItems}
                  startIndex={pageOffset + ROWS_PER_SIDE + 1}
                  totalMeters={rightTotals.meters}
                  totalWeight={rightTotals.weight}
                />
              </View>

              {/* SUMMARY BAR */}
              <View style={styles.summaryBar}>
                <View style={[styles.summaryCell, { alignItems: 'flex-start' }]}>
                  <Text style={styles.summaryText}>
                    Total Pieces: {totalPieces || ''}
                  </Text>
                </View>
                <View style={[styles.summaryCell, { alignItems: 'center' }]}>
                  <Text style={styles.summaryText}>
                    Total MTS. {totalMeters ? totalMeters.toFixed(2) : ''}
                  </Text>
                </View>
                <View style={[styles.summaryCell, styles.summaryCellLast, { alignItems: 'flex-end' }]}>
                  <Text style={styles.summaryText}>
                    {company.hsn_code ? `HSN Code : ${company.hsn_code}` : ''}
                  </Text>
                </View>
              </View>

              {/* FOOTER */}
              <View style={styles.footer}>
                <Text style={styles.footerAck}>
                  RECEIVED THE ABOVE GOODS IN GOOD AND SOUND CONDITION.
                </Text>

                <View style={styles.footerMiddleRow}>
                  <View style={styles.termsCol}>
                    {DEFAULT_TERMS.map((term, i) => (
                      <View key={i} style={styles.termItemWrap}>
                        <Text style={styles.termBullet}>•</Text>
                        <Text style={styles.termText}>{term}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.companyNameCol}>
                    <Text style={styles.forCompanyText}>
                      {company.name ? `For, ${company.name}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.footerBottomRow}>
                  <View style={styles.buyerSignWrap}>
                    <Text style={styles.buyerSignText}>Buyer&apos;s Sign :</Text>
                    <View style={styles.buyerSignLine} />
                  </View>

                  <View style={{ width: '36%', alignItems: 'center' }}>
                    <Text style={styles.guaranteeText}>
                      <Text style={{ color: SECONDARY_COLOR }}>─── </Text>
                      NO DYEING GUARANTEE
                      <Text style={{ color: SECONDARY_COLOR }}> ───</Text>
                    </Text>
                  </View>

                  <View style={styles.signatureLineWrap}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureText}>SIGNATURE</Text>
                  </View>
                </View>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
