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
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingTop: 2,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headerLogo: {
    width: 80,
    objectFit: "contain",
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 7,
    color: C.gray400,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: C.gray600,
    marginTop: 3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerPeriod: {
    fontSize: 8,
    color: C.gray400,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerDate: {
    fontSize: 8,
    color: C.gray400,
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
    color: C.gray800,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
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
  clientBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  clientAddress: {
    flexDirection: "column",
    gap: 2,
  },
  clientName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.gray800,
    marginBottom: 4,
  },
  clientLine: {
    fontSize: 8.5,
    color: C.gray600,
  },
  clientDateBlock: {
    alignItems: "flex-end",
  },
  clientDateLabel: {
    fontSize: 7,
    color: C.gray800,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  clientDateValue: {
    fontSize: 8.5,
    color: C.gray800,
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.gray400,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 0,
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
    color: C.gray800,
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
  otherProceeds: number;
  nav: number | null;
  moic: number | null;
  profitLoss: number;
}

export interface NavSnapshot {
  rows: NavSnapshotRow[];
  totalCapital: number;
  totalDistributions: number;
  totalOtherProceeds: number;
  totalNav: number;
  totalMoic: number | null;
  totalProfitLoss: number;
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

  return (
    <Document title={`${client.name} — NAV Report ${period}`} author="VO2 Alternatives">
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image src={logoSrc} style={s.headerLogo} />
            <Text style={s.headerTitle}>{client.name}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerPeriod}>NAV Report</Text>
            <Text style={s.headerDate}>{fmtDate(new Date().toISOString().slice(0, 10))}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Client Address Block ── */}
          <View style={s.clientBlock}>
            <View style={s.clientAddress}>
              <Text style={s.clientName}>{client.name}</Text>
              {client.address ? <Text style={s.clientLine}>{client.address}</Text> : null}
              {client.domicile ? <Text style={s.clientLine}>{client.domicile}</Text> : null}
            </View>
            <View style={s.clientDateBlock}>
              <Text style={s.clientDateLabel}>Period-End Snapshot</Text>
              <Text style={s.clientDateValue}>{period}</Text>
            </View>
          </View>

          {/* ── Portfolio Summary ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Portfolio Summary</Text>
            {[
              { label: "Total Capital Invested (Life to Date)", value: fmtCurrency(snapshot.totalCapital) },
              { label: "Current NAV", value: fmtCurrency(snapshot.totalNav) },
              { label: "Total Distributions Received (Life to Date)", value: fmtCurrency(snapshot.totalDistributions) },
              { label: "Other Proceeds (Sale / Redemption)", value: fmtCurrency(snapshot.totalOtherProceeds) },
              { label: "Estimated Profit / Loss", value: fmtCurrency(snapshot.totalProfitLoss) },
              { label: "Estimated MOIC", value: fmtMultiple(snapshot.totalMoic) },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.gray100 }}>
                <Text style={{ fontSize: 8.5, color: C.gray600 }}>{item.label}</Text>
                <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.gray800 }}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* ── Holdings Table ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Holdings</Text>
            <View style={s.tableHead}>
              <Text style={[s.thText, { flex: 3 }]}>Property</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Capital Invested (LTD)</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Current NAV</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Distributions (LTD)</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Other Proceeds</Text>
              <Text style={[s.thText, { flex: 1, textAlign: "right" }]}>Est. MOIC</Text>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Profit / Loss</Text>
            </View>
            {snapshot.rows.map((row) => (
              <View key={row.property.property_id} style={s.tableRow}>
                <Text style={[s.tdText, { flex: 3 }]}>{row.property.name}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.capital)}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{row.nav != null ? fmtCurrency(row.nav) : "—"}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.distributions)}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{row.otherProceeds !== 0 ? fmtCurrency(row.otherProceeds) : "—"}</Text>
                <Text style={[s.tdText, { flex: 1, textAlign: "right" }]}>{fmtMultiple(row.moic)}</Text>
                <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.profitLoss)}</Text>
              </View>
            ))}
            <View style={s.tableFooter}>
              <Text style={[s.tdBold, { flex: 3 }]}>Total</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalCapital)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalNav)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalDistributions)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalOtherProceeds)}</Text>
              <Text style={[s.tdBold, { flex: 1, textAlign: "right" }]}>{fmtMultiple(snapshot.totalMoic)}</Text>
              <Text style={[s.tdBold, { flex: 2, textAlign: "right" }]}>{fmtCurrency(snapshot.totalProfitLoss)}</Text>
            </View>
          </View>

          {/* ── Disclaimer ── */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gray400, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Disclaimer</Text>
            <Text style={{ fontSize: 7, color: C.gray400, lineHeight: 1.6 }}>
              {"This report is a period-end snapshot. All figures — including capital invested, distributions received, and Net Asset Value (NAV) — reflect transactions and valuations recorded on or before the last day of the stated period. NAV figures represent management's internal estimates of fair value and have not been independently appraised or verified by a third-party valuation firm. Capital invested and distributions received are life-to-date cumulative totals as of the period end. Past performance is not indicative of future results. This document is confidential and intended solely for the named recipient."}
            </Text>
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
