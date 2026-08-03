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
import { isDistribution } from "@/lib/transactionTypes";
import type { Transaction } from "@/types/database";

interface DividendsChartProps {
  transactions: Transaction[];
  vo2Raise?: number | null;
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  distributionAmount: number;
  refiAmount: number;
  returnOfCapitalAmount: number;
  amount: number;
  yield?: number;
}

const DISTRIBUTION_COLOR = "#1e40af";
const REFI_COLOR = "#7c3aed";
const RETURN_OF_CAPITAL_COLOR = "#0d9488";

function formatHalf(dateStr: string): { label: string; sortKey: string } {
  const date = new Date(dateStr + "T00:00:00");
  const half = date.getMonth() < 6 ? 1 : 2;
  const year = date.getFullYear();
  return { label: `H${half} ${year}`, sortKey: `${year}-${half}` };
}

function buildHalfYearDividends(transactions: Transaction[]): ChartDataPoint[] {
  const dividends = transactions.filter((t) => isDistribution(t.type));

  const byHalf = new Map<
    string,
    {
      label: string;
      sortKey: string;
      distributionAmount: number;
      refiAmount: number;
      returnOfCapitalAmount: number;
    }
  >();

  for (const t of dividends) {
    const { label, sortKey } = formatHalf(t.date);
    const existing = byHalf.get(sortKey) ?? {
      label,
      sortKey,
      distributionAmount: 0,
      refiAmount: 0,
      returnOfCapitalAmount: 0,
    };
    if (t.type === "Refi") {
      existing.refiAmount += t.cash_amount;
    } else if (t.type === "Return of Capital") {
      existing.returnOfCapitalAmount += t.cash_amount;
    } else {
      existing.distributionAmount += t.cash_amount;
    }
    byHalf.set(sortKey, existing);
  }

  return Array.from(byHalf.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((d) => ({
      ...d,
      amount: d.distributionAmount + d.refiAmount + d.returnOfCapitalAmount,
    }));
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DividendsChart({ transactions, vo2Raise }: DividendsChartProps) {
  const data = buildHalfYearDividends(transactions).map((d) => ({
    ...d,
    yield: vo2Raise ? d.amount / vo2Raise : undefined,
  }));

  const hasRefi = data.some((d) => d.refiAmount !== 0);
  const hasReturnOfCapital = data.some((d) => d.returnOfCapitalAmount !== 0);
  const hasBreakdown = hasRefi || hasReturnOfCapital;

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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Distributions Over Time</CardTitle>
        {hasBreakdown && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: DISTRIBUTION_COLOR }}
              />
              Distribution
            </span>
            {hasRefi && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: REFI_COLOR }}
                />
                Refi
              </span>
            )}
            {hasReturnOfCapital && (
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: RETURN_OF_CAPITAL_COLOR }}
                />
                Return of Capital
              </span>
            )}
          </div>
        )}
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
                      {hasBreakdown && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Distribution: {formatCurrency(point.distributionAmount)}
                          </p>
                          {hasRefi && (
                            <p className="text-xs text-muted-foreground">
                              Refi: {formatCurrency(point.refiAmount)}
                            </p>
                          )}
                          {hasReturnOfCapital && (
                            <p className="text-xs text-muted-foreground">
                              Return of Capital: {formatCurrency(point.returnOfCapitalAmount)}
                            </p>
                          )}
                        </>
                      )}
                      {point.yield != null && (
                        <p className="text-xs text-muted-foreground">
                          Dist / Raise: {(point.yield * 100).toFixed(2)}%
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="distributionAmount"
                stackId="dist"
                fill={DISTRIBUTION_COLOR}
                radius={0}
                maxBarSize={48}
              />
              <Bar
                dataKey="refiAmount"
                stackId="dist"
                fill={REFI_COLOR}
                radius={0}
                maxBarSize={48}
              />
              <Bar
                dataKey="returnOfCapitalAmount"
                stackId="dist"
                fill={RETURN_OF_CAPITAL_COLOR}
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
