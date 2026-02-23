import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ClientHeader } from "@/components/ClientHeader";
import { InvestorTable } from "@/components/InvestorTable";
import { PropertyExposureTable } from "@/components/PropertyExposureTable";
import { DividendsChart } from "@/components/DividendsChart";
import { DividendsPivotTable } from "@/components/DividendsPivotTable";
import { ClientNavChart } from "@/components/ClientNavChart";
import { AssetClassBreakdown } from "@/components/AssetClassBreakdown";
import { TransactionHistory } from "@/components/TransactionHistory";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatCurrency, formatMultiple } from "@/lib/format";
import type {
  Client,
  Investor,
  Transaction,
  Property,
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

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);

      const clientId = parseInt(id, 10);
      if (isNaN(clientId)) {
        setError("Invalid client ID.");
        setLoading(false);
        return;
      }

      // Fetch client
      const { data: clientData, error: clientErr } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", clientId)
        .single();

      if (clientErr) {
        setError(
          clientErr.code === "PGRST116"
            ? "Client not found."
            : clientErr.message
        );
        setLoading(false);
        return;
      }

      // Fetch investors for this client
      const { data: invData, error: invErr } = await supabase
        .from("investors")
        .select("*")
        .eq("client_id", clientId);

      if (invErr) {
        setError(invErr.message);
        setLoading(false);
        return;
      }

      const typedInvestors = invData as Investor[];
      const investorIds = typedInvestors.map((i) => i.investor_id);

      let typedTxns: Transaction[] = [];
      let typedProps: Property[] = [];
      let typedVals: Valuation[] = [];

      if (investorIds.length > 0) {
        // Fetch transactions, then properties and valuations in parallel
        const { data: txnData, error: txnErr } = await supabase
          .from("transactions")
          .select("*")
          .in("investor_id", investorIds)
          .order("date", { ascending: true });

        if (txnErr) {
          setError(txnErr.message);
          setLoading(false);
          return;
        }

        typedTxns = txnData as Transaction[];
        const propertyIds = [
          ...new Set(typedTxns.map((t) => t.property_id)),
        ];

        if (propertyIds.length > 0) {
          const [propResult, valResult] = await Promise.all([
            supabase
              .from("properties")
              .select("*")
              .in("property_id", propertyIds),
            supabase
              .from("valuations")
              .select("*")
              .in("property_id", propertyIds)
              .order("date", { ascending: false }),
          ]);

          if (propResult.error) {
            setError(propResult.error.message);
            setLoading(false);
            return;
          }
          if (valResult.error) {
            setError(valResult.error.message);
            setLoading(false);
            return;
          }

          typedProps = propResult.data as Property[];
          typedVals = valResult.data as Valuation[];
        }
      }

      setClient(clientData as Client);
      setInvestors(typedInvestors);
      setTransactions(typedTxns);
      setProperties(typedProps);
      setValuations(typedVals);
      setLoading(false);
    }

    load();
  }, [id]);

  // Compute summary metrics
  const metrics = useMemo(() => {
    let capitalInvested = 0;
    let dividends = 0;
    let otherProceeds = 0;

    for (const t of transactions) {
      if (FUNDING_TYPES.has(t.type)) {
        capitalInvested += -t.cash_amount;
      } else if (t.type === "Distribution") {
        dividends += t.cash_amount;
      } else {
        otherProceeds += t.cash_amount;
      }
    }

    // Latest nav_per_unit per property
    const latestNavPerUnit = new Map<number, number>();
    for (const v of valuations) {
      if (!latestNavPerUnit.has(v.property_id)) {
        latestNavPerUnit.set(v.property_id, v.nav_per_unit);
      }
    }

    // Sum units per property
    const unitsByProperty = new Map<number, number>();
    for (const t of transactions) {
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
        ? (currentNav + dividends + otherProceeds) / capitalInvested
        : null;

    const profitLoss = currentNav + dividends + otherProceeds - capitalInvested;

    return { capitalInvested, currentNav, dividends, otherProceeds, moic, profitLoss, latestNavPerUnit };
  }, [transactions, valuations]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!client) return <ErrorMessage message="Client not found." />;

  return (
    <div className="space-y-6">
      <ClientHeader client={client} />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Properties Invested
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {properties.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Capital Invested
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(metrics.capitalInvested)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Current NAV
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(metrics.currentNav)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Distributions Received
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(metrics.dividends)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Other Proceeds
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(metrics.otherProceeds)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              MOIC
            </p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatMultiple(metrics.moic)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Profit / Loss
            </p>
            <p
              className={`mt-1 text-lg font-bold ${
                metrics.profitLoss >= 0
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(metrics.profitLoss)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ClientNavChart
          transactions={transactions}
          valuations={valuations}
        />
        <AssetClassBreakdown
          transactions={transactions}
          properties={properties}
          latestNavPerUnit={metrics.latestNavPerUnit}
        />
      </div>

      <InvestorTable
        investors={investors}
        transactions={transactions}
        latestNavPerUnit={metrics.latestNavPerUnit}
      />

      <PropertyExposureTable
        investors={investors}
        transactions={transactions}
        properties={properties}
        valuations={valuations}
      />

      <DividendsChart transactions={transactions} />

      <DividendsPivotTable
        transactions={transactions}
        properties={properties}
      />

      <TransactionHistory
        transactions={transactions}
        properties={properties}
      />
    </div>
  );
}
