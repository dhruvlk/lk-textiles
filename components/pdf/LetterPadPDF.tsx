/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  Svg,
  Path,
  Line,
  Polygon,
  Circle
} from '@react-pdf/renderer'
import Html from 'react-pdf-html'
import type { Company, LetterPad } from '@/types'
import { formatCompanyAddress } from '@/lib/pdf-utils'

// Need to register Gujarati font for the top line if it's dynamic, 
// but we will hardcode the specific decorative text if it's the standard.
// Actually, since it's dynamic company, we should probably assume standard gujarati font registration.
Font.register({
  family: 'Gujarati',
  fonts: [
    { src: '/fonts/NotoSansGujarati-Regular.ttf' },
    { src: '/fonts/NotoSansGujarati-Bold.ttf', fontWeight: 'bold' },
  ],
})



const PRIMARY_COLOR = '#091A42' // Dark Blue
const SECONDARY_COLOR = '#DCA86A' // Gold/Beige
const BORDER_COLOR = '#EFE3D3' // Light beige for borders and bg
const TEXT_COLOR = '#000000'
const WATERMARK_COLOR = '#F9F1E7' // Very light beige for the watermark

const PhoneIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill={TEXT_COLOR} />
  </Svg>
);

const PinIcon = () => (
  <Svg viewBox="0 0 24 24" width="10" height="10">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill={TEXT_COLOR} />
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

// A decorative swish for the watermark
const DecorativeSwish = () => (
  <Svg viewBox="0 0 300 50" width="300" height="50">
    <Path d="M 150 45 C 130 15, 80 5, 20 20 C 60 40, 100 20, 150 10 C 200 20, 240 40, 280 20 C 220 5, 170 15, 150 45 Z" fill={WATERMARK_COLOR} />
    <Path d="M 150 35 C 135 15, 100 10, 50 25 C 80 35, 120 25, 150 18 C 180 25, 220 35, 250 25 C 200 10, 165 15, 150 35 Z" fill="#Fdf9f4" />
    <Polygon points="150,45 145,25 150,15 155,25" fill={WATERMARK_COLOR} />
  </Svg>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    backgroundColor: '#FFFFFF',
    color: TEXT_COLOR,
    flexDirection: 'column',
    position: 'relative',
    padding: 10,
  },
  pageBorder: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkImage: {
    width: 350,
    height: 350,
    opacity: 0.05,
    objectFit: 'contain',
  },
  watermarkTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 220,
    color: WATERMARK_COLOR,
    fontFamily: 'Times-Roman',
    marginBottom: -20,
  },
  headerWrap: {
    paddingTop: 10,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  topTextRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 5,
  },
  religiousText: {
    color: '#FF3B30',
    fontFamily: 'Gujarati',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  phoneBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  phoneText: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 40,
    fontFamily: 'Times-Roman',
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  dividerWrap: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  addressBar: {
    backgroundColor: BORDER_COLOR,
    width: '100%',
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 10,
    color: TEXT_COLOR,
  },
  contentWrapper: {
    flex: 1,
    padding: 30,
    position: 'relative',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 11,
    fontFamily: 'Times-Roman',
  },
  dateLineWrap: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginLeft: 4,
    height: 12, // To align text and line properly
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    position: 'absolute',
    bottom: 2,
    left: 2,
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 1.5,
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: PRIMARY_COLOR,
  },
  footerText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    letterSpacing: 1,
  },
})

// Using react-pdf-html to parse rich text
const htmlStyles = StyleSheet.create({
  p: { margin: 0, marginBottom: 12, fontSize: 11, lineHeight: 1.6 },
  ul: { margin: 0, marginBottom: 12 },
  ol: { margin: 0, marginBottom: 12 },
  li: { marginBottom: 4 },
  strong: { fontFamily: 'Helvetica', fontWeight: 'bold' },
  em: { fontFamily: 'Helvetica', fontStyle: 'italic' },
  u: { textDecoration: 'underline' },
  h1: { fontSize: 16, fontFamily: 'Helvetica', fontWeight: 'bold', marginBottom: 12 },
  h2: { fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'bold', marginBottom: 10 },
  h3: { fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold', marginBottom: 8 },
})

interface LetterPadPDFProps {
  letterPad: LetterPad
  company: Company
}

export function LetterPadPDF({ letterPad, company }: LetterPadPDFProps) {
  const formattedDate = new Date(letterPad.letter_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '/') // E.g. 28.07.2026

  // Fallback Initials (First letters of up to 2 words in company name)
  const initials = company.name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const fullAddress = formatCompanyAddress(company)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageBorder}>
          
          {/* Background Watermark */}
          <View style={styles.watermarkContainer} fixed>
            {company.logo_url ? (
              <Image src={company.logo_url} style={styles.watermarkImage} />
            ) : (
              <View style={styles.watermarkTextWrap}>
                <Text style={styles.watermarkText}>{initials}</Text>
                <DecorativeSwish />
              </View>
            )}
          </View>

          {/* Header */}
          <View style={styles.headerWrap} fixed>
            <View style={styles.topTextRow}>
              {/* Optional Gujarati text commonly used in Indian textiles context, hardcoded per design if this is specific for the user, but we can make it purely decorative or omit if not standard. The design has exactly this. */}
              <Text style={styles.religiousText}>|| શ્રી ગણેશાય નમઃ ||</Text>
              
              {company.phone && (
                <View style={styles.phoneBlock}>
                  <PhoneIcon />
                  <Text style={styles.phoneText}>{company.phone}</Text>
                </View>
              )}
            </View>

            <Text style={styles.companyName}>{company.name}</Text>
            
            {company.tagline && (
              <Text style={styles.tagline}>{company.tagline}</Text>
            )}

            <View style={styles.dividerWrap}>
              <FancyDivider />
            </View>

            <View style={styles.addressBar}>
              <PinIcon />
              <Text style={styles.addressText}>{fullAddress}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentWrapper}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Date : </Text>
              <View style={styles.dateLineWrap}>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </View>

            {letterPad.subject && (
              <Text style={[styles.bodyText, { fontFamily: 'Helvetica', fontWeight: 'bold', marginBottom: 15 }]}>
                Subject: {letterPad.subject}
              </Text>
            )}

            <View style={styles.bodyText}>
              <Html stylesheet={htmlStyles}>
                {letterPad.content}
              </Html>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>THANK YOU FOR YOUR BUSINESS</Text>
            <View style={styles.footerLine} />
          </View>
          
        </View>
      </Page>
    </Document>
  )
}
