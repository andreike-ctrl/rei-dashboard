import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import type { Client, Investor, Property, PropertyLocation } from "@/types/database";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtDateShort(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
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

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

// ─── Portfolio Overview page helpers ───────────────────────────────────────────

const ASSET_CLASS_COLORS: Record<string, string> = {
  Multifamily: "#1e40af",
  Student: "#16a34a",
  Office: "#94a3b8",
};
const DEFAULT_CLASS_COLOR = "#64748b";
const PIE_COLORS = ["#1e40af", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#475569"];

function classColor(assetClass: string, index: number): string {
  return ASSET_CLASS_COLORS[assetClass] ?? PIE_COLORS[index % PIE_COLORS.length] ?? DEFAULT_CLASS_COLOR;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Fixed on the continental U.S. so the map always shows the whole country,
// regardless of where the invested properties happen to fall. Centered a bit
// east of the country's true geographic center — Newfoundland/the Atlantic
// maritimes stick out further east than Florida does south, so centering on
// -98.35 (the geographic center) left the landmass hugging the right edge.
const US_CENTER = { lat: 39.5, lon: -90 };
const US_ZOOM = 2.5;

// Pins are a plain neutral color (not asset-class-coded) — this map is just
// for "where", the donut charts below already cover the type/state breakdown.
const MAP_PIN_COLOR = "64748b";

function staticMapUrl(locs: { lat: number; lon: number }[]): string {
  const pins = locs.map((l) => `pin-s+${MAP_PIN_COLOR}(${l.lon},${l.lat})`).join(",");
  // Requesting a larger canvas than the map is displayed at (same aspect ratio,
  // same center/zoom) shrinks the pins' apparent size relative to the map,
  // since Mapbox's "pin-s" marker has a fixed pixel footprint.
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pins}/${US_CENTER.lon},${US_CENTER.lat},${US_ZOOM},0/750x420@2x?access_token=${MAPBOX_TOKEN}`;
}

// Donut chart built from raw SVG arcs (react-pdf has no charting primitives of its own).
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 32, cy = 32, outerR = 29, innerR = 17;

  const slices = data.map((d, i) => {
    const before = data.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const after = before + d.value;
    const startAngle = (before / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (after / total) * 2 * Math.PI - Math.PI / 2;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const x1o = cx + outerR * Math.cos(startAngle), y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle), y2o = cy + outerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(endAngle), y2i = cy + innerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(startAngle), y1i = cy + innerR * Math.sin(startAngle);

    const path = data.length === 1
      ? `M ${cx - outerR} ${cy} A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy} A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy} M ${cx - innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy} A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy} Z`
      : `M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i} Z`;

    return { ...d, path };
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        {slices.map((slice) => (
          <Path key={slice.name} d={slice.path} fill={slice.color} fillRule="evenodd" />
        ))}
      </Svg>
      <View style={{ gap: 6 }}>
        {data.map((d) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <View key={d.name} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.color }} />
              <Text style={{ fontSize: 7.5, color: C.gray800, width: 76 }}>{d.name}</Text>
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gray800, width: 26, textAlign: "right" }}>
                {pct.toFixed(0)}%
              </Text>
              <Text style={{ fontSize: 7.5, color: C.gray600, width: 50, textAlign: "right" }}>
                {fmtCurrency(d.value)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

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
  locations?: PropertyLocation[];
  includePortfolioPage?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NavReportPDF({ client, investors: _investors, period, snapshot, locations = [], includePortfolioPage = false }: Props) {
  const logoSrc = `${window.location.origin}/vo2-logo.png`;

  // ── Portfolio Overview page data ──
  const holdings = snapshot.rows.filter((r) => (r.nav ?? 0) > 0);
  const holdingPropertyIds = new Set(holdings.map((r) => r.property.property_id));

  const navByClass = new Map<string, number>();
  for (const row of holdings) {
    const assetClass = row.property.asset_class || "Other";
    navByClass.set(assetClass, (navByClass.get(assetClass) ?? 0) + (row.nav ?? 0));
  }
  const pieData = Array.from(navByClass.entries())
    .map(([name, value], i) => ({ name, value, color: classColor(name, i) }))
    .sort((a, b) => b.value - a.value);

  const navByState = new Map<string, number>();
  for (const row of holdings) {
    const state = row.property.state || "Other";
    navByState.set(state, (navByState.get(state) ?? 0) + (row.nav ?? 0));
  }
  const statePieData = Array.from(navByState.entries())
    .map(([name, value], i) => ({ name, value, color: classColor(name, i) }))
    .sort((a, b) => b.value - a.value);

  const mapLocations = locations
    .filter((l) => l.type === "building" && holdingPropertyIds.has(l.property_id))
    .map((l) => ({ lat: l.lat, lon: l.lon }));

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
              <View style={{ flex: 2, alignItems: "flex-end" }}>
                <Text style={s.thText}>Capital</Text>
                <Text style={s.thText}>Invested (LTD)</Text>
              </View>
              <View style={{ flex: 2, alignItems: "flex-end" }}>
                <Text style={s.thText}>Current</Text>
                <Text style={s.thText}>Est. NAV</Text>
              </View>
              <Text style={[s.thText, { flex: 2, textAlign: "right" }]}>Distributions (LTD)</Text>
              <View style={{ flex: 2, alignItems: "flex-end" }}>
                <Text style={s.thText}>Other</Text>
                <Text style={s.thText}>Proceeds</Text>
              </View>
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
              {"This report is a period-end snapshot. All figures, including capital invested, distributions received, and Net Asset Value (NAV), reflect transactions and valuations recorded on or before the last day of the stated period. NAV figures represent management's internal estimates of fair value and have not been independently appraised or verified by a third-party valuation firm. Capital invested and distributions received are life-to-date cumulative totals as of the period end. Past performance is not indicative of future results. This document is confidential and intended solely for the named recipient."}
            </Text>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>VO2 Alternatives | Confidential</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>

      {/* ── Portfolio Overview page (optional) ── */}
      {includePortfolioPage && (
        <Page size="LETTER" style={s.page}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Image src={logoSrc} style={s.headerLogo} />
              <Text style={s.headerTitle}>{client.name}</Text>
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerPeriod}>Portfolio Overview</Text>
              <Text style={s.headerDate}>{period}</Text>
            </View>
          </View>

          <View style={s.body}>

            {/* ── Invested Properties table ── */}
            <View style={s.section}>
              <SectionTitle>Invested Properties</SectionTitle>
              <View style={s.tableHead}>
                <Text style={[s.thText, { flex: 2.5 }]}>Property</Text>
                <Text style={[s.thText, { flex: 1.3, textAlign: "right" }]}>Type</Text>
                <Text style={[s.thText, { flex: 2.5, textAlign: "right" }]}>Location</Text>
                <Text style={[s.thText, { flex: 1.7, textAlign: "right" }]}>Acquisition Date</Text>
                <Text style={[s.thText, { flex: 2, fontSize: 6.5, textAlign: "right" }]}>Capital Invested</Text>
              </View>
              {holdings.map((row) => (
                <View key={row.property.property_id} style={s.tableRow}>
                  <Text style={[s.tdText, { flex: 2.5 }]}>{row.property.name}</Text>
                  <Text style={[s.tdText, { flex: 1.3, textAlign: "right" }]}>{row.property.asset_class || "—"}</Text>
                  <Text style={[s.tdText, { flex: 2.5, textAlign: "right" }]}>
                    {row.property.msa || "—"}{row.property.state ? `, ${row.property.state}` : ""}
                  </Text>
                  <Text style={[s.tdText, { flex: 1.7, textAlign: "right" }]}>{fmtDateShort(row.property.investment_date)}</Text>
                  <Text style={[s.tdText, { flex: 2, textAlign: "right" }]}>{fmtCurrency(row.capital)}</Text>
                </View>
              ))}
            </View>

            {/* ── Properties map ── */}
            <View style={s.section}>
              <SectionTitle>Properties Map</SectionTitle>
              {mapLocations.length > 0 ? (
                <View style={{ width: "100%", height: 190, borderRadius: 6, overflow: "hidden" }}>
                  <Image
                    src={staticMapUrl(mapLocations)}
                    style={{ width: "100%", height: 222, objectFit: "cover" }}
                  />
                </View>
              ) : (
                <Text style={{ fontSize: 8, color: C.gray400 }}>No location data available.</Text>
              )}
            </View>

            {/* ── NAV Exposure by Type + by State (side by side) ── */}
            <View style={[s.section, { flexDirection: "row", gap: 24 }]}>
              <View style={{ flex: 1 }}>
                <SectionTitle>NAV Exposure by Type</SectionTitle>
                {pieData.length > 0 ? (
                  <DonutChart data={pieData} />
                ) : (
                  <Text style={{ fontSize: 8, color: C.gray400 }}>No NAV data available.</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <SectionTitle>NAV Exposure by State</SectionTitle>
                {statePieData.length > 0 ? (
                  <DonutChart data={statePieData} />
                ) : (
                  <Text style={{ fontSize: 8, color: C.gray400 }}>No NAV data available.</Text>
                )}
              </View>
            </View>

          </View>

          {/* ── Footer ── */}
          <View style={s.footer} fixed>
            <Text style={s.footerText}>VO2 Alternatives | Confidential</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>

        </Page>
      )}
    </Document>
  );
}
