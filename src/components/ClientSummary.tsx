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
import { formatCurrency, formatMultiple } from "@/lib/format";

interface ClientSummaryProps {
  clientCount: number;
  totalAum: number;
  totalCapitalCalled: number;
  totalDividends: number;
  totalOtherProceeds: number;
  weightedAvgMoic: number | null;
  aumByClient: { name: string; aum: number }[];
}

function formatYAxisTick(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function ClientSummary({
  clientCount,
  totalAum,
  totalCapitalCalled,
  totalDividends,
  totalOtherProceeds,
  weightedAvgMoic,
  aumByClient,
}: ClientSummaryProps) {
  const chartHeight = Math.max(300, aumByClient.length * 44);

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Clients
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {clientCount}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total AUM
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalAum)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total Capital Called
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(totalCapitalCalled)}
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
            Weighted Avg MOIC
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            {formatMultiple(weightedAvgMoic)}
          </p>
        </CardContent>
      </Card>

      {/* AUM by Client chart */}
      {aumByClient.length > 0 && (
        <div className="sm:col-span-3 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>AUM by Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: chartHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aumByClient}
                    layout="vertical"
                    margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tickFormatter={formatYAxisTick}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                      width={140}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as {
                          name: string;
                          aum: number;
                        };
                        return (
                          <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
                            <p className="text-xs font-medium text-muted-foreground">
                              {point.name}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatCurrency(point.aum)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="aum"
                      fill="#1e40af"
                      radius={0}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
