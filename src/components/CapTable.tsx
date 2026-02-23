import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { Transaction, Investor, Client } from "@/types/database";

/** Transaction types that affect unit ownership */
const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution", // distributions can return units (negative)
]);

interface CapTableProps {
  transactions: Transaction[];
  investors: Investor[];
  clients: Client[];
}

interface CapTableRow {
  investorId: number;
  investorName: string;
  investorType: string;
  clientName: string;
  units: number;
  ownership: number;
}

export function CapTable({ transactions, investors, clients }: CapTableProps) {
  const rows = useMemo(() => {
    // Build lookup maps
    const clientMap = new Map(clients.map((c) => [c.client_id, c]));
    const investorMap = new Map(investors.map((i) => [i.investor_id, i]));

    // Sum units per investor from relevant transaction types
    const unitsByInvestor = new Map<number, number>();

    for (const txn of transactions) {
      if (!UNIT_TRANSACTION_TYPES.has(txn.type)) continue;
      if (txn.units == null) continue;

      const current = unitsByInvestor.get(txn.investor_id) ?? 0;
      unitsByInvestor.set(txn.investor_id, current + txn.units);
    }

    // Build rows
    const totalUnits = Array.from(unitsByInvestor.values()).reduce(
      (a, b) => a + b,
      0
    );

    const result: CapTableRow[] = [];

    for (const [investorId, units] of unitsByInvestor) {
      if (units === 0) continue;

      const investor = investorMap.get(investorId);
      const client = investor ? clientMap.get(investor.client_id) : undefined;

      result.push({
        investorId,
        investorName: investor?.name ?? `Investor #${investorId}`,
        investorType: investor?.investor_type ?? "—",
        clientName: client?.name ?? "—",
        units,
        ownership: totalUnits > 0 ? units / totalUnits : 0,
      });
    }

    // Sort by units descending
    result.sort((a, b) => b.units - a.units);

    return { rows: result, totalUnits };
  }, [transactions, investors, clients]);

  if (rows.rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cap Table</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No ownership data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cap Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Investor
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Units
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Ownership
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.rows.map((row) => (
                <tr
                  key={row.investorId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {row.investorName}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {row.clientName}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {row.investorType}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatNumber(row.units)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-foreground">
                    {(row.ownership * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td
                  colSpan={3}
                  className="pt-3 pr-4 font-semibold text-foreground"
                >
                  Total
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatNumber(rows.totalUnits)}
                </td>
                <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
