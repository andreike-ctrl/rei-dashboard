import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PropertyCard } from "@/components/PropertyCard";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { Property, PropertyWithNav, Valuation, Transaction } from "@/types/database";

/** Transaction types that represent funding / capital raised */
const FUNDING_TYPES = new Set(["Capital Call", "Funding", "Purchase"]);


export function Dashboard() {
  const [properties, setProperties] = useState<PropertyWithNav[]>([]);
  const [allValuations, setAllValuations] = useState<Valuation[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAssetClass, setFilterAssetClass] = useState<string>("All");
  const [filterGp, setFilterGp] = useState<string>("All");

  // Property-level checkbox filter: set of checked property_ids (all checked by default)
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [propertyPickerOpen, setPropertyPickerOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: props, error: propErr } = await supabase
        .from("properties")
        .select("*")
        .order("name");

      if (propErr) {
        setError(propErr.message);
        setLoading(false);
        return;
      }

      const { data: vals, error: valErr } = await supabase
        .from("valuations")
        .select("*")
        .order("date", { ascending: false });

      if (valErr) {
        setError(valErr.message);
        setLoading(false);
        return;
      }

      const { data: txns, error: txnErr } = await supabase
        .from("transactions")
        .select("*");

      if (txnErr) {
        setError(txnErr.message);
        setLoading(false);
        return;
      }

      const typedVals = vals as Valuation[];
      setAllValuations(typedVals);
      setAllTransactions(txns as Transaction[]);

      // Build a map of property_id -> latest NAV
      const latestNavMap = new Map<number, number>();
      for (const v of typedVals) {
        if (!latestNavMap.has(v.property_id)) {
          latestNavMap.set(v.property_id, v.nav);
        }
      }

      const enriched: PropertyWithNav[] = (props as Property[]).map((p) => ({
        ...p,
        latest_nav: latestNavMap.get(p.property_id) ?? null,
      }));

      setProperties(enriched);
      // Default: all properties checked
      setCheckedIds(new Set(enriched.map((p) => p.property_id)));
      setLoading(false);
    }

    load();
  }, []);

  // Derive unique asset classes for filter
  const assetClasses = [
    "All",
    ...Array.from(new Set(properties.map((p) => p.asset_class))).sort(),
  ];

  // Derive unique GPs for filter
  const gps = [
    "All",
    ...Array.from(new Set(properties.map((p) => p.gp))).sort(),
  ];

  // Filter properties by search + asset class
  const searchAndClassFiltered = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.msa.toLowerCase().includes(search.toLowerCase()) ||
        p.state.toLowerCase().includes(search.toLowerCase());

      const matchesClass =
        filterAssetClass === "All" || p.asset_class === filterAssetClass;

      const matchesGp = filterGp === "All" || p.gp === filterGp;

      return matchesSearch && matchesClass && matchesGp;
    });
  }, [properties, search, filterAssetClass, filterGp]);

  // Final filtered list = search + class + checked
  const filtered = useMemo(
    () => searchAndClassFiltered.filter((p) => checkedIds.has(p.property_id)),
    [searchAndClassFiltered, checkedIds]
  );

  // Toggle a single property
  const toggleProperty = useCallback((id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select / deselect all (within current search + class filter)
  const allVisibleChecked = searchAndClassFiltered.every((p) =>
    checkedIds.has(p.property_id)
  );

  const toggleAll = useCallback(() => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleChecked) {
        for (const p of searchAndClassFiltered) {
          next.delete(p.property_id);
        }
      } else {
        for (const p of searchAndClassFiltered) {
          next.add(p.property_id);
        }
      }
      return next;
    });
  }, [searchAndClassFiltered, allVisibleChecked]);

  // Filter valuations to only those belonging to filtered properties
  const filteredPropertyIds = useMemo(
    () => new Set(filtered.map((p) => p.property_id)),
    [filtered]
  );

  const filteredValuations = useMemo(
    () => allValuations.filter((v) => filteredPropertyIds.has(v.property_id)),
    [allValuations, filteredPropertyIds]
  );

  // Total NAV = sum of latest NAV per filtered property
  const totalNav = useMemo(
    () => filtered.reduce((sum, p) => sum + (p.latest_nav ?? 0), 0),
    [filtered]
  );

  // Filter transactions to only those belonging to filtered properties
  const filteredTransactions = useMemo(
    () => allTransactions.filter((t) => filteredPropertyIds.has(t.property_id)),
    [allTransactions, filteredPropertyIds]
  );

  // Total raised = sum of funding transaction cash amounts (inverted sign — calls are positive in DB)
  const totalRaised = useMemo(
    () =>
      -filteredTransactions
        .filter((t) => FUNDING_TYPES.has(t.type))
        .reduce((sum, t) => sum + t.cash_amount, 0),
    [filteredTransactions]
  );

  // Total distributions paid
  const totalDividends = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "Distribution")
        .reduce((sum, t) => sum + t.cash_amount, 0),
    [filteredTransactions]
  );

  // Total other proceeds (sales, refis, etc.)
  const totalOtherProceeds = useMemo(
    () =>
      filteredTransactions
        .filter((t) => !FUNDING_TYPES.has(t.type) && t.type !== "Distribution")
        .reduce((sum, t) => sum + t.cash_amount, 0),
    [filteredTransactions]
  );

  // Current MOIC = (Total NAV + Total Distributions + Other Proceeds) / Total Raised
  const currentMoic = useMemo(
    () =>
      totalRaised > 0 ? (totalNav + totalDividends + totalOtherProceeds) / totalRaised : null,
    [totalNav, totalDividends, totalOtherProceeds, totalRaised]
  );

  const checkedCount = searchAndClassFiltered.filter((p) =>
    checkedIds.has(p.property_id)
  ).length;

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {properties.length} investment{properties.length !== 1 ? "s" : ""}{" "}
          across the VO2 portfolio
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, MSA, or state…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
        <select
          value={filterAssetClass}
          onChange={(e) => setFilterAssetClass(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          {assetClasses.map((ac) => (
            <option key={ac} value={ac}>
              {ac === "All" ? "All Asset Classes" : ac}
            </option>
          ))}
        </select>
        <select
          value={filterGp}
          onChange={(e) => setFilterGp(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          {gps.map((gp) => (
            <option key={gp} value={gp}>
              {gp === "All" ? "All GPs" : gp}
            </option>
          ))}
        </select>

        {/* Property picker dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPropertyPickerOpen((o) => !o)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground hover:bg-secondary/60 transition-colors"
          >
            Properties ({checkedCount}/{searchAndClassFiltered.length})
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {propertyPickerOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPropertyPickerOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 z-50 mt-1 w-72 rounded-md border border-border bg-background shadow-lg">
                {/* Select / Deselect all */}
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      allVisibleChecked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {allVisibleChecked && <Check className="h-3 w-3" />}
                  </span>
                  {allVisibleChecked ? "Deselect all" : "Select all"}
                </button>

                <div className="max-h-64 overflow-y-auto py-1">
                  {searchAndClassFiltered.map((p) => {
                    const isChecked = checkedIds.has(p.property_id);
                    return (
                      <button
                        key={p.property_id}
                        type="button"
                        onClick={() => toggleProperty(p.property_id)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Portfolio summary + chart */}
      <PortfolioSummary
        valuations={filteredValuations}
        transactions={filteredTransactions}
        totalNav={totalNav}
        propertyCount={filtered.length}
        totalRaised={totalRaised}
        totalDividends={totalDividends}
        totalOtherProceeds={totalOtherProceeds}
        currentMoic={currentMoic}
      />

      {/* Property list */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No properties match your filters.
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <PropertyCard key={p.property_id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
