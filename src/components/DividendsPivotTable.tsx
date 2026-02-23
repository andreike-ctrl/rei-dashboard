import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { Transaction, Property } from "@/types/database";

interface DividendsPivotTableProps {
  transactions: Transaction[];
  properties: Property[];
}

function toHalf(dateStr: string): { label: string; sortKey: string } {
  const date = new Date(dateStr + "T00:00:00");
  const half = date.getMonth() < 6 ? 1 : 2;
  const year = date.getFullYear();
  return { label: `H${half} ${year}`, sortKey: `${year}-${half}` };
}

export function DividendsPivotTable({
  transactions,
  properties,
}: DividendsPivotTableProps) {
  const { propertyRows, halfColumns, cellMap, propertyTotals, columnTotals, grandTotal } =
    useMemo(() => {
      const propertyMap = new Map(properties.map((p) => [p.property_id, p]));
      const dividends = transactions.filter((t) => t.type === "Distribution");

      // Collect all half-year periods and build cell map
      const halves = new Map<string, string>(); // sortKey -> label
      const cells = new Map<string, number>(); // "propId-sortKey" -> amount
      const propIds = new Set<number>();

      for (const t of dividends) {
        const { label, sortKey } = toHalf(t.date);
        halves.set(sortKey, label);
        propIds.add(t.property_id);

        const key = `${t.property_id}-${sortKey}`;
        cells.set(key, (cells.get(key) ?? 0) + t.cash_amount);
      }

      // Sort half-year columns chronologically
      const sortedHalves = Array.from(halves.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([sortKey, label]) => ({ sortKey, label }));

      // Sort properties by name
      const sortedProps = Array.from(propIds)
        .map((id) => ({
          id,
          name: propertyMap.get(id)?.name ?? `Property #${id}`,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Compute row totals
      const rowTotals = new Map<number, number>();
      for (const prop of sortedProps) {
        let total = 0;
        for (const h of sortedHalves) {
          total += cells.get(`${prop.id}-${h.sortKey}`) ?? 0;
        }
        rowTotals.set(prop.id, total);
      }

      // Compute column totals
      const colTotals = new Map<string, number>();
      for (const h of sortedHalves) {
        let total = 0;
        for (const prop of sortedProps) {
          total += cells.get(`${prop.id}-${h.sortKey}`) ?? 0;
        }
        colTotals.set(h.sortKey, total);
      }

      const grand = Array.from(rowTotals.values()).reduce((a, b) => a + b, 0);

      return {
        propertyRows: sortedProps,
        halfColumns: sortedHalves,
        cellMap: cells,
        propertyTotals: rowTotals,
        columnTotals: colTotals,
        grandTotal: grand,
      };
    }, [transactions, properties]);

  if (propertyRows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distributions by Property &amp; Period</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Property
                </th>
                {halfColumns.map((h) => (
                  <th
                    key={h.sortKey}
                    className="pb-3 pr-4 text-right font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h.label}
                  </th>
                ))}
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {propertyRows.map((prop) => (
                <tr
                  key={prop.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                    {prop.name}
                  </td>
                  {halfColumns.map((h) => {
                    const val = cellMap.get(`${prop.id}-${h.sortKey}`) ?? 0;
                    return (
                      <td
                        key={h.sortKey}
                        className="py-3 pr-4 text-right tabular-nums text-foreground"
                      >
                        {val !== 0 ? formatCurrency(val) : "—"}
                      </td>
                    );
                  })}
                  <td className="py-3 text-right tabular-nums font-medium text-foreground">
                    {formatCurrency(propertyTotals.get(prop.id) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="pt-3 pr-4 font-semibold text-foreground">
                  Total
                </td>
                {halfColumns.map((h) => (
                  <td
                    key={h.sortKey}
                    className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground"
                  >
                    {formatCurrency(columnTotals.get(h.sortKey) ?? 0)}
                  </td>
                ))}
                <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
