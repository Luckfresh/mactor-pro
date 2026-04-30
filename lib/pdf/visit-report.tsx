import {
  Document, Page, Text, View, StyleSheet
} from '@react-pdf/renderer'
import type { Visit } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#f59e0b' },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11, fontFamily: 'Helvetica-Bold',
    backgroundColor: '#e2e8f0', padding: '6 8', marginBottom: 8
  },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 130, color: '#64748b', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  value: { flex: 1, color: '#1e293b' },
  textBox: {
    backgroundColor: '#f8fafc', padding: 10, borderRadius: 4,
    lineHeight: 1.5, marginTop: 4
  },
  footer: {
    position: 'absolute', bottom: 30, left: 40, right: 40,
    fontSize: 8, color: '#94a3b8', textAlign: 'center'
  },
})

interface VisitReportProps {
  visit: Visit
  totalVisits: number
  totalHours: number
  totalCost: number
}

export function VisitReportPDF({ visit, totalVisits, totalHours, totalCost }: VisitReportProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>MACTOR</Text>
          <Text style={{ fontSize: 9, color: '#64748b' }}>
            Generado: {new Date().toISOString().split('T')[0]}
          </Text>
        </View>

        <Text style={styles.title}>Visit Report</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la visita</Text>
          {([
            ['Edificio', visit.building],
            ['Unidad', visit.unitId],
            ['Fecha', visit.date],
            ['Técnico', visit.technician],
            ['Tipo de visita', visit.visitType],
            ['Horas', `${visit.duration}h`],
            ['Costo materiales', `$${visit.materialCost.toLocaleString('en-CA')}`],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la unidad</Text>
          {([
            ['Total visitas', String(totalVisits)],
            ['Total horas', `${totalHours}h`],
            ['Total materiales', `$${totalCost.toLocaleString('en-CA')}`],
          ] as [string, string][]).map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>

        {visit.problem ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problema</Text>
            <Text style={styles.textBox}>{visit.problem}</Text>
          </View>
        ) : null}

        {visit.workPerformed ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajo realizado</Text>
            <Text style={styles.textBox}>{visit.workPerformed}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Generado por MacTor Pro · mactorconstruction.com
        </Text>
      </Page>
    </Document>
  )
}
