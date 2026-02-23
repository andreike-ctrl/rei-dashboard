import { useMemo } from "react";
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
import { formatCurrency, formatQuarter } from "@/lib/format";
import type { Transaction, Valuation } from "@/types/database";

const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

interface ClientNavChartProps {
  transactions: Transaction[];
  valuations: Valuation[];
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  nav: number;
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function ClientNavChart({
  transactions,
  valuations,
}: ClientNavChartProps) {
  const data = useMemo(() => {
    if (valuations.length === 0) return [];

    // Sort transactions by date to compute cumulative units over time
    const unitTxns = transactions
      .filter((t) => UNIT_TRANSACTION_TYPES.has(t.type) && t.units != null)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group valuations by quarter, keeping the last valuation per property per quarter
    const sorted = [...valuations].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const byQuarter = new Map<string, Map<number, number>>();
    const quarterDates = new Map<string, string>(); // quarter -> latest date in that quarter

    for (const v of sorted) {
      const qLabel = formatQuarter(v.date);
      if (!byQuarter.has(qLabel)) {
        byQuarter.set(qLabel, new Map());
      }
      byQuarter.get(qLabel)!.set(v.property_id, v.nav_per_unit);

      const existing = quarterDates.get(qLabel);
      if (!existing || v.date > existing) {
        quarterDates.set(qLabel, v.date);
      }
    }

    // Build running nav_per_unit and compute client NAV at each quarter
    const quarterKeys = Array.from(byQuarter.keys());
    const runningNavPerUnit = new Map<number, number>();
    const points: ChartDataPoint[] = [];

    for (const qLabel of quarterKeys) {
      const quarterData = byQuarter.get(qLabel)!;
      for (const [propId, npu] of quarterData) {
        runningNavPerUnit.set(propId, npu);
      }

      // Compute cumulative units per property up to this quarter's end date
      const endDate = quarterDates.get(qLabel)!;
      const unitsByProperty = new Map<number, number>();
      for (const t of unitTxns) {
        if (t.date > endDate) break;
        unitsByProperty.set(
          t.property_id,
          (unitsByProperty.get(t.property_id) ?? 0) + t.units!
        );
      }

      // Client NAV = sum of (units × nav_per_unit) across properties
      let totalNav = 0;
      for (const [propId, units] of unitsByProperty) {
        totalNav += units * (runningNavPerUnit.get(propId) ?? 0);
      }

      const match = qLabel.match(/Q(\d) (\d{4})/);
      const sortKey = match ? `${match[2]}-${match[1]}` : qLabel;

      points.push({ label: qLabel, sortKey, nav: totalNav });
    }

    return points.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [transactions, valuations]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>NAV Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No valuation data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>NAV Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <defs>
                <linearGradient
                  id="clientNavGradient"
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
                        {formatCurrency(point.nav)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="nav"
                stroke="#1e40af"
                strokeWidth={2}
                fill="url(#clientNavGradient)"
                dot={{ r: 3, fill: "#1e40af" }}
                activeDot={{ r: 5, fill: "#1e40af" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
