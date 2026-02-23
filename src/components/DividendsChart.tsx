import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/types/database";

interface DividendsChartProps {
  transactions: Transaction[];
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  amount: number;
}

function formatHalf(dateStr: string): { label: string; sortKey: string } {
  const date = new Date(dateStr + "T00:00:00");
  const half = date.getMonth() < 6 ? 1 : 2;
  const year = date.getFullYear();
  return { label: `H${half} ${year}`, sortKey: `${year}-${half}` };
}

function buildHalfYearDividends(transactions: Transaction[]): ChartDataPoint[] {
  const dividends = transactions.filter((t) => t.type === "Distribution");

  const byHalf = new Map<string, { label: string; sortKey: string; amount: number }>();

  for (const t of dividends) {
    const { label, sortKey } = formatHalf(t.date);
    const existing = byHalf.get(sortKey);
    if (existing) {
      existing.amount += t.cash_amount;
    } else {
      byHalf.set(sortKey, { label, sortKey, amount: t.cash_amount });
    }
  }

  return Array.from(byHalf.values()).sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey)
  );
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DividendsChart({ transactions }: DividendsChartProps) {
  const data = buildHalfYearDividends(transactions);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distributions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No distribution data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distributions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                        {formatCurrency(point.amount)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="amount"
                fill="#1e40af"
                radius={0}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
