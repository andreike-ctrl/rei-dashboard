import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Client, Investor, Property } from "@/types/database";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtMultiple(v: number | null) {
  return v != null ? v.toFixed(2) + "x" : "—";
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  navy:   "#0f172a",
  blue:   "#1e40af",
  gray50: "#f8fafc",
  gray100:"#f1f5f9",
  gray200:"#e2e8f0",
  gray400:"#94a3b8",
  gray600:"#475569",
  gray800:"#1e293b",
  white:  "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
    paddingTop: 36,
    paddingBottom: 48,
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 2,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLogo: {
    width: 80,
    objectFit: "contain",
    marginBottom: 14,
  },
  headerLabel: {
    fontSize: 7,
    color: "#94a3b8",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerPeriod: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  headerDate: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.blue,
  },
  grid: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  statLabel: {
    fontSize: 7,
    color: C.gray400,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.gray800,
  },
  clientRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  clientField: {
    flex: 1,
  },
  clientLabel: {
    fontSize: 7,
    color: C.gray400,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 9,
    color: C.gray800,
    fontFamily: "Helvetica-Bold",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.navy,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.gray50,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableFooter: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 2,
    borderTopColor: C.navy,
    marginTop: 1,
  },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tdText: {
    fontSize: 8,
    color: C.gray800,
  },
  tdBold: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray800,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.gray400 },
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NavSnapshotRow {
  property: Property;
  capital: number;
  distributions: number;
  nav: number | null;
  moic: number | null;
}

export interface NavSnapshot {
  rows: NavSnapshotRow[];
  totalCapital: number;
  totalDistributions: number;
  totalNav: number;
  totalMoic: number | null;
}

interface Props {
  client: Client;
  investors: Investor[];
  period: string;
  snapshot: NavSnapshot;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NavReportPDF({ client, investors: _investors, period, snapshot }: Props) {
  const logoSrc = `${window.location.origin}/vo2-logo.png`;
  const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <Document title={`${client.name} — NAV Report ${period}`} author="VO2 Alternatives">
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Image src={logoSrc} style={s.headerLogo} />
            <Text style={s.headerLabel}>NAV Report</Text>
            <Text style={s.headerTitle}>{client.name}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerPeriod}>{period}</Text>
            <Text style={s.headerDate}>Prepared {generatedDate}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Client Info ── */}
          <View style={s.clientRow}>
            {client.domicile ? (
              <View style={s.clientField}>
                <Text style={s.clientLabel}>Domicile</Text>
                <Text style={s.clientValue}>{client.domicile}</Text>
              </View>
            ) : null}
            {client.email ? (
              <View style={s.clientField}>
                <Text style={s.clientLabel}>Email</Text>
                <Text style={s.clientValue}>{client.email}</Text>
              </View>
            ) : null}
            {client.address ? (
              <View style={s.clientField}>
                <Text style={s.clientLabel}>Address</Text>
                <Text style={s.clientValue}>{client.address}</Text>
              </View>
            ) : null}
            <View style={s.clientField}>
              <Text style={s.clientLabel}>Report Date</Text>
              <Text style={s.clientValue}>{fmtDate(new Date().toISOString().slice(0, 10))}</Text>
            </View>
          </View>

          {/* ── Portfolio Summary ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Portfolio Summary</Text>
            <View style={s.grid}>
              {[
                { label: "Total Invested", value: fmtCurrency(snapshot.totalCapital) },
                { label: "Total Distributions", value: fmtCurrency(snapshot.totalDistributions) },
                { label: "Current NAV", value: fmtCurrency(snapshot.totalNav) },
                { label: "Est. MOIC", value: fmtMultiple(snapshot.totalMoic) },
              ].map((item) => (
                <View key={item.label} style={s.statBox}>
                  <Text style={s.statLabel}>{item.label}</Text>
                  <Text style={s.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Holdings Table ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Holdings</Text>
            <View style={s.tableHead}>
              <Text style={[s.thText, { flex: 3 }]}>Property</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Capital Invested</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Distributions</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>NAV</Text>
              <Text style={[s.thText, { flex: 1, textAlign: "right" }]}>Est. MOIC</Text>
            </View>
            {snapshot.rows.map((row, i) => (
              <View key={row.property.property_id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tdText, { flex: 3 }]}>{row.property.name}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.capital)}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.distributions)}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{row.nav != null ? fmtCurrency(row.nav) : "—"}</Text>
                <Text style={[s.tdText, { flex: 1, textAlign: "right" }]}>{fmtMultiple(row.moic)}</Text>
              </View>
            ))}
            <View style={s.tableFooter}>
              <Text style={[s.tdBold, { flex: 3 }]}>Total</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalCapital)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalDistributions)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalNav)}</Text>
              <Text style={[s.tdBold, { flex: 1, textAlign: "right" }]}>{fmtMultiple(snapshot.totalMoic)}</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>VO2 Alternatives — Confidential</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
