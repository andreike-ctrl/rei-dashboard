import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DividendConfigForm } from "@/components/DividendConfigForm";
import {
  DividendReviewTable,
  type DividendRow,
} from "@/components/DividendReviewTable";
import { TransactionInputForm } from "@/components/TransactionInputForm";
import { MetricInputForm } from "@/components/MetricInputForm";
import { LocationInputForm } from "@/components/LocationInputForm";
import { PropertyForm } from "@/components/PropertyForm";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatCurrencyDetailed } from "@/lib/format";
import type {
  Property,
  Transaction,
  Investor,
  Client,
} from "@/types/database";

const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

type Phase = "configure" | "review" | "submitted";

export function DataInput() {
  // Data from Supabase
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    null
  );
  const [totalAmount, setTotalAmount] = useState("");
  const [dividendDate, setDividendDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  // Workflow
  const [phase, setPhase] = useState<Phase>("configure");
  const [distributionRows, setDistributionRows] = useState<DividendRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitCount, setSubmitCount] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const [propResult, txnResult, invResult, cliResult] = await Promise.all([
        supabase.from("properties").select("*").order("name"),
        supabase.from("transactions").select("*"),
        supabase.from("investors").select("*"),
        supabase.from("clients").select("*"),
      ]);

      if (propResult.error) {
        setError(propResult.error.message);
        setLoading(false);
        return;
      }
      if (txnResult.error) {
        setError(txnResult.error.message);
        setLoading(false);
        return;
      }
      if (invResult.error) {
        setError(invResult.error.message);
        setLoading(false);
        return;
      }
      if (cliResult.error) {
        setError(cliResult.error.message);
        setLoading(false);
        return;
      }

      setProperties(propResult.data as Property[]);
      setTransactions(txnResult.data as Transaction[]);
      setInvestors(invResult.data as Investor[]);
      setClients(cliResult.data as Client[]);
      setLoading(false);
    }

    load();
  }, []);

  const calculateDistribution = useCallback(() => {
    if (selectedPropertyId == null) return;

    const totalDividend = parseFloat(totalAmount);
    if (isNaN(totalDividend) || totalDividend <= 0) return;

    // Filter transactions to selected property
    const propertyTxns = transactions.filter(
      (t) => t.property_id === selectedPropertyId
    );

    // Sum units per investor
    const unitsByInvestor = new Map<number, number>();
    for (const txn of propertyTxns) {
      if (!UNIT_TRANSACTION_TYPES.has(txn.type)) continue;
      if (txn.units == null) continue;
      unitsByInvestor.set(
        txn.investor_id,
        (unitsByInvestor.get(txn.investor_id) ?? 0) + txn.units
      );
    }

    const totalUnits = Array.from(unitsByInvestor.values()).reduce(
      (a, b) => a + b,
      0
    );

    if (totalUnits <= 0) {
      setError(
        "No investors hold units in this property. Cannot create distributions."
      );
      return;
    }

    const investorMap = new Map(investors.map((i) => [i.investor_id, i]));
    const clientMap = new Map(clients.map((c) => [c.client_id, c]));

    const entries = Array.from(unitsByInvestor.entries())
      .filter(([, units]) => units > 0)
      .sort((a, b) => b[1] - a[1]);

    const rows: DividendRow[] = [];
    let allocatedSoFar = 0;

    for (let i = 0; i < entries.length; i++) {
      const [investorId, units] = entries[i];
      const ownership = units / totalUnits;

      let cashAmount: number;
      if (i === entries.length - 1) {
        // Last investor gets remainder to avoid rounding drift
        cashAmount =
          Math.round((totalDividend - allocatedSoFar) * 100) / 100;
      } else {
        cashAmount = Math.round(ownership * totalDividend * 100) / 100;
        allocatedSoFar += cashAmount;
      }

      const investor = investorMap.get(investorId);
      const client = investor ? clientMap.get(investor.client_id) : undefined;

      rows.push({
        investorId,
        investorName: investor?.name ?? `Investor #${investorId}`,
        clientName: client?.name ?? "—",
        units,
        ownership,
        cashAmount,
        isEdited: false,
      });
    }

    setDistributionRows(rows);
    setSubmitError(null);
    setPhase("review");
  }, [selectedPropertyId, totalAmount, transactions, investors, clients]);

  const handleUpdateRow = useCallback(
    (investorId: number, newCashAmount: number) => {
      setDistributionRows((prev) =>
        prev.map((r) =>
          r.investorId === investorId
            ? { ...r, cashAmount: newCashAmount, isEdited: true }
            : r
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (selectedPropertyId == null) return;

    setSubmitting(true);
    setSubmitError(null);

    const rowsToInsert = distributionRows.map((row) => ({
      date: dividendDate,
      investor_id: row.investorId,
      property_id: selectedPropertyId,
      type: "Distribution",
      cash_amount: row.cashAmount,
      units: null,
      nav_per_unit: null,
      notes: notes || null,
    }));

    const { error: insertErr } = await supabase
      .from("transactions")
      .insert(rowsToInsert);

    if (insertErr) {
      setSubmitError(insertErr.message);
    } else {
      setSubmitCount(rowsToInsert.length);
      setPhase("submitted");
    }

    setSubmitting(false);
  }, [distributionRows, dividendDate, selectedPropertyId, notes]);

  function handleReset() {
    setSelectedPropertyId(null);
    setTotalAmount("");
    setDividendDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setDistributionRows([]);
    setSubmitError(null);
    setPhase("configure");
  }

  const selectedProperty = properties.find(
    (p) => p.property_id === selectedPropertyId
  );

  const isValid =
    selectedPropertyId != null &&
    parseFloat(totalAmount) > 0 &&
    dividendDate !== "";

  if (loading) return <Spinner />;
  if (error && phase === "configure")
    return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Data Input</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and submit bulk transactions to the database
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Bulk Distribution
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Allocate distributions across investors pro-rata by cap table ownership
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {(["configure", "review", "submitted"] as Phase[]).map(
          (step, i, arr) => {
            const labels = ["Configure", "Review & Edit", "Complete"];
            const isCurrent = step === phase;
            const isPast =
              arr.indexOf(phase) > i;
            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${
                      isPast ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <span
                  className={`rounded-full px-3 py-1 font-medium ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isPast
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
            );
          }
        )}
      </div>

      {phase === "configure" && (
        <DividendConfigForm
          properties={properties}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={setSelectedPropertyId}
          totalAmount={totalAmount}
          onTotalAmountChange={setTotalAmount}
          dividendDate={dividendDate}
          onDateChange={setDividendDate}
          notes={notes}
          onNotesChange={setNotes}
          onCalculate={calculateDistribution}
          isValid={isValid}
        />
      )}

      {phase === "review" && (
        <>
          <DividendReviewTable
            rows={distributionRows}
            onUpdateRow={handleUpdateRow}
            totalAmount={parseFloat(totalAmount)}
            dividendDate={dividendDate}
            propertyName={selectedProperty?.name ?? ""}
            notes={notes}
            onBack={() => setPhase("configure")}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
          {submitError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Failed to submit: {submitError}
            </div>
          )}
        </>
      )}

      {phase === "submitted" && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              Distributions Submitted Successfully
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Inserted {submitCount} distribution transactions totaling{" "}
              {formatCurrencyDetailed(
                distributionRows.reduce((s, r) => s + r.cashAmount, 0)
              )}{" "}
              for {selectedProperty?.name}.
            </p>
            <button
              onClick={handleReset}
              style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
              className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enter Another Distribution
            </button>
          </CardContent>
        </Card>
      )}

      {/* Single Transaction Input */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Single Transaction
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Record an individual transaction for a specific investor and property
        </p>
      </div>

      <TransactionInputForm
        properties={properties}
        investors={investors}
        clients={clients}
      />

      {/* Property Metrics Input */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Property Metrics
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Enter operating and financial metrics for a property on a given date
        </p>
      </div>

      <MetricInputForm properties={properties} />

      {/* Property Locations Input */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Property Locations
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Add building or point-of-interest pins to a property map by address
        </p>
      </div>

      <LocationInputForm properties={properties} />

      {/* Property Record */}
      <div className="mt-10 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Property Record
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Create a new property or update an existing one's details
        </p>
      </div>

      <PropertyForm properties={properties} />
    </div>
  );
}
