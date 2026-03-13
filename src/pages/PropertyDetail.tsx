import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PropertyHeader } from "@/components/PropertyHeader";
import { FinancialOverview } from "@/components/FinancialOverview";
import { ValuationChart } from "@/components/ValuationChart";
import { CapTable } from "@/components/CapTable";
import { DividendsChart } from "@/components/DividendsChart";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { MetricChart } from "@/components/MetricChart";
import { PropertyMap } from "@/components/PropertyMap";
import type {
  Property,
  Valuation,
  Transaction,
  Investor,
  Client,
  Metric,
  PropertyLocation,
} from "@/types/database";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [locations, setLocations] = useState<PropertyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);

      const propertyId = parseInt(id, 10);
      if (isNaN(propertyId)) {
        setError("Invalid property ID.");
        setLoading(false);
        return;
      }

      // Fetch property, valuations, transactions, and metrics in parallel
      const [propResult, valResult, txnResult, metricResult, locResult] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .eq("property_id", propertyId)
          .single(),
        supabase
          .from("valuations")
          .select("*")
          .eq("property_id", propertyId)
          .order("date", { ascending: true }),
        supabase
          .from("transactions")
          .select("*")
          .eq("property_id", propertyId)
          .order("date", { ascending: true }),
        supabase
          .from("metrics")
          .select("*")
          .eq("property_id", propertyId)
          .order("as_of_date", { ascending: true }),
        supabase
          .from("property_locations")
          .select("*")
          .eq("property_id", propertyId),
      ]);

      if (propResult.error) {
        setError(
          propResult.error.code === "PGRST116"
            ? "Property not found."
            : propResult.error.message
        );
        setLoading(false);
        return;
      }

      if (valResult.error) {
        setError(valResult.error.message);
        setLoading(false);
        return;
      }

      if (txnResult.error) {
        setError(txnResult.error.message);
        setLoading(false);
        return;
      }

      if (metricResult.error) {
        setError(metricResult.error.message);
        setLoading(false);
        return;
      }

      const typedTxns = txnResult.data as Transaction[];

      // Fetch investors and clients referenced by these transactions
      const investorIds = [
        ...new Set(typedTxns.map((t) => t.investor_id)),
      ];

      let typedInvestors: Investor[] = [];
      let typedClients: Client[] = [];

      if (investorIds.length > 0) {
        const { data: invData, error: invErr } = await supabase
          .from("investors")
          .select("*")
          .in("investor_id", investorIds);

        if (invErr) {
          setError(invErr.message);
          setLoading(false);
          return;
        }

        typedInvestors = invData as Investor[];

        const clientIds = [
          ...new Set(typedInvestors.map((i) => i.client_id)),
        ];

        if (clientIds.length > 0) {
          const { data: cliData, error: cliErr } = await supabase
            .from("clients")
            .select("*")
            .in("client_id", clientIds);

          if (cliErr) {
            setError(cliErr.message);
            setLoading(false);
            return;
          }

          typedClients = cliData as Client[];
        }
      }

      setProperty(propResult.data as Property);
      setValuations(valResult.data as Valuation[]);
      setTransactions(typedTxns);
      setInvestors(typedInvestors);
      setClients(typedClients);
      setMetrics(metricResult.data as Metric[]);
      setLocations(locResult.error ? [] : (locResult.data as PropertyLocation[]));
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!property) return <ErrorMessage message="Property not found." />;

  return (
    <div className="space-y-6">
      <PropertyHeader property={property} />
      <PropertyMap locations={locations} />
      <FinancialOverview
        property={property}
        transactions={transactions}
        valuations={valuations}
      />
      <ExpandableSection title="Cap Table" defaultOpen={true}>
        <CapTable
          transactions={transactions}
          investors={investors}
          clients={clients}
        />
      </ExpandableSection>
      <ValuationChart valuations={valuations} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          metrics={metrics}
          metricType="OCCUPANCY"
          title="Occupancy"
          formatValue={(v: number) => `${v.toFixed(1)}%`}
          color="#0d9488"
          metricType2="BUDGETEDOCCUPANCY"
          label2="Budgeted"
          color2="#6ee7b7"
        />
        <MetricChart
          metrics={metrics}
          metricType="AVGRENT"
          title="Average Rent"
          formatValue={(v: number) =>
            v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
          }
          color="#1e40af"
          metricType2="BUDGETEDAVGRENT"
          label2="Budgeted"
          color2="#93c5fd"
        />
      </div>
      <DividendsChart transactions={transactions} vo2Raise={property.vo2_raise ?? null} />
      <ExpandableSection title="Other Financial Charts" defaultOpen={false}>
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricChart
            metrics={metrics}
            metricType="NOI"
            title="NOI"
            formatValue={(v: number) =>
              v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            }
            color="#7c3aed"
            metricType2="BUDGETEDNOI"
            label2="Budgeted"
            color2="#c4b5fd"
          />
          <MetricChart
            metrics={metrics}
            metricType="TOTALREV"
            title="Revenue"
            formatValue={(v: number) =>
              v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            }
            color="#0369a1"
            metricType2="BUDGETEDREV"
            label2="Budgeted"
            color2="#7dd3fc"
          />
          <MetricChart
            metrics={metrics}
            metricType="TOTALOPEX"
            title="OpEx"
            formatValue={(v: number) =>
              v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
            }
            color="#b45309"
            metricType2="BUDGETEDOPEX"
            label2="Budgeted"
            color2="#fcd34d"
          />
        </div>
      </ExpandableSection>
      <TransactionHistory
        transactions={transactions}
        properties={property ? [property] : []}
        investors={investors}
        clients={clients}
      />
    </div>
  );
}

function ExpandableSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-base font-semibold text-foreground">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
