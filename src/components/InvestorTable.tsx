import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatMultiple } from "@/lib/format";
import type { Transaction, Investor } from "@/types/database";

const FUNDING_TYPES = new Set(["Capital Call", "Funding", "Purchase"]);
const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

interface InvestorTableProps {
  investors: Investor[];
  transactions: Transaction[];
  latestNavPerUnit: Map<number, number>;
}

interface InvestorRow {
  investorId: number;
  name: string;
  type: string;
  taxNumber: string;
  capitalInvested: number;
  currentNav: number;
  dividends: number;
  moic: number | null;
}

export function InvestorTable({
  investors,
  transactions,
  latestNavPerUnit,
}: InvestorTableProps) {
  const { rows, totals } = useMemo(() => {
    const txnsByInvestor = new Map<number, Transaction[]>();
    for (const t of transactions) {
      const arr = txnsByInvestor.get(t.investor_id);
      if (arr) arr.push(t);
      else txnsByInvestor.set(t.investor_id, [t]);
    }

    const result: InvestorRow[] = [];

    for (const inv of investors) {
      const txns = txnsByInvestor.get(inv.investor_id) ?? [];

      const capitalInvested = -txns
        .filter((t) => FUNDING_TYPES.has(t.type))
        .reduce((sum, t) => sum + t.cash_amount, 0);

      const dividends = txns
        .filter((t) => t.type === "Distribution")
        .reduce((sum, t) => sum + t.cash_amount, 0);

      const unitsByProperty = new Map<number, number>();
      for (const t of txns) {
        if (!UNIT_TRANSACTION_TYPES.has(t.type) || t.units == null) continue;
        unitsByProperty.set(
          t.property_id,
          (unitsByProperty.get(t.property_id) ?? 0) + t.units
        );
      }

      let currentNav = 0;
      for (const [propId, units] of unitsByProperty) {
        currentNav += units * (latestNavPerUnit.get(propId) ?? 0);
      }

      const moic =
        capitalInvested > 0
          ? (currentNav + dividends) / capitalInvested
          : null;

      result.push({
        investorId: inv.investor_id,
        name: inv.name,
        type: inv.investor_type,
        taxNumber: inv.tax_number,
        capitalInvested,
        currentNav,
        dividends,
        moic,
      });
    }

    result.sort((a, b) => b.currentNav - a.currentNav);

    const totalCapital = result.reduce((s, r) => s + r.capitalInvested, 0);
    const totalNav = result.reduce((s, r) => s + r.currentNav, 0);
    const totalDiv = result.reduce((s, r) => s + r.dividends, 0);
    const totalMoic =
      totalCapital > 0 ? (totalNav + totalDiv) / totalCapital : null;

    return {
      rows: result,
      totals: {
        capitalInvested: totalCapital,
        currentNav: totalNav,
        dividends: totalDiv,
        moic: totalMoic,
      },
    };
  }, [investors, transactions, latestNavPerUnit]);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No investor data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investors</CardTitle>
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
                  Type
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Tax Number
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Capital Invested
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Current NAV
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Distributions
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  MOIC
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.investorId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {row.name}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {row.type}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {row.taxNumber}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatCurrency(row.capitalInvested)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatCurrency(row.currentNav)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatCurrency(row.dividends)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-foreground">
                    {formatMultiple(row.moic)}
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
                  {formatCurrency(totals.capitalInvested)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.currentNav)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.dividends)}
                </td>
                <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                  {formatMultiple(totals.moic)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
