import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Property, Investor, Client } from "@/types/database";

const TRANSACTION_TYPES = [
  "Funding",
  "Capital Call",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
  "Exit",
  "Refi",
  "Return of Capital",
  "Management Fee",
  "Interest",
];

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

interface TransactionInputFormProps {
  properties: Property[];
  investors: Investor[];
  clients: Client[];
}

export function TransactionInputForm({
  properties,
  investors,
  clients,
}: TransactionInputFormProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [investorId, setInvestorId] = useState<number | null>(null);
  const [type, setType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cashAmount, setCashAmount] = useState("");
  const [units, setUnits] = useState("");
  const [navPerUnit, setNavPerUnit] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const clientMap = new Map(clients.map((c) => [c.client_id, c]));

  const isValid =
    propertyId != null &&
    investorId != null &&
    type !== "" &&
    date !== "" &&
    cashAmount !== "" &&
    !isNaN(parseFloat(cashAmount));

  async function handleSubmit() {
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError(null);

    const row = {
      date,
      investor_id: investorId,
      property_id: propertyId,
      type,
      cash_amount: parseFloat(cashAmount),
      units: units ? parseFloat(units) : null,
      nav_per_unit: navPerUnit ? parseFloat(navPerUnit) : null,
      notes: notes || null,
    };

    const { error } = await supabase.from("transactions").insert([row]);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId(null);
    setInvestorId(null);
    setType("");
    setDate(new Date().toISOString().slice(0, 10));
    setCashAmount("");
    setUnits("");
    setNavPerUnit("");
    setNotes("");
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    const investor = investors.find((i) => i.investor_id === investorId);
    const property = properties.find((p) => p.property_id === propertyId);

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Transaction Submitted
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {type} of {parseFloat(cashAmount).toLocaleString("en-US", { style: "currency", currency: "USD" })} for{" "}
            {investor?.name ?? "Unknown"} in {property?.name ?? "Unknown"}.
          </p>
          <button
            onClick={handleReset}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enter Another Transaction
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Property
            </label>
            <select
              value={propertyId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setPropertyId(val ? parseInt(val, 10) : null);
              }}
              className={inputClass}
            >
              <option value="">Select a property...</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Investor
            </label>
            <select
              value={investorId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setInvestorId(val ? parseInt(val, 10) : null);
              }}
              className={inputClass}
            >
              <option value="">Select an investor...</option>
              {investors.map((inv) => {
                const client = clientMap.get(inv.client_id);
                return (
                  <option key={inv.investor_id} value={inv.investor_id}>
                    {inv.name}
                    {client ? ` (${client.name})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Transaction Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputClass}
            >
              <option value="">Select type...</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Cash Amount
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Units
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="—"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              NAV per Unit
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="—"
              value={navPerUnit}
              onChange={(e) => setNavPerUnit(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Notes
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 2024 capital call"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {submitError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Failed to submit: {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Transaction"}
        </button>
      </CardContent>
    </Card>
  );
}
