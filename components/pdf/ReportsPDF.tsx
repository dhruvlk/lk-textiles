import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#111111',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  meta: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 14,
    marginBottom: 8,
    color: '#1e2b4d',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 6,
  },
  label: {
    width: '58%',
    color: '#374151',
  },
  value: {
    width: '42%',
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
});

export type ReportPdfLine = {
  label: string;
  value: string;
};

export function ReportsPDF({
  title,
  companyName,
  periodLabel,
  lines,
}: {
  title: string;
  companyName: string;
  periodLabel: string;
  lines: ReportPdfLine[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {companyName} · {periodLabel} · Generated{' '}
          {new Date().toLocaleString('en-IN')}
        </Text>

        <Text style={styles.sectionTitle}>Summary</Text>
        {lines.map((line) => (
          <View key={line.label} style={styles.row} wrap={false}>
            <Text style={styles.label}>{line.label}</Text>
            <Text style={styles.value}>{line.value}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
