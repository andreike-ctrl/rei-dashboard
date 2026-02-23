import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatQuarter } from "@/lib/format";
import type { Valuation } from "@/types/database";

interface ValuationChartProps {
  valuations: Valuation[];
}

interface ChartDataPoint {
  date: string;
  label: string;
  nav: number;
}

function groupByQuarter(valuations: Valuation[]): ChartDataPoint[] {
  const sorted = [...valuations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Use the last valuation in each quarter
  const quarterMap = new Map<string, Valuation>();
  for (const v of sorted) {
    const key = formatQuarter(v.date);
    quarterMap.set(key, v);
  }

  return Array.from(quarterMap.entries()).map(([label, v]) => ({
    date: v.date,
    label,
    nav: v.nav,
  }));
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function ValuationChart({ valuations }: ValuationChartProps) {
  if (valuations.length === 0) {
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

  const data = groupByQuarter(valuations);

  return (
    <Card>
      <CardHeader>
        <CardTitle>NAV Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
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
              <Line
                type="monotone"
                dataKey="nav"
                stroke="#1e40af"
                strokeWidth={2}
                dot={{ r: 3, fill: "#1e40af" }}
                activeDot={{ r: 5, fill: "#1e40af" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
