import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/Spinner";
import type { Client, Investor, Transaction, Valuation, Property } from "@/types/database";

function generatePeriods(): string[] {
  const periods: string[] = [];
  const endYear = new Date().getFullYear() + 1;
  for (let y = 2022; y <= endYear; y++) {
    periods.push(`H1 ${y}`, `H2 ${y}`);
  }
  return periods.reverse();
}

const PERIODS = generatePeriods();

function periodToDateRange(period: string): { start: string; end: string } {
  const [half, year] = period.split(" ");
  const y = parseInt(year);
  return half === "H1"
    ? { start: `${y}-01-01`, end: `${y}-06-30` }
    : { start: `${y}-07-01`, end: `${y}-12-31` };
}

function formatCurrency(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export function NavReport() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [period, setPeriod] = useState<string>(PERIODS[2] ?? PERIODS[0]);

  const [client, setClient] = useState<Client | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    supabase.from("clients").select("*").order("name").then(({ data }) => {
      if (data) setClients(data as Client[]);
      setClientsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setClient(null);
      setInvestors([]);
      setTransactions([]);
      setValuations([]);
      setProperties([]);
      return;
    }

    setDataLoading(true);

    async function load() {
      const { data: cliData } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", selectedClientId)
        .single();

      const { data: invData } = await supabase
        .from("investors")
        .select("*")
        .eq("client_id", selectedClientId);

      const typedInvestors = (invData ?? []) as Investor[];
      const investorIds = typedInvestors.map((i) => i.investor_id);

      let typedTxns: Transaction[] = [];
      let typedProps: Property[] = [];
      let typedVals: Valuation[] = [];

      if (investorIds.length > 0) {
        const { data: txnData } = await supabase
          .from("transactions")
          .select("*")
          .in("investor_id", investorIds)
          .order("date", { ascending: true });
        typedTxns = (txnData ?? []) as Transaction[];

        const propIds = [...new Set(typedTxns.map((t) => t.property_id))];
        if (propIds.length > 0) {
          const { data: propData } = await supabase
            .from("properties")
            .select("*")
            .in("property_id", propIds);
          typedProps = (propData ?? []) as Property[];

          const { data: valData } = await supabase
            .from("valuations")
            .select("*")
            .in("property_id", propIds)
            .order("date", { ascending: false });
          typedVals = (valData ?? []) as Valuation[];
        }
      }

      setClient((cliData as Client) ?? null);
      setInvestors(typedInvestors);
      setTransactions(typedTxns);
      setProperties(typedProps);
      setValuations(typedVals);
      setDataLoading(false);
    }

    load();
  }, [selectedClientId]);

  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const ready = client !== null && !dataLoading;

  // Compute per-property NAV snapshot for selected period
  const snapshot = (() => {
    if (!ready) return null;

    const { end } = periodToDateRange(period);
    const investorIds = new Set(investors.map((i) => i.investor_id));
    const propMap = new Map(properties.map((p) => [p.property_id, p]));

    // Latest valuation per property on or before period end
    const latestVal = new Map<number, Valuation>();
    for (const v of valuations) {
      if (v.date > end) continue;
      const existing = latestVal.get(v.property_id);
      if (!existing || v.date > existing.date) latestVal.set(v.property_id, v);
    }

    // Transactions for this client up to period end
    const clientTxns = transactions.filter(
      (t) => investorIds.has(t.investor_id) && t.date <= end
    );

    // Units held per property
    const unitsByProp = new Map<number, number>();
    for (const t of clientTxns) {
      if (t.units != null) {
        unitsByProp.set(t.property_id, (unitsByProp.get(t.property_id) ?? 0) + t.units);
      }
    }

    // Capital invested per property (funding types)
    const FUNDING = new Set(["Capital Call", "Funding", "Purchase"]);
    const capitalByProp = new Map<number, number>();
    for (const t of clientTxns) {
      if (FUNDING.has(t.type)) {
        capitalByProp.set(t.property_id, (capitalByProp.get(t.property_id) ?? 0) + t.cash_amount);
      }
    }

    // Distributions per property up to period end
    const distByProp = new Map<number, number>();
    for (const t of clientTxns) {
      if (t.type === "Distribution") {
        distByProp.set(t.property_id, (distByProp.get(t.property_id) ?? 0) + t.cash_amount);
      }
    }

    const rows = Array.from(propMap.values())
      .filter((p) => unitsByProp.has(p.property_id) || capitalByProp.has(p.property_id))
      .map((p) => {
        const val = latestVal.get(p.property_id);
        const units = unitsByProp.get(p.property_id) ?? 0;
        const capital = capitalByProp.get(p.property_id) ?? 0;
        const distributions = distByProp.get(p.property_id) ?? 0;
        const nav = val ? units * val.nav_per_unit : null;
        const navDate = val?.date ?? null;
        const totalValue = (nav ?? 0) + distributions;
        const moic = capital > 0 ? totalValue / capital : null;
        return { property: p, units, capital, distributions, nav, navDate, moic };
      })
      .sort((a, b) => a.property.name.localeCompare(b.property.name));

    const totalCapital = rows.reduce((s, r) => s + r.capital, 0);
    const totalDistributions = rows.reduce((s, r) => s + r.distributions, 0);
    const totalNav = rows.reduce((s, r) => s + (r.nav ?? 0), 0);
    const totalMoic = totalCapital > 0 ? (totalNav + totalDistributions) / totalCapital : null;

    return { rows, totalCapital, totalDistributions, totalNav, totalMoic };
  })();

  return (
    <div className="flex flex-col gap-6">

      {/* Controls */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">NAV Report Builder</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Client
            </label>
            {clientsLoading ? (
              <div className="h-9 rounded-md border border-border animate-pulse bg-muted/40" />
            ) : (
              <select
                value={selectedClientId ?? ""}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Snapshot Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {dataLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {ready && snapshot && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">

          {/* VO2 Header */}
          <div className="flex items-start justify-between bg-slate-900 px-8 py-6">
            <div className="flex flex-col gap-1">
              <img src="/vo2-logo.png" alt="VO2 Alternatives" className="h-7 w-auto object-contain brightness-0 invert mb-2" />
              <p className="text-white/60 text-xs uppercase tracking-widest">NAV Report</p>
            </div>
            <div className="text-right">
              <p className="text-white font-semibold text-lg">{period}</p>
              <p className="text-white/50 text-xs mt-0.5">Prepared {generatedDate}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="border-b border-border px-8 py-5 bg-muted/30">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{client.name}</p>
              </div>
              {client.domicile && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Domicile</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{client.domicile}</p>
                </div>
              )}
              {client.email && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{client.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Report Date</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{generatedDate}</p>
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="px-8 py-6 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Portfolio Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Total Invested", value: formatCurrency(snapshot.totalCapital) },
                { label: "Total Distributions", value: formatCurrency(snapshot.totalDistributions) },
                { label: "Current NAV", value: formatCurrency(snapshot.totalNav) },
                { label: "Est. MOIC", value: snapshot.totalMoic != null ? snapshot.totalMoic.toFixed(2) + "x" : "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings Table */}
          <div className="px-8 py-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Property</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Capital Invested</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Distributions</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">NAV</th>
                    <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">NAV Date</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Est. MOIC</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.rows.map((row) => (
                    <tr key={row.property.property_id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.property.name}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">{formatCurrency(row.capital)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">{formatCurrency(row.distributions)}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                        {row.nav != null ? formatCurrency(row.nav) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground text-xs">
                        {row.navDate ? formatDate(row.navDate) : "—"}
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium text-foreground">
                        {row.moic != null ? row.moic.toFixed(2) + "x" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="pt-3 pr-4 font-semibold text-foreground">Total</td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">{formatCurrency(snapshot.totalCapital)}</td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">{formatCurrency(snapshot.totalDistributions)}</td>
                    <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">{formatCurrency(snapshot.totalNav)}</td>
                    <td className="pt-3 pr-4" />
                    <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                      {snapshot.totalMoic != null ? snapshot.totalMoic.toFixed(2) + "x" : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {!dataLoading && selectedClientId && !ready && (
        <div className="rounded-xl border border-border bg-background py-12 text-center text-sm text-muted-foreground">
          No data found for this client.
        </div>
      )}

    </div>
  );
}
