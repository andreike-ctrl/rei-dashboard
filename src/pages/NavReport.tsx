import { useEffect, useState, useMemo } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NavReportPDF } from "@/components/NavReportPDF";
import { Spinner } from "@/components/ui/Spinner";
import type { Client, Investor, Transaction, Valuation, Property } from "@/types/database";
import type { NavSnapshot } from "@/components/NavReportPDF";

function generatePeriods(): string[] {
  const periods: string[] = [];
  const endYear = new Date().getFullYear() + 1;
  for (let y = 2022; y <= endYear; y++) {
    periods.push(`H1 ${y}`, `H2 ${y}`);
  }
  return periods.reverse();
}

const PERIODS = generatePeriods();


function formatCurrency(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const FUNDING = new Set(["Capital Call", "Funding", "Purchase"]);

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

  // NAV overrides: property_id -> user-entered NAV string (empty = use base)
  const [navOverrides, setNavOverrides] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    supabase.from("clients").select("*").order("name").then(({ data }) => {
      if (data) setClients(data as Client[]);
      setClientsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setClient(null); setInvestors([]); setTransactions([]); setValuations([]); setProperties([]);
      return;
    }
    setDataLoading(true);
    async function load() {
      const { data: cliData } = await supabase.from("clients").select("*").eq("client_id", selectedClientId).single();
      const { data: invData } = await supabase.from("investors").select("*").eq("client_id", selectedClientId);
      const typedInvestors = (invData ?? []) as Investor[];
      const investorIds = typedInvestors.map((i) => i.investor_id);
      let typedTxns: Transaction[] = [], typedProps: Property[] = [], typedVals: Valuation[] = [];
      if (investorIds.length > 0) {
        const { data: txnData } = await supabase.from("transactions").select("*").in("investor_id", investorIds).order("date", { ascending: true });
        typedTxns = (txnData ?? []) as Transaction[];
        const propIds = [...new Set(typedTxns.map((t) => t.property_id))];
        if (propIds.length > 0) {
          const [{ data: propData }, { data: valData }] = await Promise.all([
            supabase.from("properties").select("*").in("property_id", propIds),
            supabase.from("valuations").select("*").in("property_id", propIds).order("date", { ascending: false }),
          ]);
          typedProps = (propData ?? []) as Property[];
          typedVals = (valData ?? []) as Valuation[];
        }
      }
      setClient((cliData as Client) ?? null);
      setInvestors(typedInvestors);
      setTransactions(typedTxns);
      setProperties(typedProps);
      setValuations(typedVals);
      setNavOverrides(new Map()); // reset overrides on client/period change
      setDataLoading(false);
    }
    load();
  }, [selectedClientId]);

  // Reset overrides when period changes
  useEffect(() => { setNavOverrides(new Map()); }, [period]);

  // Period end date: H1 YYYY → YYYY-06-30, H2 YYYY → YYYY-12-31
  const periodEndDate = useMemo(() => {
    const [half, year] = period.split(" ");
    return half === "H1" ? `${year}-06-30` : `${year}-12-31`;
  }, [period]);

  // Base per-property data — transactions and valuations up to period end date
  const baseRows = useMemo(() => {
    if (!client || dataLoading || properties.length === 0) return [];
    const investorIds = new Set(investors.map((i) => i.investor_id));
    const propMap = new Map(properties.map((p) => [p.property_id, p]));

    // Latest valuation per property on or before the period end date
    const latestVal = new Map<number, Valuation>();
    for (const v of valuations) {
      if (v.date > periodEndDate) continue;
      const existing = latestVal.get(v.property_id);
      if (!existing || v.date > existing.date) latestVal.set(v.property_id, v);
    }

    // Client transactions up to and including the period end date
    const clientTxns = transactions.filter((t) => investorIds.has(t.investor_id) && t.date <= periodEndDate);
    const unitsByProp = new Map<number, number>();
    const capitalByProp = new Map<number, number>();
    const distByProp = new Map<number, number>();
    const otherProceedsByProp = new Map<number, number>();

    for (const t of clientTxns) {
      if (t.units != null) unitsByProp.set(t.property_id, (unitsByProp.get(t.property_id) ?? 0) + t.units);
      if (FUNDING.has(t.type)) capitalByProp.set(t.property_id, (capitalByProp.get(t.property_id) ?? 0) + Math.abs(t.cash_amount));
      else if (t.type === "Distribution") distByProp.set(t.property_id, (distByProp.get(t.property_id) ?? 0) + t.cash_amount);
      else otherProceedsByProp.set(t.property_id, (otherProceedsByProp.get(t.property_id) ?? 0) + t.cash_amount);
    }

    return Array.from(propMap.values())
      .filter((p) => unitsByProp.has(p.property_id) || capitalByProp.has(p.property_id))
      .map((p) => {
        const val = latestVal.get(p.property_id);
        const units = unitsByProp.get(p.property_id) ?? 0;
        const baseNav = val ? units * val.nav_per_unit : null;
        return {
          property: p,
          capital: capitalByProp.get(p.property_id) ?? 0,
          distributions: distByProp.get(p.property_id) ?? 0,
          otherProceeds: otherProceedsByProp.get(p.property_id) ?? 0,
          baseNav,
        };
      })
      .sort((a, b) => a.property.name.localeCompare(b.property.name));
  }, [client, dataLoading, properties, valuations, transactions, investors, periodEndDate]);

  // Snapshot using overrides
  const snapshot: NavSnapshot | null = useMemo(() => {
    if (!client || dataLoading || baseRows.length === 0) return null;

    const rows = baseRows.map((r) => {
      const overrideStr = navOverrides.get(r.property.property_id);
      const nav = overrideStr !== undefined && overrideStr !== ""
        ? parseFloat(overrideStr)
        : r.baseNav;
      const totalValue = (nav ?? 0) + r.distributions + r.otherProceeds;
      const moic = r.capital > 0 ? totalValue / r.capital : null;
      const profitLoss = totalValue - r.capital;
      return { property: r.property, capital: r.capital, distributions: r.distributions, otherProceeds: r.otherProceeds, nav, moic, profitLoss };
    });

    const totalCapital = rows.reduce((s, r) => s + r.capital, 0);
    const totalDistributions = rows.reduce((s, r) => s + r.distributions, 0);
    const totalOtherProceeds = rows.reduce((s, r) => s + r.otherProceeds, 0);
    const totalNav = rows.reduce((s, r) => s + (r.nav ?? 0), 0);
    const totalMoic = totalCapital > 0 ? (totalNav + totalDistributions + totalOtherProceeds) / totalCapital : null;
    const totalProfitLoss = rows.reduce((s, r) => s + r.profitLoss, 0);

    return { rows, totalCapital, totalDistributions, totalOtherProceeds, totalNav, totalMoic, totalProfitLoss };
  }, [client, dataLoading, baseRows, navOverrides]);

  const pdfReady = snapshot !== null && client !== null;
  const fileName = client
    ? `VO2 NAV Report ${period.split(" ").reverse().join(" ")} - ${client.name}.pdf`
    : "VO2 NAV Report.pdf";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Controls ── */}
      <div className="border border-border bg-background p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">NAV Report Builder</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> This report is a snapshot as of the selected period end date. Transactions and valuations after that date are excluded. Capital invested and distributions received are life-to-date figures up to the period end.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</label>
            {clientsLoading ? (
              <div className="h-9 rounded-md border border-border animate-pulse bg-muted/40" />
            ) : (
              <select
                value={selectedClientId ?? ""}
                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Snapshot Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground opacity-0 select-none">&nbsp;</label>
            {dataLoading ? (
              <div className="flex h-9 w-full items-center justify-center rounded-md bg-foreground/10 opacity-60"><Spinner /></div>
            ) : pdfReady && client && snapshot ? (
              <PDFDownloadLink
                document={<NavReportPDF client={client} investors={investors} period={period} snapshot={snapshot} />}
                fileName={fileName}
              >
                {({ loading: pdfLoading }) => (
                  <button disabled={pdfLoading} className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-white px-4 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50">
                    <Download className="h-4 w-4" />
                    {pdfLoading ? "Preparing…" : "Download PDF"}
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <button disabled className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 text-sm font-semibold opacity-30">
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── NAV Adjustments table ── */}
      {!dataLoading && baseRows.length > 0 && (
        <div className="border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">NAV Adjustments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">Property</th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Current NAV</th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Updated NAV</th>
                  <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">Change</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Change %</th>
                </tr>
              </thead>
              <tbody>
                {baseRows.map((row) => {
                  const propId = row.property.property_id;
                  const overrideStr = navOverrides.get(propId);
                  const updatedNav = overrideStr !== undefined && overrideStr !== ""
                    ? parseFloat(overrideStr)
                    : (row.baseNav ?? 0);
                  const baseNav = row.baseNav ?? 0;
                  const change = updatedNav - baseNav;
                  const changePct = baseNav !== 0 ? (change / baseNav) * 100 : 0;
                  const hasChange = change !== 0;

                  return (
                    <tr key={propId} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{row.property.name}</td>
                      <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                        {row.baseNav != null ? formatCurrency(row.baseNav) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <input
                          type="number"
                          value={overrideStr ?? (row.baseNav != null ? String(Math.round(row.baseNav)) : "")}
                          onChange={(e) => {
                            setNavOverrides((prev) => {
                              const next = new Map(prev);
                              next.set(propId, e.target.value);
                              return next;
                            });
                          }}
                          className="w-36 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </td>
                      <td className={`py-3 pr-4 text-right tabular-nums text-sm ${hasChange ? (change > 0 ? "text-emerald-700" : "text-red-600") : "text-muted-foreground"}`}>
                        {hasChange ? (change > 0 ? "+" : "") + formatCurrency(change) : "—"}
                      </td>
                      <td className={`py-3 text-right tabular-nums text-sm ${hasChange ? (change > 0 ? "text-emerald-700" : "text-red-600") : "text-muted-foreground"}`}>
                        {hasChange ? (changePct > 0 ? "+" : "") + changePct.toFixed(1) + "%" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Preview pane ── */}
      <div className="border border-border overflow-hidden">
        {!selectedClientId ? (
          <div className="flex h-[700px] items-center justify-center bg-muted/20">
            <p className="text-sm text-muted-foreground">Select a client to preview the report.</p>
          </div>
        ) : dataLoading ? (
          <div className="flex h-[700px] items-center justify-center bg-muted/20">
            <Spinner />
          </div>
        ) : pdfReady && client && snapshot ? (
          <PDFViewer width="100%" height={700} showToolbar={false} style={{ border: "none" }}>
            <NavReportPDF client={client} investors={investors} period={period} snapshot={snapshot} />
          </PDFViewer>
        ) : null}
      </div>
    </div>
  );
}
