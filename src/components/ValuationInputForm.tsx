import { useState, useEffect } from "react";
import { CheckCircle2, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatMultiple,
  formatNumber,
} from "@/lib/format";
import type { Property, Valuation } from "@/types/database";

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

interface ValuationInputFormProps {
  properties: Property[];
}

export function ValuationInputForm({ properties }: ValuationInputFormProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [nav, setNav] = useState("");
  const [unitsOutstanding, setUnitsOutstanding] = useState("");

  const [lastValuation, setLastValuation] = useState<Valuation | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch latest valuation when property changes
  useEffect(() => {
    if (propertyId == null) {
      setLastValuation(null);
      return;
    }
    setLoadingLast(true);
    supabase
      .from("valuations")
      .select("*")
      .eq("property_id", propertyId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLastValuation(data as Valuation | null);
        // Pre-fill units from last valuation if field is empty
        if (data && !unitsOutstanding) {
          setUnitsOutstanding(String(data.units_outstanding));
        }
        setLoadingLast(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const selectedProperty = properties.find((p) => p.property_id === propertyId);
  const newNav = parseFloat(nav);
  const newUnits = parseFloat(unitsOutstanding);
  const hasNewNav = !isNaN(newNav) && newNav > 0;
  const hasNewUnits = !isNaN(newUnits) && newUnits > 0;

  // Derived sanity-check values
  const newNavPerUnit = hasNewNav && hasNewUnits ? newNav / newUnits : null;
  const prevNav = lastValuation?.nav ?? null;
  const prevNavPerUnit = lastValuation?.nav_per_unit ?? null;
  const navChangeDollar = hasNewNav && prevNav != null ? newNav - prevNav : null;
  const navChangePct = navChangeDollar != null && prevNav != null && prevNav !== 0 ? navChangeDollar / prevNav : null;
  const prevUnits = lastValuation?.units_outstanding ?? null;
  const unitsChanged = hasNewUnits && prevUnits != null && newUnits !== prevUnits;
  const moic = hasNewNav && selectedProperty && selectedProperty.vo2_raise > 0 ? newNav / selectedProperty.vo2_raise : null;

  // Warn if NAV change > 30% in either direction
  const bigMove = navChangePct != null && Math.abs(navChangePct) > 0.3;

  const isValid =
    propertyId != null &&
    asOfDate !== "" &&
    hasNewNav &&
    hasNewUnits;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError(null);

    // Get next valuation_id (column is INT PK, not SERIAL)
    const { data: maxRow, error: maxErr } = await supabase
      .from("valuations")
      .select("valuation_id")
      .order("valuation_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      setSubmitError(maxErr.message);
      setSubmitting(false);
      return;
    }

    const nextId = ((maxRow as { valuation_id: number } | null)?.valuation_id ?? 0) + 1;
    const navPerUnit = newNav / newUnits;

    const { error } = await supabase.from("valuations").insert({
      valuation_id: nextId,
      property_id: propertyId,
      date: asOfDate,
      units_outstanding: newUnits,
      nav: newNav,
      nav_per_unit: navPerUnit,
    });

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId(null);
    setAsOfDate(new Date().toISOString().slice(0, 10));
    setNav("");
    setUnitsOutstanding("");
    setLastValuation(null);
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            NAV Updated
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Recorded {formatCurrency(newNav)} NAV ({formatCurrencyDetailed(newNav / newUnits)}/unit)
            for {selectedProperty?.name ?? "Unknown"} as of {asOfDate}.
          </p>
          <button
            onClick={handleReset}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enter Another NAV
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Valuation</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Property + Date */}
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
                setUnitsOutstanding("");
              }}
              className={inputClass}
            >
              <option value="">Select a property…</option>
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

        {/* NAV + Units */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Total NAV <span className="font-normal text-muted-foreground">($)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 12500000"
              value={nav}
              onChange={(e) => setNav(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Units Outstanding
            </label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 10000"
              value={unitsOutstanding}
              onChange={(e) => setUnitsOutstanding(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Sanity-check panel — shown as soon as a property is selected */}
        {propertyId != null && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sanity Check
            </h4>

            {loadingLast ? (
              <p className="text-sm text-muted-foreground">Loading previous valuation…</p>
            ) : (
              <div className="space-y-4">
                {/* Previous valuation */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Last valuation
                    {lastValuation ? ` — ${formatDate(lastValuation.date)}` : " — none on record"}
                  </p>
                  {lastValuation ? (
                    <div className="grid grid-cols-3 gap-3">
                      <StatCell label="Total NAV" value={formatCurrency(prevNav)} />
                      <StatCell label="NAV / unit" value={formatCurrencyDetailed(prevNavPerUnit)} />
                      <StatCell label="Units outstanding" value={formatNumber(prevUnits)} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      This will be the first valuation for this property.
                    </p>
                  )}
                </div>

                {/* Preview of new values */}
                {(hasNewNav || hasNewUnits) && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">New values preview</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCell
                        label="NAV / unit"
                        value={newNavPerUnit != null ? formatCurrencyDetailed(newNavPerUnit) : "—"}
                      />
                      <StatCell
                        label="NAV change"
                        value={
                          navChangeDollar != null
                            ? `${navChangeDollar >= 0 ? "+" : ""}${formatCurrency(navChangeDollar)}`
                            : lastValuation ? "—" : "n/a (first)"
                        }
                        accent={
                          navChangeDollar != null
                            ? navChangeDollar > 0
                              ? "up"
                              : navChangeDollar < 0
                                ? "down"
                                : "flat"
                            : undefined
                        }
                      />
                      <StatCell
                        label="NAV change %"
                        value={
                          navChangePct != null
                            ? `${navChangePct >= 0 ? "+" : ""}${(navChangePct * 100).toFixed(1)}%`
                            : lastValuation ? "—" : "n/a (first)"
                        }
                        accent={
                          navChangePct != null
                            ? navChangePct > 0
                              ? "up"
                              : navChangePct < 0
                                ? "down"
                                : "flat"
                            : undefined
                        }
                      />
                      <StatCell
                        label="Implied MOIC"
                        value={moic != null ? formatMultiple(moic) : "—"}
                        sub={selectedProperty ? `on ${formatCurrency(selectedProperty.vo2_raise)} raise` : undefined}
                      />
                    </div>

                    {/* Warnings */}
                    <div className="mt-3 space-y-2">
                      {bigMove && (
                        <Warning>
                          NAV moved {navChangePct != null ? `${(navChangePct * 100).toFixed(1)}%` : ""} from previous — double-check the figure.
                        </Warning>
                      )}
                      {unitsChanged && (
                        <Warning>
                          Units changed from {formatNumber(prevUnits)} to {formatNumber(newUnits)}
                          {prevUnits != null && newUnits != null
                            ? ` (${newUnits > prevUnits ? "+" : ""}${formatNumber(newUnits - prevUnits)})`
                            : ""}{" "}
                          — confirm this is intentional.
                        </Warning>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Failed to submit: {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting…" : "Save Valuation"}
        </button>
      </CardContent>
    </Card>
  );
}

function StatCell({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "up" | "down" | "flat";
}) {
  const valueClass =
    accent === "up"
      ? "text-emerald-600"
      : accent === "down"
        ? "text-red-600"
        : "text-foreground";

  const Icon =
    accent === "up" ? TrendingUp : accent === "down" ? TrendingDown : accent === "flat" ? Minus : null;

  return (
    <div className="rounded-md bg-background px-3 py-2 border border-border/60">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold flex items-center gap-1 ${valueClass}`}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
