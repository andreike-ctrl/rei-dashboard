import { useState, useEffect } from "react";
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
      { type: "CAPEX", label: "CapEx", units: "USD", step: "1", placeholder: "0" },
    ],
  },
  {
    label: "Budgeted",
    metrics: [
      { type: "BUDGETEDREV", label: "Budgeted Revenue", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDOPEX", label: "Budgeted OpEx", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDNOI", label: "Budgeted NOI", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDCAPEX", label: "Budgeted CapEx", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDDEBTSERVICE", label: "Budgeted Debt Service", units: "USD", step: "1", placeholder: "0" },
      { type: "BUDGETEDOCCUPANCY", label: "Budgeted Occupancy", units: "PCT", step: "0.1", placeholder: "e.g. 95.0" },
      { type: "BUDGETEDAVGRENT", label: "Budgeted Avg Rent", units: "USD", step: "1", placeholder: "e.g. 1500" },
    ],
  },
];

const ALL_METRICS = METRIC_GROUPS.flatMap((g) => g.metrics);

// Quarter-end dates: last 12 quarters + next 2
function buildQuarterOptions(): { label: string; date: string }[] {
  const QUARTER_ENDS = [
    { m: 2, d: 31, q: "Q1" },
    { m: 5, d: 30, q: "Q2" },
    { m: 8, d: 30, q: "Q3" },
    { m: 11, d: 31, q: "Q4" },
  ];
  const now = new Date();
  let year = now.getFullYear();
  let qIdx = QUARTER_ENDS.findIndex((_, i) => {
    const next = QUARTER_ENDS[i + 1];
    return !next || now.getMonth() <= QUARTER_ENDS[i].m;
  });

  const options: { label: string; date: string }[] = [];
  // 2 future + 12 past = 14 total
  let count = 0;
  let y = year;
  let qi = qIdx + 2; // start 2 ahead

  while (options.length < 14) {
    if (qi >= 4) { qi -= 4; y += 1; }
    if (qi < 0) { qi += 4; y -= 1; }
    const { m, d, q } = QUARTER_ENDS[qi];
    const mm = String(m + 1).padStart(2, "0");
    options.push({ label: `${q} ${y}`, date: `${y}-${mm}-${d}` });
    qi--;
    count++;
    if (count > 20) break; // safety
  }
  return options;
}

const QUARTER_OPTIONS = buildQuarterOptions();

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
  const [quarterDate, setQuarterDate] = useState(QUARTER_OPTIONS[2]?.date ?? "");
  const [values, setValues] = useState<Record<string, string>>(emptyValues);
  const [notes, setNotes] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Fetch existing metrics when property + quarter changes
  useEffect(() => {
    if (!propertyId || !quarterDate) {
      setValues(emptyValues());
      setHasExisting(false);
      return;
    }

    let cancelled = false;
    setLoadingExisting(true);

    supabase
      .from("metrics")
      .select("metric_type, metric_value, notes")
      .eq("property_id", propertyId)
      .eq("as_of_date", quarterDate)
      .then(({ data }) => {
        if (cancelled) return;
        setLoadingExisting(false);
        if (!data || data.length === 0) {
          setValues(emptyValues());
          setHasExisting(false);
          return;
        }
        setHasExisting(true);
        const filled = emptyValues();
        let existingNotes = "";
        for (const row of data) {
          if (row.metric_type in filled) {
            filled[row.metric_type] = String(row.metric_value);
          }
          if (row.notes) existingNotes = row.notes;
        }
        setValues(filled);
        setNotes(existingNotes);
      });

    return () => { cancelled = true; };
  }, [propertyId, quarterDate]);

  const filledCount = Object.values(values).filter(
    (v) => v !== "" && !isNaN(parseFloat(v))
  ).length;

  const isValid = propertyId != null && quarterDate !== "" && filledCount > 0;

  function handleValueChange(metricType: string, val: string) {
    setValues((prev) => ({ ...prev, [metricType]: val }));
  }

  async function handleSubmit() {
    if (!isValid) return;

    setSubmitting(true);
    setSubmitError(null);

    // Delete existing rows for this property + quarter, then insert fresh
    const { error: deleteErr } = await supabase
      .from("metrics")
      .delete()
      .eq("property_id", propertyId)
      .eq("as_of_date", quarterDate);

    if (deleteErr) {
      setSubmitError(deleteErr.message);
      setSubmitting(false);
      return;
    }

    const rows = ALL_METRICS.filter(
      (m) => values[m.type] !== "" && !isNaN(parseFloat(values[m.type]))
    ).map((m) => ({
      property_id: propertyId,
      as_of_date: quarterDate,
      metric_type: m.type,
      metric_value: parseFloat(values[m.type]),
      units: m.units,
      notes: notes || null,
    }));

    const { error: insertErr } = await supabase.from("metrics").insert(rows);

    if (insertErr) {
      setSubmitError(insertErr.message);
    } else {
      setSubmitCount(rows.length);
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId(null);
    setQuarterDate(QUARTER_OPTIONS[2]?.date ?? "");
    setValues(emptyValues());
    setNotes("");
    setSubmitError(null);
    setSubmitted(false);
    setSubmitCount(0);
    setHasExisting(false);
  }

  if (submitted) {
    const property = properties.find((p) => p.property_id === propertyId);
    const quarterLabel = QUARTER_OPTIONS.find((q) => q.date === quarterDate)?.label ?? quarterDate;
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Metrics {hasExisting ? "Updated" : "Submitted"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasExisting ? "Updated" : "Inserted"} {submitCount} metric{submitCount !== 1 ? "s" : ""} for{" "}
            {property?.name ?? "Unknown"} — {quarterLabel}.
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

  const quarterLabel = QUARTER_OPTIONS.find((q) => q.date === quarterDate)?.label ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hasExisting && quarterLabel
            ? `Editing Metrics — ${quarterLabel}`
            : "New Metrics"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Property + Quarter row */}
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
              Quarter
            </label>
            <select
              value={quarterDate}
              onChange={(e) => setQuarterDate(e.target.value)}
              className={inputClass}
            >
              {QUARTER_OPTIONS.map((q) => (
                <option key={q.date} value={q.date}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing data badge */}
        {loadingExisting && (
          <p className="mt-3 text-xs text-muted-foreground">Loading existing data…</p>
        )}
        {!loadingExisting && hasExisting && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Existing data found for this quarter — fields pre-filled. Saving will replace all metrics for this period.
          </div>
        )}

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
                      onChange={(e) => handleValueChange(m.type, e.target.value)}
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
            placeholder="e.g. Q4 2024 investor report"
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
          disabled={!isValid || submitting || loadingExisting}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Saving..."
            : hasExisting
              ? `Update ${filledCount} Metric${filledCount !== 1 ? "s" : ""}`
              : `Submit ${filledCount} Metric${filledCount !== 1 ? "s" : ""}`}
        </button>
      </CardContent>
    </Card>
  );
}
