import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";
import type { Transaction, Property, Investor, Client } from "@/types/database";

interface TransactionHistoryProps {
  transactions: Transaction[];
  properties: Property[];
  /** When provided, shows a "Client" column instead of "Property" */
  investors?: Investor[];
  clients?: Client[];
}

const TYPE_COLORS: Record<string, string> = {
  "Capital Call": "bg-blue-100 text-blue-800",
  Funding: "bg-blue-100 text-blue-800",
  Purchase: "bg-blue-100 text-blue-800",
  Distribution: "bg-emerald-100 text-emerald-800",
  Sale: "bg-amber-100 text-amber-800",
  "Shares Awarded": "bg-indigo-100 text-indigo-800",
};

const DEFAULT_COLOR = "bg-gray-100 text-gray-800";

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TransactionHistory({
  transactions,
  properties,
  investors,
  clients,
}: TransactionHistoryProps) {
  const showClient = investors != null && clients != null;
  const [showAll, setShowAll] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const INITIAL_LIMIT = 25;

  const { rows, propertyMap, clientByInvestor, allTypes } = useMemo(() => {
    const propMap = new Map(properties.map((p) => [p.property_id, p]));

    // Build investor_id → client name lookup
    const clientMap = new Map(clients?.map((c) => [c.client_id, c]));
    const invToClient = new Map<number, string>();
    if (investors) {
      for (const inv of investors) {
        const client = clientMap.get(inv.client_id);
        invToClient.set(inv.investor_id, client?.name ?? inv.name);
      }
    }

    const sorted = [...transactions].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const types = [...new Set(transactions.map((t) => t.type))].sort();

    return { rows: sorted, propertyMap: propMap, clientByInvestor: invToClient, allTypes: types };
  }, [transactions, properties, investors, clients]);

  const filtered = useMemo(() => {
    if (selectedTypes.size === 0) return rows;
    return rows.filter((t) => selectedTypes.has(t.type));
  }, [rows, selectedTypes]);

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setShowAll(false);
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions found.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayed = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = filtered.length > INITIAL_LIMIT;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Transaction History
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({filtered.length} transaction{filtered.length !== 1 ? "s" : ""})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Type filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {allTypes.map((type) => {
            const active = selectedTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? TYPE_COLORS[type] ?? DEFAULT_COLOR
                    : "bg-secondary text-muted-foreground hover:bg-secondary/60"
                }`}
              >
                {type}
              </button>
            );
          })}
          {selectedTypes.size > 0 && (
            <button
              onClick={() => {
                setSelectedTypes(new Set());
                setShowAll(false);
              }}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Type
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  {showClient ? "Client" : "Property"}
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Units
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((t) => {
                const prop = propertyMap.get(t.property_id);
                return (
                  <tr
                    key={t.transaction_id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                      {formatFullDate(t.date)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[t.type] ?? DEFAULT_COLOR
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                      {showClient
                        ? (clientByInvestor.get(t.investor_id) ?? `Investor #${t.investor_id}`)
                        : (prop?.name ?? `Property #${t.property_id}`)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums font-medium ${
                        t.cash_amount >= 0
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrencyDetailed(t.cash_amount)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                      {t.units != null
                        ? t.units.toLocaleString("en-US", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 4,
                          })
                        : "—"}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                      {t.notes ?? "—"}
                    </td>
                  </tr>
                );
              })}
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
                  {formatCurrency(
                    filtered.reduce((s, t) => s + t.cash_amount, 0)
                  )}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 w-full rounded-md border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/40 transition-colors"
          >
            Show all {filtered.length} transactions
          </button>
        )}
      </CardContent>
    </Card>
  );
}
