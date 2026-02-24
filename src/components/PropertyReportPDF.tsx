import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
  G,
} from "@react-pdf/renderer";
import type { Property, Valuation, Transaction, Metric, Investor, Client } from "@/types/database";
import type { PhotoItem } from "@/pages/Report";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}


function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function fmtNumber(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("en-US");
}

function fmtHalf(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  const half = dt.getMonth() < 6 ? "H1" : "H2";
  return `${half} ${dt.getFullYear()}`;
}


// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  navy:      "#0f172a",
  blue:      "#1e40af",
  blueLight: "#dbeafe",
  gray50:    "#f8fafc",
  gray100:   "#f1f5f9",
  gray200:   "#e2e8f0",
  gray400:   "#94a3b8",
  gray600:   "#475569",
  gray800:   "#1e293b",
  white:     "#ffffff",
  ocean:     "#b2d4e8",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
    paddingTop: 36,    // applies to every page — gives page 2+ a top margin
    paddingBottom: 48,
  },

  // ── Header ──
  header: {
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingTop: 2,     // page paddingTop (36) + this (2) = 38pt from top on page 1
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

  // ── Body ──
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },

  // ── Section ──
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

  // ── Grid of stat boxes ──
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statBox: {
    width: "23%",
    backgroundColor: C.gray50,
    borderRadius: 6,
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
  statValueAccent: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.blue,
  },

  // ── Table ──
  table: {
    width: "100%",
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
  tdMuted: {
    fontSize: 8,
    color: C.gray600,
  },

  // ── Two-column layout ──
  twoCol: {
    flexDirection: "row",
    gap: 16,
  },
  colLeft: { flex: 1 },
  colRight: { flex: 1 },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.gray400,
  },
  pageNum: {
    fontSize: 7,
    color: C.gray400,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: C.gray200,
    marginVertical: 16,
  },
});

// Catmull-Rom → cubic bezier smooth path (same algorithm as Recharts "monotone")
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : pts[i + 1];
    const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(2);
    const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(2);
    const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(2);
    const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(2);
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// ─── Sub-components ──────────────────────────────────────────────────────────


function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function HBarChart({
  title,
  data,
  formatValue,
  color,
}: {
  title: string;
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <View>
        <SectionTitle>{title}</SectionTitle>
        <Text style={{ fontSize: 8, color: C.gray400 }}>No data available.</Text>
      </View>
    );
  }
  const maxVal = Math.max(...data.map((d) => d.value));
  return (
    <View>
      <SectionTitle>{title}</SectionTitle>
      <View style={{ gap: 5 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ flex: 1, backgroundColor: C.ocean, borderRadius: 3, height: 15, position: "relative" }}>
              <View
                style={{
                  width: `${Math.max((d.value / maxVal) * 100, 2)}%`,
                  height: 15,
                  backgroundColor: color,
                  borderRadius: 3,
                }}
              />
              <Text style={{ position: "absolute", left: 7, top: 3.5, fontSize: 7.5, color: C.white, fontFamily: "Helvetica-Bold" }}>
                {d.label}
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: C.gray800, width: 52, textAlign: "right" }}>
              {formatValue(d.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LineChart({
  title,
  data,
  formatValue,
  color,
}: {
  title: string;
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <View>
        <SectionTitle>{title}</SectionTitle>
        <Text style={{ fontSize: 8, color: C.gray400 }}>No data available.</Text>
      </View>
    );
  }

  const W = 515;
  const H = 130;
  const padL = 8;
  const padR = 8;
  const padT = 24;
  const padB = 20;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n = data.length;
  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const range = maxVal - minVal || 1;

  const pts = data.map((d, i) => ({
    x: padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
    y: padT + chartH - ((d.value - minVal) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  const linePath = smoothPath(pts);
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1].x} ${padT + chartH} L ${padL} ${padT + chartH} Z`
    : "";
  const gridYs = [0, 0.33, 0.66, 1].map((f) => padT + chartH - f * chartH);

  return (
    <View>
      <SectionTitle>{title}</SectionTitle>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1={`${padT}`} x2="0" y2={`${padT + chartH}`} gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Horizontal grid lines */}
        {gridYs.map((y, i) => (
          <SvgLine
            key={i}
            x1={padL} y1={y}
            x2={W - padR} y2={y}
            stroke={C.gray200} strokeWidth={0.5} strokeDasharray="3,3"
          />
        ))}
        {/* Gradient area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" stroke="none" />
        {/* Line */}
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
        {/* Dots + labels */}
        {pts.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={3} fill={color} />
            <SvgText x={p.x} y={p.y - 8} style={{ fontSize: 7 }} fill={C.gray800} textAnchor="middle">
              {formatValue(p.value)}
            </SvgText>
            <SvgText x={p.x} y={padT + chartH + 13} style={{ fontSize: 7 }} fill={C.gray400} textAnchor="middle">
              {p.label}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}

// ─── Main PDF document ───────────────────────────────────────────────────────

interface Props {
  property: Property;
  valuations: Valuation[];
  transactions: Transaction[];
  metrics: Metric[];
  investors: Investor[];
  clients: Client[];
  period?: string;
  commentary?: string;
  photos?: PhotoItem[];
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export function PropertyReportPDF({ property, valuations: _valuations, transactions: _transactions, metrics, investors: _investors, clients: _clients, period, commentary, photos }: Props) {
  const logoSrc = `${window.location.origin}/vo2-logo.png`;
  const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // ── Chart data ──
  const occupancyData = metrics
    .filter((m) => m.metric_type === "OCCUPANCY")
    .sort((a, b) => a.as_of_date.localeCompare(b.as_of_date))
    .map((m) => ({ label: fmtHalf(m.as_of_date), value: m.metric_value }));

  const avgRentData = metrics
    .filter((m) => m.metric_type === "AVGRENT")
    .sort((a, b) => a.as_of_date.localeCompare(b.as_of_date))
    .map((m) => ({ label: fmtHalf(m.as_of_date), value: m.metric_value }));


  // ── Map height matched to occupancy chart ──
  // Both columns share a SectionTitle so only the bars area height needs to match.
  // Each bar = 15pt, gap between bars = 5pt → n*15 + (n-1)*5 = n*20 - 5
  const occupancyBarAreaH = occupancyData.length > 0 ? occupancyData.length * 20 - 5 : 0;
  const mapH = Math.max(130, occupancyBarAreaH);
  const mapImgH = mapH + 32; // extra 32pt clips the Mapbox logo at bottom

  return (
    <Document
      title={`${property.name} — Property Report`}
      author="VO2 Alternatives"
    >
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Image src={logoSrc} style={s.headerLogo} />
            <Text style={s.headerTitle}>{property.name}</Text>
            <Text style={s.headerSubtitle}>{property.msa}{property.state ? `, ${property.state}` : ""}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerPeriod}>Real Estate Report{period ? `  ·  ${period}` : ""}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Property Details ── */}
          {(() => {
            const rows = [
              [{ label: "Asset Class", value: property.asset_class ?? "—" }, { label: "Strategy", value: property.strategy ?? "—" }],
              [{ label: "Property Class", value: property.property_class ?? "—" }, { label: "Investment Date", value: fmtDate(property.investment_date) }],
              [
                property.beds
                  ? { label: "Units / Beds", value: `${fmtNumber(property.units)} / ${property.beds}` }
                  : { label: "Units", value: fmtNumber(property.units) },
                { label: "Buildings", value: fmtNumber(property.buildings) },
              ],
            ];
            return (
              <View style={s.section}>
                <SectionTitle>Property Details</SectionTitle>
                <View style={{ gap: 6 }}>
                  {rows.map((cols, i) => (
                    <View key={i} style={{ flexDirection: "row" }}>
                      {cols.map((col, j) => (
                        <View key={j} style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                          <Text style={{ fontSize: 7.5, color: C.gray400, textTransform: "uppercase", letterSpacing: 0.4, width: 80 }}>
                            {col.label}
                          </Text>
                          <Text style={{ fontSize: 8.5, color: C.gray800, fontFamily: "Helvetica-Bold" }}>
                            {col.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

          {/* ── Investment Thesis ── */}
          {property.investment_thesis && property.investment_thesis.trim().length > 0 && (
            <View style={s.section}>
              <SectionTitle>Original Investment Thesis</SectionTitle>
              <Text style={{ fontSize: 9, color: C.gray800, lineHeight: 1.6 }}>
                {property.investment_thesis.trim()}
              </Text>
            </View>
          )}

          {/* ── Location + Occupancy (side by side) ── */}
          <View style={[s.section, s.twoCol]}>
            {property.lat != null && property.lon != null ? (
              <View style={s.colLeft}>
                <SectionTitle>Location</SectionTitle>
                <View style={{ width: "100%", height: mapH, borderRadius: 6, overflow: "hidden" }}>
                  <Image
                    src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+1e40af(${property.lon},${property.lat})/${property.lon},${property.lat},4,0/500x280@2x?access_token=${MAPBOX_TOKEN}`}
                    style={{ width: "100%", height: mapImgH, objectFit: "cover" }}
                  />
                </View>
              </View>
            ) : (
              <View style={s.colLeft} />
            )}
            <View style={s.colRight}>
              <HBarChart
                title="Occupancy"
                data={occupancyData}
                formatValue={(v) => `${v.toFixed(1)}%`}
                color={C.blue}
              />
            </View>
          </View>

          {/* ── Average Rent chart ── */}
          <View style={s.section}>
            <LineChart
              title="Average Rent"
              data={avgRentData}
              formatValue={fmtCurrency}
              color={C.blue}
            />
          </View>

          {/* ── Manager Commentary ── */}
          {commentary && commentary.trim().length > 0 && (
            <View style={s.section} wrap={false}>
              <SectionTitle>Manager Commentary</SectionTitle>
              <Text style={{ fontSize: 9, color: C.gray800, lineHeight: 1.6 }}>{commentary.trim()}</Text>
            </View>
          )}

          {/* ── Photo Gallery ── */}
          {photos && photos.length > 0 && (
            <View style={s.section}>
              <SectionTitle>Property Photos</SectionTitle>
              <View style={{ gap: 10 }}>
                {Array.from({ length: Math.ceil(photos.length / 2) }, (_, row) => {
                  const pair = photos.slice(row * 2, row * 2 + 2);
                  return (
                    <View key={row} style={{ flexDirection: "row", gap: 10 }}>
                      {pair.map((photo, col) => (
                        <View key={col} style={{ flex: 1 }}>
                          <Image
                            src={photo.dataUrl}
                            style={{ width: "100%", height: 160, borderRadius: 4, objectFit: "cover" }}
                          />
                          {photo.caption.trim().length > 0 && (
                            <Text style={{ fontSize: 7.5, color: C.gray600, marginTop: 4, textAlign: "center" }}>
                              {photo.caption.trim()}
                            </Text>
                          )}
                        </View>
                      ))}
                      {/* spacer when odd number of photos */}
                      {pair.length === 1 && <View style={{ flex: 1 }} />}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>VO2 Alternatives · Confidential · Report date: {generatedDate}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
