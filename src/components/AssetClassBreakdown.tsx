import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { Transaction, Property } from "@/types/database";

const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

const COLORS = [
  "#1e40af",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#475569",
];

interface AssetClassBreakdownProps {
  transactions: Transaction[];
  properties: Property[];
  latestNavPerUnit: Map<number, number>;
}

interface SliceData {
  name: string;
  value: number;
}

export function AssetClassBreakdown({
  transactions,
  properties,
  latestNavPerUnit,
}: AssetClassBreakdownProps) {
  const data = useMemo(() => {
    const propertyMap = new Map(properties.map((p) => [p.property_id, p]));

    // Compute units per property
    const unitsByProperty = new Map<number, number>();
    for (const t of transactions) {
      if (!UNIT_TRANSACTION_TYPES.has(t.type) || t.units == null) continue;
      unitsByProperty.set(
        t.property_id,
        (unitsByProperty.get(t.property_id) ?? 0) + t.units
      );
    }

    // Compute NAV per asset class
    const navByClass = new Map<string, number>();
    for (const [propId, units] of unitsByProperty) {
      const nav = units * (latestNavPerUnit.get(propId) ?? 0);
      if (nav <= 0) continue;
      const prop = propertyMap.get(propId);
      const assetClass = prop?.asset_class ?? "Other";
      navByClass.set(assetClass, (navByClass.get(assetClass) ?? 0) + nav);
    }

    return Array.from(navByClass.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, properties, latestNavPerUnit]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Class Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No asset class data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Class Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Donut chart with center label */}
          <div className="relative h-[240px] w-[240px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as SliceData;
                    const pct = ((point.value / total) * 100).toFixed(1);
                    return (
                      <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
                        <p className="text-xs font-medium text-muted-foreground">
                          {point.name}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(point.value)} ({pct}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">Total NAV</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Custom legend */}
          <div className="flex flex-1 flex-col gap-2">
            {data.map((d, i) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-sm text-foreground">{d.name}</span>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {pct}%
                  </span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
