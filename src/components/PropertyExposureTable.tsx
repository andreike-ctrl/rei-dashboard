import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatMultiple } from "@/lib/format";
import type { Transaction, Investor, Property, Valuation } from "@/types/database";

const FUNDING_TYPES = new Set(["Capital Call", "Funding", "Purchase"]);
const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

interface PropertyExposureTableProps {
  investors: Investor[];
  transactions: Transaction[];
  properties: Property[];
  valuations: Valuation[];
}

interface ExposureRow {
  propertyId: number;
  propertyName: string;
  ownershipPercent: number;
  capitalInvested: number;
  currentNav: number;
  dividends: number;
  otherProceeds: number;
  moic: number | null;
  profitLoss: number;
}

export function PropertyExposureTable({
  investors,
  transactions,
  properties,
  valuations,
}: PropertyExposureTableProps) {
  const { rows, totals } = useMemo(() => {
    const investorIds = new Set(investors.map((i) => i.investor_id));
    const clientTxns = transactions.filter((t) => investorIds.has(t.investor_id));

    const propertyMap = new Map(properties.map((p) => [p.property_id, p]));

    // Latest valuation per property (valuations should be sorted desc by date)
    const latestVal = new Map<number, Valuation>();
    for (const v of valuations) {
      if (!latestVal.has(v.property_id)) {
        latestVal.set(v.property_id, v);
      }
    }

    // Aggregate by property
    const byProperty = new Map<
      number,
      { units: number; capitalInvested: number; dividends: number; otherProceeds: number }
    >();

    for (const t of clientTxns) {
      let entry = byProperty.get(t.property_id);
      if (!entry) {
        entry = { units: 0, capitalInvested: 0, dividends: 0, otherProceeds: 0 };
        byProperty.set(t.property_id, entry);
      }

      if (FUNDING_TYPES.has(t.type)) {
        entry.capitalInvested += -t.cash_amount;
      } else if (t.type === "Distribution") {
        entry.dividends += t.cash_amount;
      } else {
        // Sale, Refi, or any other non-funding/non-distribution cash flow
        entry.otherProceeds += t.cash_amount;
      }

      if (UNIT_TRANSACTION_TYPES.has(t.type) && t.units != null) {
        entry.units += t.units;
      }
    }

    const result: ExposureRow[] = [];

    for (const [propId, entry] of byProperty) {
      const prop = propertyMap.get(propId);
      const val = latestVal.get(propId);
      const navPerUnit = val?.nav_per_unit ?? 0;
      const unitsOutstanding = val?.units_outstanding ?? 0;
      const currentNav = entry.units * navPerUnit;
      const totalValue = currentNav + entry.dividends + entry.otherProceeds;
      const moic =
        entry.capitalInvested > 0 ? totalValue / entry.capitalInvested : null;
      const profitLoss = totalValue - entry.capitalInvested;

      result.push({
        propertyId: propId,
        propertyName: prop?.name ?? `Property #${propId}`,
        ownershipPercent:
          unitsOutstanding > 0 ? entry.units / unitsOutstanding : 0,
        capitalInvested: entry.capitalInvested,
        currentNav,
        dividends: entry.dividends,
        otherProceeds: entry.otherProceeds,
        moic,
        profitLoss,
      });
    }

    result.sort((a, b) => b.currentNav - a.currentNav);

    const totalCapital = result.reduce((s, r) => s + r.capitalInvested, 0);
    const totalNav = result.reduce((s, r) => s + r.currentNav, 0);
    const totalDiv = result.reduce((s, r) => s + r.dividends, 0);
    const totalOther = result.reduce((s, r) => s + r.otherProceeds, 0);
    const totalValueAll = totalNav + totalDiv + totalOther;
    const totalMoic = totalCapital > 0 ? totalValueAll / totalCapital : null;
    const totalPL = totalValueAll - totalCapital;

    return {
      rows: result,
      totals: {
        capitalInvested: totalCapital,
        currentNav: totalNav,
        dividends: totalDiv,
        otherProceeds: totalOther,
        moic: totalMoic,
        profitLoss: totalPL,
      },
    };
  }, [investors, transactions, properties, valuations]);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Exposure</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No property exposure data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Exposure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Property
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Ownership
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
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Other Proceeds
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Est. MOIC
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Profit / Loss
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.propertyId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    <Link
                      to={`/property/${row.propertyId}`}
                      className="hover:underline"
                    >
                      {row.propertyName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {(row.ownershipPercent * 100).toFixed(1)}%
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
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatCurrency(row.otherProceeds)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatMultiple(row.moic)}
                  </td>
                  <td
                    className={`py-3 text-right tabular-nums font-medium ${
                      row.profitLoss >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(row.profitLoss)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td className="pt-3 pr-4 font-semibold text-foreground">
                  Total
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground" />
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.capitalInvested)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.currentNav)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.dividends)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrency(totals.otherProceeds)}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatMultiple(totals.moic)}
                </td>
                <td
                  className={`pt-3 text-right font-semibold tabular-nums ${
                    totals.profitLoss >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(totals.profitLoss)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
