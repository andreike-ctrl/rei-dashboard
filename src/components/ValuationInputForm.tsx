import { useState, useEffect, useMemo } from "react";
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
  formatPercent,
} from "@/lib/format";
import type { Property, Valuation, Investor, Transaction } from "@/types/database";

const UNIT_TRANSACTION_TYPES = new Set([
  "Capital Call",
  "Funding",
  "Purchase",
  "Sale",
  "Shares Awarded",
  "Distribution",
]);

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

interface CapTableEntry {
  investorId: number;
  name: string;
  units: number;
  ownership: number; // 0–1
}

interface ValuationInputFormProps {
  properties: Property[];
  investors: Investor[];
  transactions: Transaction[];
}

export function ValuationInputForm({ properties, investors, transactions }: ValuationInputFormProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [nav, setNav] = useState("");
  const [unitsOutstanding, setUnitsOutstanding] = useState("");

  // Investor NAV calculation
  const [investorId, setInvestorId] = useState<number | null>(null);
  const [investorNav, setInvestorNav] = useState("");

  const [lastValuation, setLastValuation] = useState<Valuation | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Build cap table for the selected property from transactions
  const capTable = useMemo<CapTableEntry[]>(() => {
    if (propertyId == null) return [];

    const unitsByInvestor = new Map<number, number>();
    for (const txn of transactions) {
      if (txn.property_id !== propertyId) continue;
      if (!UNIT_TRANSACTION_TYPES.has(txn.type)) continue;
      if (txn.units == null) continue;
      unitsByInvestor.set(
        txn.investor_id,
        (unitsByInvestor.get(txn.investor_id) ?? 0) + txn.units
      );
    }

    const totalUnits = Array.from(unitsByInvestor.values()).reduce((a, b) => a + b, 0);
    if (totalUnits <= 0) return [];

    const investorMap = new Map(investors.map((i) => [i.investor_id, i]));

    return Array.from(unitsByInvestor.entries())
      .filter(([, units]) => units > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([invId, units]) => ({
        investorId: invId,
        name: investorMap.get(invId)?.name ?? `Investor #${invId}`,
        units,
        ownership: units / totalUnits,
      }));
  }, [propertyId, transactions, investors]);

  // Fetch latest valuation when property changes
  useEffect(() => {
    if (propertyId == null) {
      setLastValuation(null);
      return;
    }
    setLoadingLast(true);
    setInvestorId(null);
    setInvestorNav("");
    supabase
      .from("valuations")
      .select("*")
      .eq("property_id", propertyId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLastValuation(data as Valuation | null);
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

  // Investor NAV → implied total NAV
  const selectedCapEntry = capTable.find((e) => e.investorId === investorId);
  const investorNavVal = parseFloat(investorNav);
  const impliedTotalNav =
    selectedCapEntry && !isNaN(investorNavVal) && investorNavVal > 0 && selectedCapEntry.ownership > 0
      ? investorNavVal / selectedCapEntry.ownership
      : null;

  // Sanity check values
  const newNavPerUnit = hasNewNav && hasNewUnits ? newNav / newUnits : null;
  const prevNav = lastValuation?.nav ?? null;
  const prevNavPerUnit = lastValuation?.nav_per_unit ?? null;
  const navChangeDollar = hasNewNav && prevNav != null ? newNav - prevNav : null;
  const navChangePct =
    navChangeDollar != null && prevNav != null && prevNav !== 0
      ? navChangeDollar / prevNav
      : null;
  const prevUnits = lastValuation?.units_outstanding ?? null;
  const unitsChanged = hasNewUnits && prevUnits != null && newUnits !== prevUnits;
  const moic =
    hasNewNav && selectedProperty && selectedProperty.vo2_raise > 0
      ? newNav / selectedProperty.vo2_raise
      : null;
  const bigMove = navChangePct != null && Math.abs(navChangePct) > 0.3;

  const isValid = propertyId != null && asOfDate !== "" && hasNewNav && hasNewUnits;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError(null);

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

    const { error } = await supabase.from("valuations").insert({
      valuation_id: nextId,
      property_id: propertyId,
      date: asOfDate,
      units_outstanding: newUnits,
      nav: newNav,
      nav_per_unit: newNav / newUnits,
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
    setInvestorId(null);
    setInvestorNav("");
    setLastValuation(null);
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">NAV Updated</h3>
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Property</label>
            <select
              value={propertyId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setPropertyId(val ? parseInt(val, 10) : null);
                setUnitsOutstanding("");
                setNav("");
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">As-of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Total NAV + Units */}
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Units Outstanding</label>
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

        {/* Calculate from investor NAV */}
        {propertyId != null && capTable.length > 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Or calculate total NAV from an investor's position
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Investor</label>
                <select
                  value={investorId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInvestorId(val ? parseInt(val, 10) : null);
                    setInvestorNav("");
                  }}
                  className={inputClass}
                >
                  <option value="">Select an investor…</option>
                  {capTable.map((entry) => (
                    <option key={entry.investorId} value={entry.investorId}>
                      {entry.name} — {formatPercent(entry.ownership)} ({formatNumber(entry.units)} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Investor NAV <span className="font-normal text-muted-foreground">($)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 1250000"
                  value={investorNav}
                  onChange={(e) => setInvestorNav(e.target.value)}
                  disabled={investorId == null}
                  className={`${inputClass} disabled:opacity-50`}
                />
              </div>
            </div>

            {impliedTotalNav != null && selectedCapEntry && (
              <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-background px-4 py-2.5">
                <div className="text-sm">
                  <span className="text-muted-foreground">{selectedCapEntry.name}</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{formatPercent(selectedCapEntry.ownership)} ownership</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">Implied total NAV: {formatCurrency(impliedTotalNav)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNav(impliedTotalNav.toFixed(2))}
                  className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sanity-check panel */}
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

                {/* Cap table */}
                {capTable.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Cap table</p>
                    <div className="space-y-1">
                      {capTable.map((entry) => (
                        <div key={entry.investorId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{entry.name}</span>
                          <span className="text-muted-foreground">
                            {formatNumber(entry.units)} units · {formatPercent(entry.ownership)}
                            {prevNavPerUnit != null && (
                              <span className="ml-2 text-foreground font-medium">
                                ≈ {formatCurrency(entry.units * prevNavPerUnit)}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                            ? navChangeDollar > 0 ? "up" : navChangeDollar < 0 ? "down" : "flat"
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
                            ? navChangePct > 0 ? "up" : navChangePct < 0 ? "down" : "flat"
                            : undefined
                        }
                      />
                      <StatCell
                        label="Implied MOIC"
                        value={moic != null ? formatMultiple(moic) : "—"}
                        sub={selectedProperty ? `on ${formatCurrency(selectedProperty.vo2_raise)} raise` : undefined}
                      />
                    </div>

                    {/* Per-investor preview with new NAV */}
                    {capTable.length > 0 && newNavPerUnit != null && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">New investor positions (at new NAV/unit)</p>
                        <div className="space-y-1">
                          {capTable.map((entry) => {
                            const newInvNav = entry.units * newNavPerUnit;
                            const prevInvNav = prevNavPerUnit != null ? entry.units * prevNavPerUnit : null;
                            const invChange = prevInvNav != null ? newInvNav - prevInvNav : null;
                            return (
                              <div key={entry.investorId} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{entry.name}</span>
                                <span className="text-muted-foreground">
                                  {formatCurrency(newInvNav)}
                                  {invChange != null && (
                                    <span className={invChange >= 0 ? "ml-2 text-emerald-600" : "ml-2 text-red-600"}>
                                      {invChange >= 0 ? "+" : ""}{formatCurrency(invChange)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                            : ""} — confirm this is intentional.
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
