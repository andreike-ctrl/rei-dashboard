import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatQuarter, formatMultiple } from "@/lib/format";
import { DividendsChart } from "@/components/DividendsChart";
import type { Valuation, Transaction } from "@/types/database";

interface PortfolioSummaryProps {
  /** All valuations for the currently-filtered properties */
  valuations: Valuation[];
  /** Filtered transactions */
  transactions: Transaction[];
  /** Total NAV across filtered properties (latest per property) */
  totalNav: number;
  /** Number of filtered properties */
  propertyCount: number;
  /** Total raised (sum of funding/capital call transactions) */
  totalRaised: number;
  /** Total dividends paid */
  totalDividends: number;
  /** Total other proceeds (sales, distributions, refis, etc.) */
  totalOtherProceeds: number;
  /** Current MOIC = (NAV + Dividends + Other Proceeds) / Raised */
  currentMoic: number | null;
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  totalNav: number;
}

/** Aggregate valuations into total portfolio NAV per quarter. */
function buildQuarterlyTotals(valuations: Valuation[]): ChartDataPoint[] {
  // Group valuations by quarter, keeping the last valuation per property per quarter
  const byQuarter = new Map<string, Map<number, number>>();

  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const v of sorted) {
    const qLabel = formatQuarter(v.date);
    if (!byQuarter.has(qLabel)) {
      byQuarter.set(qLabel, new Map());
    }
    byQuarter.get(qLabel)!.set(v.property_id, v.nav);
  }

  // Build running totals: carry forward each property's last known NAV
  const quarterKeys = Array.from(byQuarter.keys());
  const runningNav = new Map<number, number>();
  const points: ChartDataPoint[] = [];

  for (const qLabel of quarterKeys) {
    const quarterData = byQuarter.get(qLabel)!;
    for (const [propId, nav] of quarterData) {
      runningNav.set(propId, nav);
    }
    const totalNav = Array.from(runningNav.values()).reduce((a, b) => a + b, 0);

    // Build a sortable key from quarter label (e.g. "Q1 2022" -> "2022-1")
    const match = qLabel.match(/Q(\d) (\d{4})/);
    const sortKey = match ? `${match[2]}-${match[1]}` : qLabel;

    points.push({ label: qLabel, sortKey, totalNav });
  }

  return points.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function PortfolioSummary({
  valuations,
  transactions,
  totalNav,
  propertyCount,
  totalRaised,
  totalDividends,
  totalOtherProceeds,
  currentMoic,
}: PortfolioSummaryProps) {
  const data = buildQuarterlyTotals(valuations);

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {/* Stat cards */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Properties
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {propertyCount}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Raised
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalRaised)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total NAV
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalNav)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Distributions
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalDividends)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Other Proceeds
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalOtherProceeds)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Current MOIC
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatMultiple(currentMoic)}
          </p>
        </CardContent>
      </Card>

      {/* Chart spanning full width */}
      <div className="sm:col-span-3 lg:col-span-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio NAV Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No valuation data available.
              </p>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="navGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#1e40af"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#1e40af"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      tickFormatter={formatYAxisTick}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
                            <p className="text-xs font-medium text-muted-foreground">
                              {point.label}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(point.totalNav)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalNav"
                      stroke="#1e40af"
                      strokeWidth={2}
                      fill="url(#navGradient)"
                      dot={{ r: 3, fill: "#1e40af" }}
                      activeDot={{ r: 5, fill: "#1e40af" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dividends chart spanning full width */}
      <div className="sm:col-span-3 lg:col-span-6">
        <DividendsChart transactions={transactions} />
      </div>
    </div>
  );
}
