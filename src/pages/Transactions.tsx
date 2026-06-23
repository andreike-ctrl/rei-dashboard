import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Transaction, Property, Investor, Client } from "@/types/database";

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
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const INITIAL_LIMIT = 50;

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [txnRes, propRes, invRes, clientRes] = await Promise.all([
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("properties").select("*").order("name"),
        supabase.from("investors").select("*").order("name"),
        supabase.from("clients").select("*").order("name"),
      ]);

      const err = txnRes.error ?? propRes.error ?? invRes.error ?? clientRes.error;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      setTransactions(txnRes.data ?? []);
      setProperties(propRes.data ?? []);
      setInvestors(invRes.data ?? []);
      setClients(clientRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const { propertyMap, investorMap, clientMap, investorToClient, allTypes } = useMemo(() => {
    const propMap = new Map(properties.map((p) => [p.property_id, p]));
    const invMap = new Map(investors.map((i) => [i.investor_id, i]));
    const cliMap = new Map(clients.map((c) => [c.client_id, c]));
    const invToClient = new Map<number, Client>();
    for (const inv of investors) {
      const client = cliMap.get(inv.client_id);
      if (client) invToClient.set(inv.investor_id, client);
    }
    const types = [...new Set(transactions.map((t) => t.type))].sort();
    return { propertyMap: propMap, investorMap: invMap, clientMap: cliMap, investorToClient: invToClient, allTypes: types };
  }, [transactions, properties, investors, clients]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedTypes.size > 0 && !selectedTypes.has(t.type)) return false;
      if (selectedPropertyId && t.property_id !== parseInt(selectedPropertyId)) return false;
      if (selectedInvestorId && t.investor_id !== parseInt(selectedInvestorId)) return false;
      if (selectedClientId) {
        const client = investorToClient.get(t.investor_id);
        if (!client || client.client_id !== parseInt(selectedClientId)) return false;
      }
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, selectedTypes, selectedPropertyId, selectedInvestorId, selectedClientId, dateFrom, dateTo, investorToClient]);

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setShowAll(false);
  }

  const hasActiveFilters =
    selectedTypes.size > 0 ||
    selectedPropertyId !== "" ||
    selectedClientId !== "" ||
    selectedInvestorId !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  function clearAllFilters() {
    setSelectedTypes(new Set());
    setSelectedPropertyId("");
    setSelectedClientId("");
    setSelectedInvestorId("");
    setDateFrom("");
    setDateTo("");
    setShowAll(false);
  }

  function handleDownload() {
    downloadCsv(
      "transactions.csv",
      ["Date", "Type", "Property", "Investor", "Client", "Amount", "Units", "NAV/Unit", "Notes"],
      filtered.map((t) => [
        t.date,
        t.type,
        propertyMap.get(t.property_id)?.name ?? `Property #${t.property_id}`,
        investorMap.get(t.investor_id)?.name ?? `Investor #${t.investor_id}`,
        investorToClient.get(t.investor_id)?.name ?? "—",
        t.cash_amount,
        t.units ?? "",
        t.nav_per_unit ?? "",
        t.notes ?? "",
      ])
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;

  const displayed = showAll ? filtered : filtered.slice(0, INITIAL_LIMIT);
  const hasMore = filtered.length > INITIAL_LIMIT;
  const totalAmount = filtered.reduce((s, t) => s + t.cash_amount, 0);

  const selectClass =
    "h-8 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            All Transactions
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filtered.length} transaction{filtered.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors border border-border"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-5 space-y-3">
            {/* Type pills */}
            <div className="flex flex-wrap items-center gap-2">
              {allTypes.map((type) => {
                const active = selectedTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? (TYPE_COLORS[type] ?? DEFAULT_COLOR)
                        : "bg-secondary text-muted-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Dropdown filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedPropertyId}
                onChange={(e) => { setSelectedPropertyId(e.target.value); setShowAll(false); }}
                className={selectClass}
              >
                <option value="">All Properties</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>{p.name}</option>
                ))}
              </select>

              <select
                value={selectedClientId}
                onChange={(e) => { setSelectedClientId(e.target.value); setSelectedInvestorId(""); setShowAll(false); }}
                className={selectClass}
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>{c.name}</option>
                ))}
              </select>

              <select
                value={selectedInvestorId}
                onChange={(e) => { setSelectedInvestorId(e.target.value); setSelectedClientId(""); setShowAll(false); }}
                className={selectClass}
              >
                <option value="">All Investors</option>
                {investors.map((i) => (
                  <option key={i.investor_id} value={i.investor_id}>{i.name}</option>
                ))}
              </select>

              {/* Date range */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setShowAll(false); }}
                className={selectClass}
                title="From date"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setShowAll(false); }}
                className={selectClass}
                title="To date"
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions match the selected filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Type</th>
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Property</th>
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Client</th>
                      <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Investor</th>
                      <th className="pb-3 pr-4 text-right font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                      <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Units</th>
                      <th className="pb-3 text-left font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((t) => {
                      const prop = propertyMap.get(t.property_id);
                      const investor = investorMap.get(t.investor_id);
                      const client = investorToClient.get(t.investor_id);
                      return (
                        <tr key={t.transaction_id} className="border-b border-border/50 last:border-0">
                          <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                            {formatFullDate(t.date)}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t.type] ?? DEFAULT_COLOR}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                            {prop?.name ?? `Property #${t.property_id}`}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap text-foreground">
                            {client?.name ?? "—"}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                            {investor?.name ?? `Investor #${t.investor_id}`}
                          </td>
                          <td className={`py-3 pr-4 text-right tabular-nums font-medium whitespace-nowrap ${t.cash_amount >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                            {formatCurrencyDetailed(t.cash_amount)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                            {t.units != null
                              ? t.units.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 4 })
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
                      <td colSpan={5} className="pt-3 pr-4 font-semibold text-foreground">Total</td>
                      <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                        {formatCurrency(totalAmount)}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
