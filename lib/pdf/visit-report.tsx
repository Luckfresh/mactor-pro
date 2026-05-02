import {
  Document, Page, Text, View, StyleSheet, Image, Link,
} from '@react-pdf/renderer'
import type { Visit } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#f59e0b' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 14 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#e2e8f0', padding: '5 8', marginBottom: 7,
  },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 130, color: '#64748b', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  value: { flex: 1, color: '#1e293b' },
  textBox: {
    backgroundColor: '#f8fafc', padding: 10, borderRadius: 4,
    lineHeight: 1.5, marginTop: 4,
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  photoBox: { width: 150, alignItems: 'center' },
  photoImg: { width: 150, height: 110, objectFit: 'cover', borderRadius: 4, border: '1px solid #e2e8f0' },
  photoLabel: { fontSize: 8, color: '#64748b', marginTop: 3, textAlign: 'center' },
  photoLink: { fontSize: 8, color: '#4f46e5', textDecoration: 'underline', marginTop: 2 },
  footer: {
    position: 'absolute', bottom: 30, left: 40, right: 40,
    fontSize: 8, color: '#94a3b8', textAlign: 'center',
  },
})

interface VisitReportProps {
  visit: Visit
  cycleVisits: number
  cycleHours: number
  cycleCost: number
  cycleLabel: string
}

function PhotoSection({ urls, sectionLabel }: { urls: string[]; sectionLabel: string }) {
  if (urls.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionLabel}</Text>
      <View style={styles.photoGrid}>
        {urls.map((url, i) => {
          const fileId = url.match(/id=([\w-]+)/)?.[1]
          const thumb = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w300` : url
          const open = fileId ? `https://drive.google.com/open?id=${fileId}` : url
          return (
            <View key={i} style={styles.photoBox}>
              <Image src={thumb} style={styles.photoImg} />
              <Link src={open} style={styles.photoLink}>Ver foto {urls.length > 1 ? i + 1 : ''}</Link>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function parsePhotos(raw: string | null): string[] {
  if (!raw) return []
  return raw.split(',').map(u => u.trim()).filter(u => u.startsWith('http'))
}

export function VisitReportPDF({ visit, cycleVisits, cycleHours, cycleCost, cycleLabel }: VisitReportProps) {
  const beforePhotos = parsePhotos(visit.photos.before)
  const afterPhotos = parsePhotos(visit.photos.after)

  const typeLabel = visit.source === 'Repair' ? 'Repair / Work Order'
    : visit.source === 'Inspection' ? 'Inspection'
    : visit.visitType

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>MACTOR</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>
            Generated: {new Date().toISOString().split('T')[0]}
          </Text>
        </View>

        <Text style={styles.title}>Visit Report</Text>

        {/* Visit Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Details</Text>
          {([
            ['Building',      visit.building],
            ['Unit',          visit.unitId],
            ['Area',          visit.areaName || visit.unitId],
            ['Date',          visit.date],
            ['Technician',    visit.technician],
            ['Type',          typeLabel],
            ['Hours',         `${visit.duration}h`],
            ['Material Cost', `$${visit.materialCost.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Current cycle summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Cycle Summary — {cycleLabel}</Text>
          {([
            ['Visits this cycle',    String(cycleVisits)],
            ['Hours this cycle',     `${cycleHours}h`],
            ['Materials this cycle', `$${cycleCost.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Problem / before notes */}
        {visit.problem ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problem</Text>
            <Text style={styles.textBox}>{visit.problem}</Text>
          </View>
        ) : null}

        {/* Before photos */}
        <PhotoSection urls={beforePhotos} sectionLabel="Before Photos" />

        {/* Work performed / after notes */}
        {visit.workPerformed ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Performed</Text>
            <Text style={styles.textBox}>{visit.workPerformed}</Text>
          </View>
        ) : null}

        {/* After photos */}
        <PhotoSection urls={afterPhotos} sectionLabel="After Photos" />

        <Text style={styles.footer}>
          Generated by Mactor Pro · mactorconstruction.com
        </Text>
      </Page>
    </Document>
  )
}
