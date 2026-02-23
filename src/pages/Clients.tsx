import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ClientSummary } from "@/components/ClientSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatCurrency, formatMultiple } from "@/lib/format";
import type {
  Client,
  Investor,
  Transaction,
  Valuation,
} from "@/types/database";

const FUNDING_TYPES = new Set(["Capital Call", "Funding", "Purchase"]);
const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

interface ClientRow {
  client: Client;
  accountCount: number;
  capitalInvested: number;
  currentNav: number;
  dividends: number;
  otherProceeds: number;
  moic: number | null;
}

export function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [clientResult, investorResult, txnResult, valResult] =
        await Promise.all([
          supabase.from("clients").select("*").order("name"),
          supabase.from("investors").select("*"),
          supabase.from("transactions").select("*"),
          supabase
            .from("valuations")
            .select("*")
            .order("date", { ascending: false }),
        ]);

      if (clientResult.error) {
        setError(clientResult.error.message);
        setLoading(false);
        return;
      }
      if (investorResult.error) {
        setError(investorResult.error.message);
        setLoading(false);
        return;
      }
      if (txnResult.error) {
        setError(txnResult.error.message);
        setLoading(false);
        return;
      }
      if (valResult.error) {
        setError(valResult.error.message);
        setLoading(false);
        return;
      }

      setClients(clientResult.data as Client[]);
      setInvestors(investorResult.data as Investor[]);
      setTransactions(txnResult.data as Transaction[]);
      setValuations(valResult.data as Valuation[]);
      setLoading(false);
    }

    load();
  }, []);

  // Pre-compute lookup maps
  const { latestNavPerUnit, investorsByClient, txnsByInvestor } =
    useMemo(() => {
      const navMap = new Map<number, number>();
      for (const v of valuations) {
        if (!navMap.has(v.property_id)) {
          navMap.set(v.property_id, v.nav_per_unit);
        }
      }

      const invByClient = new Map<number, Investor[]>();
      for (const inv of investors) {
        const arr = invByClient.get(inv.client_id);
        if (arr) arr.push(inv);
        else invByClient.set(inv.client_id, [inv]);
      }

      const txnByInv = new Map<number, Transaction[]>();
      for (const t of transactions) {
        const arr = txnByInv.get(t.investor_id);
        if (arr) arr.push(t);
        else txnByInv.set(t.investor_id, [t]);
      }

      return {
        latestNavPerUnit: navMap,
        investorsByClient: invByClient,
        txnsByInvestor: txnByInv,
      };
    }, [valuations, investors, transactions]);

  // Compute per-client metrics
  const clientRows = useMemo(() => {
    const rows: ClientRow[] = [];

    for (const client of clients) {
      const clientInvestors = investorsByClient.get(client.client_id) ?? [];

      let capitalInvested = 0;
      let dividends = 0;
      let otherProceeds = 0;
      const unitsByProperty = new Map<number, number>();

      for (const inv of clientInvestors) {
        const txns = txnsByInvestor.get(inv.investor_id) ?? [];

        for (const t of txns) {
          if (FUNDING_TYPES.has(t.type)) {
            capitalInvested += -t.cash_amount;
          } else if (t.type === "Distribution") {
            dividends += t.cash_amount;
          } else {
            otherProceeds += t.cash_amount;
          }
          if (UNIT_TRANSACTION_TYPES.has(t.type) && t.units != null) {
            unitsByProperty.set(
              t.property_id,
              (unitsByProperty.get(t.property_id) ?? 0) + t.units
            );
          }
        }
      }

      let currentNav = 0;
      for (const [propId, units] of unitsByProperty) {
        currentNav += units * (latestNavPerUnit.get(propId) ?? 0);
      }

      const moic =
        capitalInvested > 0
          ? (currentNav + dividends + otherProceeds) / capitalInvested
          : null;

      rows.push({
        client,
        accountCount: clientInvestors.length,
        capitalInvested,
        currentNav,
        dividends,
        otherProceeds,
        moic,
      });
    }

    rows.sort((a, b) => b.currentNav - a.currentNav);
    return rows;
  }, [clients, investorsByClient, txnsByInvestor, latestNavPerUnit]);

  // Search filter
  const filteredRows = useMemo(() => {
    if (!search) return clientRows;
    const s = search.toLowerCase();
    return clientRows.filter(
      (r) =>
        r.client.name.toLowerCase().includes(s) ||
        r.client.domicile.toLowerCase().includes(s)
    );
  }, [clientRows, search]);

  // Aggregates
  const totalAum = filteredRows.reduce((s, r) => s + r.currentNav, 0);
  const totalCapitalCalled = filteredRows.reduce(
    (s, r) => s + r.capitalInvested,
    0
  );
  const totalDividends = filteredRows.reduce((s, r) => s + r.dividends, 0);
  const totalOtherProceeds = filteredRows.reduce(
    (s, r) => s + r.otherProceeds,
    0
  );
  const weightedAvgMoic =
    totalCapitalCalled > 0
      ? (totalAum + totalDividends + totalOtherProceeds) / totalCapitalCalled
      : null;

  const aumByClient = filteredRows
    .filter((r) => r.currentNav > 0)
    .map((r) => ({ name: r.client.name, aum: r.currentNav }))
    .sort((a, b) => b.aum - a.aum);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clients.length} client{clients.length !== 1 ? "s" : ""} in the VO2
          portfolio
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or domicile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </div>

      {/* Summary */}
      <ClientSummary
        clientCount={filteredRows.length}
        totalAum={totalAum}
        totalCapitalCalled={totalCapitalCalled}
        totalDividends={totalDividends}
        totalOtherProceeds={totalOtherProceeds}
        weightedAvgMoic={weightedAvgMoic}
        aumByClient={aumByClient}
      />

      {/* Client table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No clients match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                      Client
                    </th>
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                      Domicile
                    </th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                      Accounts
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
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      MOIC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.client.client_id}
                      onClick={() =>
                        navigate(`/clients/${row.client.client_id}`)
                      }
                      data-clickable
                      className="border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors"
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {row.client.name}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {row.client.domicile}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                        {row.accountCount}
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
                      <td className="py-3 text-right tabular-nums text-foreground">
                        {formatMultiple(row.moic)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td
                      colSpan={2}
                      className="pt-3 pr-4 font-semibold text-foreground"
                    >
                      Total
                    </td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                      {filteredRows.reduce((s, r) => s + r.accountCount, 0)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(totalCapitalCalled)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(totalAum)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(totalDividends)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(totalOtherProceeds)}
                    </td>
                    <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                      {formatMultiple(weightedAvgMoic)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
