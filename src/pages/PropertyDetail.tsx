import { useEffect, useState } from "react";
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
      <CapTable
        transactions={transactions}
        investors={investors}
        clients={clients}
      />
      <ValuationChart valuations={valuations} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MetricChart
          metrics={metrics}
          metricType="OCCUPANCY"
          title="Occupancy"
          formatValue={(v: number) => `${v.toFixed(1)}%`}
          color="#0d9488"
        />
        <MetricChart
          metrics={metrics}
          metricType="AVGRENT"
          title="Average Rent"
          formatValue={(v: number) =>
            v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
          }
          color="#1e40af"
        />
      </div>
      <DividendsChart transactions={transactions} />
      <TransactionHistory
        transactions={transactions}
        properties={property ? [property] : []}
        investors={investors}
        clients={clients}
      />
    </div>
  );
}
