import { useEffect, useState } from "react";
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

function periodToDateRange(period: string): { start: string; end: string } {
  const [half, year] = period.split(" ");
  const y = parseInt(year);
  return half === "H1"
    ? { start: `${y}-01-01`, end: `${y}-06-30` }
    : { start: `${y}-07-01`, end: `${y}-12-31` };
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
        .from("clients").select("*").eq("client_id", selectedClientId).single();

      const { data: invData } = await supabase
        .from("investors").select("*").eq("client_id", selectedClientId);

      const typedInvestors = (invData ?? []) as Investor[];
      const investorIds = typedInvestors.map((i) => i.investor_id);

      let typedTxns: Transaction[] = [];
      let typedProps: Property[] = [];
      let typedVals: Valuation[] = [];

      if (investorIds.length > 0) {
        const { data: txnData } = await supabase
          .from("transactions").select("*")
          .in("investor_id", investorIds)
          .order("date", { ascending: true });
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
      setDataLoading(false);
    }

    load();
  }, [selectedClientId]);

  const snapshot: NavSnapshot | null = (() => {
    if (!client || dataLoading) return null;

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

    // Client transactions up to period end
    const clientTxns = transactions.filter(
      (t) => investorIds.has(t.investor_id) && t.date <= end
    );

    const unitsByProp = new Map<number, number>();
    const capitalByProp = new Map<number, number>();
    const distByProp = new Map<number, number>();

    for (const t of clientTxns) {
      if (t.units != null) {
        unitsByProp.set(t.property_id, (unitsByProp.get(t.property_id) ?? 0) + t.units);
      }
      if (FUNDING.has(t.type)) {
        capitalByProp.set(t.property_id, (capitalByProp.get(t.property_id) ?? 0) + Math.abs(t.cash_amount));
      }
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
        const totalValue = (nav ?? 0) + distributions;
        const moic = capital > 0 ? totalValue / capital : null;
        return { property: p, capital, distributions, nav, moic };
      })
      .sort((a, b) => a.property.name.localeCompare(b.property.name));

    const totalCapital = rows.reduce((s, r) => s + r.capital, 0);
    const totalDistributions = rows.reduce((s, r) => s + r.distributions, 0);
    const totalNav = rows.reduce((s, r) => s + (r.nav ?? 0), 0);
    const totalMoic = totalCapital > 0 ? (totalNav + totalDistributions) / totalCapital : null;

    return { rows, totalCapital, totalDistributions, totalNav, totalMoic };
  })();

  const pdfReady = snapshot !== null && client !== null;

  const fileName = client
    ? `VO2 NAV Report ${period.split(" ").reverse().join(" ")} - ${client.name}.pdf`
    : "VO2 NAV Report.pdf";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">NAV Report Builder</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Client selector */}
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

          {/* Period selector */}
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

          {/* Download */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground opacity-0 select-none">
              &nbsp;
            </label>
            {dataLoading ? (
              <div className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground/10 text-sm font-semibold opacity-60">
                <Spinner />
              </div>
            ) : pdfReady && client && snapshot ? (
              <PDFDownloadLink
                document={<NavReportPDF client={client} investors={investors} period={period} snapshot={snapshot} />}
                fileName={fileName}
              >
                {({ loading: pdfLoading }) => (
                  <button
                    disabled={pdfLoading}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-white px-4 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {pdfLoading ? "Preparing…" : "Download PDF"}
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <button
                disabled
                className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 text-sm font-semibold opacity-30"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Preview pane ── */}
      <div className="rounded-xl border border-border overflow-hidden">
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
