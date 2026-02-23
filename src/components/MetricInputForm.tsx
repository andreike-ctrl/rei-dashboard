import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { Property } from "@/types/database";

const METRIC_GROUPS = [
  {
    label: "Operating",
    metrics: [
      { type: "OCCUPANCY", label: "Occupancy", units: "PCT", step: "0.1", placeholder: "e.g. 94.5" },
      { type: "PRELEASE", label: "Pre-Lease", units: "PCT", step: "0.1", placeholder: "e.g. 88.0" },
      { type: "AVGRENT", label: "Average Rent", units: "USD", step: "1", placeholder: "e.g. 1450" },
    ],
  },
  {
    label: "Financial",
    metrics: [
      { type: "TOTALREV", label: "Total Revenue", units: "USD", step: "1", placeholder: "0" },
      { type: "TOTALOPEX", label: "Total OpEx", units: "USD", step: "1", placeholder: "0" },
      { type: "NOI", label: "NOI", units: "USD", step: "1", placeholder: "0" },
      { type: "NETCF", label: "Net Cash Flow", units: "USD", step: "1", placeholder: "0" },
      { type: "DEBTSERVICE", label: "Debt Service", units: "USD", step: "1", placeholder: "0" },
    ],
  },
  {
    label: "Budgeted",
    metrics: [
      { type: "BUDGETEDREV", label: "Budgeted Revenue", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDOPEX", label: "Budgeted OpEx", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDNOI", label: "Budgeted NOI", units: "USD", step: "1", placeholder: "0" },
    ],
  },
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

function emptyValues(): Record<string, string> {
  const v: Record<string, string> = {};
  for (const m of ALL_METRICS) v[m.type] = "";
  return v;
}

interface MetricInputFormProps {
  properties: Property[];
}

export function MetricInputForm({ properties }: MetricInputFormProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [values, setValues] = useState<Record<string, string>>(emptyValues);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const filledCount = Object.values(values).filter(
    (v) => v !== "" && !isNaN(parseFloat(v))
  ).length;

  const isValid = propertyId != null && asOfDate !== "" && filledCount > 0;

  function handleValueChange(metricType: string, val: string) {
    setValues((prev) => ({ ...prev, [metricType]: val }));
  }

  async function handleSubmit() {
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError(null);

    const rows = ALL_METRICS.filter(
      (m) => values[m.type] !== "" && !isNaN(parseFloat(values[m.type]))
    ).map((m) => ({
      property_id: propertyId,
      as_of_date: asOfDate,
      metric_type: m.type,
      metric_value: parseFloat(values[m.type]),
      units: m.units,
      notes: notes || null,
    }));

    const { error } = await supabase.from("metrics").insert(rows);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitCount(rows.length);
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId(null);
    setAsOfDate(new Date().toISOString().slice(0, 10));
    setValues(emptyValues());
    setNotes("");
    setSubmitError(null);
    setSubmitted(false);
    setSubmitCount(0);
  }

  if (submitted) {
    const property = properties.find((p) => p.property_id === propertyId);
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Metrics Submitted
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Inserted {submitCount} metric{submitCount !== 1 ? "s" : ""} for{" "}
            {property?.name ?? "Unknown"} as of {asOfDate}.
          </p>
          <button
            onClick={handleReset}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enter More Metrics
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Property + Date row */}
        <div className="grid gap-4 sm:grid-cols-2">
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
              As-of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Metric groups */}
        <div className="mt-6 space-y-6">
          {METRIC_GROUPS.map((group) => (
            <div key={group.label}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.metrics.map((m) => (
                  <div key={m.type}>
                    <label className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-foreground">
                      {m.label}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({m.units === "PCT" ? "%" : "$"})
                      </span>
                    </label>
                    <input
                      type="number"
                      step={m.step}
                      placeholder={m.placeholder}
                      value={values[m.type]}
                      onChange={(e) =>
                        handleValueChange(m.type, e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Notes
            <span className="ml-1 font-normal text-muted-foreground">
              (optional — applies to all metrics in this batch)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. January 2025 monthly report"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
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
          {submitting
            ? "Submitting..."
            : `Submit ${filledCount} Metric${filledCount !== 1 ? "s" : ""}`}
        </button>
      </CardContent>
    </Card>
  );
}
