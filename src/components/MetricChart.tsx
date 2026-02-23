import { useMemo } from "react";
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
import { formatQuarter } from "@/lib/format";
import type { Metric } from "@/types/database";

interface MetricChartProps {
  metrics: Metric[];
  metricType: string;
  title: string;
  formatValue: (value: number) => string;
  color?: string;
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  value: number;
}

export function MetricChart({
  metrics,
  metricType,
  title,
  formatValue,
  color = "#1e40af",
}: MetricChartProps) {
  const data = useMemo(() => {
    const filtered = metrics.filter((m) => m.metric_type === metricType);

    // Group by quarter, keeping the latest entry per quarter
    const byQuarter = new Map<string, Metric>();
    for (const m of filtered) {
      const key = formatQuarter(m.as_of_date);
      const existing = byQuarter.get(key);
      if (!existing || m.as_of_date > existing.as_of_date) {
        byQuarter.set(key, m);
      }
    }

    return Array.from(byQuarter.entries())
      .map(([label, m]) => ({
        label,
        sortKey: m.as_of_date,
        value: m.metric_value,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [metrics, metricType]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {title.toLowerCase()} data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
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
                tickFormatter={formatValue}
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
                        {formatValue(point.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color }}
                activeDot={{ r: 5, fill: color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
