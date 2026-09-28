import React from 'react';
import { View, Text, Image, StyleSheet, Svg, Path, Polygon } from '@react-pdf/renderer';
import { Company } from '@/types';

// Matching LetterPad watermark color (very light beige)
export const WATERMARK_COLOR = '#F9F1E7';

/**
 * Derives initials from company name (e.g. "Vaishali Textile" -> "VT")
 * Matches existing LetterPad fallback initials logic.
 */
export function getCompanyInitials(name?: string | null): string {
  if (!name) return 'VT';
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'VT'
  );
}

/**
 * Decorative swish for the watermark matching LetterPad
 */
export const DecorativeSwish = () => (
  <Svg viewBox="0 0 300 50" width="300" height="50">
    <Path
      d="M 150 45 C 130 15, 80 5, 20 20 C 60 40, 100 20, 150 10 C 200 20, 240 40, 280 20 C 220 5, 170 15, 150 45 Z"
      fill={WATERMARK_COLOR}
    />
    <Path
      d="M 150 35 C 135 15, 100 10, 50 25 C 80 35, 120 25, 150 18 C 180 25, 220 35, 250 25 C 200 10, 165 15, 150 35 Z"
      fill="#FDF9F4"
    />
    <Polygon points="150,45 145,25 150,15 155,25" fill={WATERMARK_COLOR} />
  </Svg>
);

export const watermarkStyles = StyleSheet.create({
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
});

export interface CompanyWatermarkProps {
  company: Company | { name?: string | null; logo_url?: string | null };
}

export function CompanyWatermark({ company }: CompanyWatermarkProps) {
  const initials = getCompanyInitials(company?.name);

  return (
    <View style={watermarkStyles.watermarkContainer} fixed>
      {company?.logo_url ? (
        <Image src={company.logo_url} style={watermarkStyles.watermarkImage} />
      ) : (
        <View style={watermarkStyles.watermarkTextWrap}>
          <Text style={watermarkStyles.watermarkText}>{initials}</Text>
          <DecorativeSwish />
        </View>
      )}
    </View>
  );
}
