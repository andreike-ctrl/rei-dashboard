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
  // Optional second series
  metricType2?: string;
  label2?: string;
  color2?: string;
}

interface ChartDataPoint {
  label: string;
  sortKey: string;
  value?: number;
  value2?: number;
}

function buildQuarterMap(metrics: Metric[], metricType: string): Map<string, { value: number; sortKey: string }> {
  const byQuarter = new Map<string, { value: number; sortKey: string }>();
  for (const m of metrics.filter((m) => m.metric_type === metricType)) {
    const key = formatQuarter(m.as_of_date);
    const existing = byQuarter.get(key);
    if (!existing || m.as_of_date > existing.sortKey) {
      byQuarter.set(key, { value: m.metric_value, sortKey: m.as_of_date });
    }
  }
  return byQuarter;
}

export function MetricChart({
  metrics,
  metricType,
  title,
  formatValue,
  color = "#1e40af",
  metricType2,
  label2,
  color2,
}: MetricChartProps) {
  const data = useMemo(() => {
    const primary = buildQuarterMap(metrics, metricType);
    const secondary = metricType2 ? buildQuarterMap(metrics, metricType2) : new Map();

    // Union of all quarter labels
    const allLabels = new Set([...primary.keys(), ...secondary.keys()]);

    return Array.from(allLabels)
      .map((label) => {
        const p = primary.get(label);
        const s = secondary.get(label);
        return {
          label,
          sortKey: p?.sortKey ?? s?.sortKey ?? label,
          ...(p != null ? { value: p.value } : {}),
          ...(s != null ? { value2: s.value } : {}),
        } as ChartDataPoint;
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [metrics, metricType, metricType2]);

  const hasPrimary = data.some((d) => d.value != null);

  if (!hasPrimary) {
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

  const hasSecondary = data.some((d) => d.value2 != null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasSecondary && label2 && (
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: color }} />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full" style={{ backgroundColor: color2 }} />
              {label2}
            </span>
          </div>
        )}
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
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {point.label}
                      </p>
                      {point.value != null && (
                        <p className="text-sm font-semibold text-foreground">
                          Actual: {formatValue(point.value)}
                        </p>
                      )}
                      {point.value2 != null && label2 && (
                        <p className="text-sm font-semibold" style={{ color: color2 }}>
                          {label2}: {formatValue(point.value2)}
                        </p>
                      )}
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
                connectNulls
              />
              {hasSecondary && (
                <Line
                  type="monotone"
                  dataKey="value2"
                  stroke={color2}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 3, fill: color2 }}
                  activeDot={{ r: 5, fill: color2 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
