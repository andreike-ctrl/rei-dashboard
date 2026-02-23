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

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

const textareaClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-y";

type Fields = {
  name: string;
  entity: string;
  gp: string;
  asset_class: string;
  strategy: string;
  property_class: string;
  msa: string;
  state: string;
  lat: string;
  lon: string;
  website: string;
  investment_date: string;
  exit_date: string;
  units: string;
  buildings: string;
  beds: string;
  vo2_raise: string;
  total_equity: string;
  total_debt: string;
  purchase_price: string;
  projected_lp_irr: string;
  projected_irr: string;
  projected_multiple: string;
  senior_loan_rate: string;
  investment_thesis: string;
};

function emptyFields(): Fields {
  return {
    name: "",
    entity: "",
    gp: "",
    asset_class: "",
    strategy: "",
    property_class: "",
    msa: "",
    state: "",
    lat: "",
    lon: "",
    website: "",
    investment_date: "",
    exit_date: "",
    units: "",
    buildings: "",
    beds: "",
    vo2_raise: "",
    total_equity: "",
    total_debt: "",
    purchase_price: "",
    projected_lp_irr: "",
    projected_irr: "",
    projected_multiple: "",
    senior_loan_rate: "",
    investment_thesis: "",
  };
}

function propToFields(p: Property): Fields {
  return {
    name: p.name ?? "",
    entity: p.entity ?? "",
    gp: p.gp ?? "",
    asset_class: p.asset_class ?? "",
    strategy: p.strategy ?? "",
    property_class: p.property_class ?? "",
    msa: p.msa ?? "",
    state: p.state ?? "",
    lat: p.lat != null ? String(p.lat) : "",
    lon: p.lon != null ? String(p.lon) : "",
    website: p.website ?? "",
    investment_date: p.investment_date ?? "",
    exit_date: p.exit_date ?? "",
    units: p.units != null ? String(p.units) : "",
    buildings: p.buildings != null ? String(p.buildings) : "",
    beds: p.beds ?? "",
    vo2_raise: p.vo2_raise != null ? String(p.vo2_raise) : "",
    total_equity: p.total_equity != null ? String(p.total_equity) : "",
    total_debt: p.total_debt != null ? String(p.total_debt) : "",
    purchase_price: p.purchase_price != null ? String(p.purchase_price) : "",
    projected_lp_irr:
      p.projected_lp_irr != null ? String(p.projected_lp_irr) : "",
    projected_irr: p.projected_irr != null ? String(p.projected_irr) : "",
    projected_multiple:
      p.projected_multiple != null ? String(p.projected_multiple) : "",
    senior_loan_rate:
      p.senior_loan_rate != null ? String(p.senior_loan_rate) : "",
    investment_thesis: p.investment_thesis ?? "",
  };
}

function buildPayload(f: Fields) {
  const num = (v: string, fallback = 0) =>
    v !== "" && !isNaN(parseFloat(v)) ? parseFloat(v) : fallback;
  const int = (v: string) =>
    v !== "" && !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : null;
  return {
    name: f.name.trim(),
    entity: f.entity.trim(),
    gp: f.gp.trim(),
    asset_class: f.asset_class.trim(),
    strategy: f.strategy.trim(),
    property_class: f.property_class.trim(),
    msa: f.msa.trim(),
    state: f.state.trim(),
    lat: num(f.lat, null as unknown as number) as number | null,
    lon: num(f.lon, null as unknown as number) as number | null,
    website: f.website.trim() || null,
    investment_date: f.investment_date || null,
    exit_date: f.exit_date || null,
    units: int(f.units),
    buildings: int(f.buildings),
    beds: f.beds.trim() || null,
    vo2_raise: num(f.vo2_raise),
    total_equity: num(f.total_equity),
    total_debt: num(f.total_debt),
    purchase_price: num(f.purchase_price),
    projected_lp_irr: num(f.projected_lp_irr),
    projected_irr: num(f.projected_irr),
    projected_multiple: num(f.projected_multiple),
    senior_loan_rate: num(f.senior_loan_rate),
    investment_thesis: f.investment_thesis.trim() || null,
  };
}

interface Props {
  properties: Property[];
}

export function PropertyForm({ properties }: Props) {
  const [selectedId, setSelectedId] = useState(""); // "" = new property
  const [fields, setFields] = useState<Fields>(emptyFields());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [wasNew, setWasNew] = useState(false);

  // Pre-fill when an existing property is selected
  useEffect(() => {
    setSubmitError(null);
    setSubmitted(false);
    if (!selectedId) {
      setFields(emptyFields());
      return;
    }
    const prop = properties.find(
      (p) => p.property_id === parseInt(selectedId, 10)
    );
    if (prop) setFields(propToFields(prop));
  }, [selectedId, properties]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const isNew = selectedId === "";
  const isValid = fields.name.trim() !== "" && fields.investment_date !== "";

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = buildPayload(fields);
    let error;

    if (isNew) {
      ({ error } = await supabase.from("properties").insert([payload]));
    } else {
      ({ error } = await supabase
        .from("properties")
        .update(payload)
        .eq("property_id", parseInt(selectedId, 10)));
    }

    if (error) {
      setSubmitError(error.message);
    } else {
      setSavedName(fields.name.trim());
      setWasNew(isNew);
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  function handleReset() {
    setSelectedId("");
    setFields(emptyFields());
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {wasNew ? "Property Created" : "Property Updated"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong>{savedName}</strong> has been{" "}
            {wasNew ? "added to" : "updated in"} the database.
          </p>
          <button
            onClick={handleReset}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {wasNew ? "Add Another Property" : "Edit Another Property"}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "New Property" : "Edit Property"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Property selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Select existing property to edit, or leave blank to create new
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={inputClass}
          >
            <option value="">— New property —</option>
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Identity */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Identity
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                placeholder="e.g. Maple Ridge Apartments"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Entity
              </label>
              <input
                type="text"
                value={fields.entity}
                onChange={(e) => set("entity", e.target.value)}
                className={inputClass}
                placeholder="e.g. Maple Ridge LLC"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                General Partner
              </label>
              <input
                type="text"
                value={fields.gp}
                onChange={(e) => set("gp", e.target.value)}
                className={inputClass}
                placeholder="e.g. Acme Capital"
              />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Classification
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Asset Class
              </label>
              <input
                type="text"
                value={fields.asset_class}
                onChange={(e) => set("asset_class", e.target.value)}
                className={inputClass}
                placeholder="e.g. Multifamily"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Strategy
              </label>
              <input
                type="text"
                value={fields.strategy}
                onChange={(e) => set("strategy", e.target.value)}
                className={inputClass}
                placeholder="e.g. Value-Add"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Property Class
              </label>
              <input
                type="text"
                value={fields.property_class}
                onChange={(e) => set("property_class", e.target.value)}
                className={inputClass}
                placeholder="e.g. B+"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Location
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                MSA
              </label>
              <input
                type="text"
                value={fields.msa}
                onChange={(e) => set("msa", e.target.value)}
                className={inputClass}
                placeholder="e.g. Austin-Round Rock"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                State
              </label>
              <input
                type="text"
                value={fields.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputClass}
                placeholder="e.g. TX"
                maxLength={2}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={fields.lat}
                onChange={(e) => set("lat", e.target.value)}
                className={inputClass}
                placeholder="e.g. 30.2672"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={fields.lon}
                onChange={(e) => set("lon", e.target.value)}
                className={inputClass}
                placeholder="e.g. -97.7431"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Website{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                type="url"
                value={fields.website}
                onChange={(e) => set("website", e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Dates
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Investment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fields.investment_date}
                onChange={(e) => set("investment_date", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Exit Date{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                type="date"
                value={fields.exit_date}
                onChange={(e) => set("exit_date", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Physical */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Physical
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Units
              </label>
              <input
                type="number"
                step="1"
                value={fields.units}
                onChange={(e) => set("units", e.target.value)}
                className={inputClass}
                placeholder="e.g. 200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Buildings
              </label>
              <input
                type="number"
                step="1"
                value={fields.buildings}
                onChange={(e) => set("buildings", e.target.value)}
                className={inputClass}
                placeholder="e.g. 4"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Beds
              </label>
              <input
                type="text"
                value={fields.beds}
                onChange={(e) => set("beds", e.target.value)}
                className={inputClass}
                placeholder="e.g. 1BR/2BR/3BR"
              />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Financials ($)
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                VO2 Raise
              </label>
              <input
                type="number"
                step="1"
                value={fields.vo2_raise}
                onChange={(e) => set("vo2_raise", e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Total Equity
              </label>
              <input
                type="number"
                step="1"
                value={fields.total_equity}
                onChange={(e) => set("total_equity", e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Total Debt
              </label>
              <input
                type="number"
                step="1"
                value={fields.total_debt}
                onChange={(e) => set("total_debt", e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Purchase Price
              </label>
              <input
                type="number"
                step="1"
                value={fields.purchase_price}
                onChange={(e) => set("purchase_price", e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Projections */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projections
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Projected LP IRR{" "}
                <span className="font-normal text-muted-foreground">(%)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fields.projected_lp_irr}
                onChange={(e) => set("projected_lp_irr", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Projected IRR{" "}
                <span className="font-normal text-muted-foreground">(%)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fields.projected_irr}
                onChange={(e) => set("projected_irr", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Projected Multiple{" "}
                <span className="font-normal text-muted-foreground">(x)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fields.projected_multiple}
                onChange={(e) => set("projected_multiple", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Senior Loan Rate{" "}
                <span className="font-normal text-muted-foreground">(%)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fields.senior_loan_rate}
                onChange={(e) => set("senior_loan_rate", e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Investment Thesis */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Investment Thesis{" "}
            <span className="normal-case font-normal">(optional)</span>
          </h4>
          <textarea
            value={fields.investment_thesis}
            onChange={(e) => set("investment_thesis", e.target.value)}
            rows={4}
            placeholder="Describe the property's investment strategy and business plan…"
            className={textareaClass}
          />
        </div>

        {submitError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Failed to save: {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? "Saving…"
            : isNew
              ? "Create Property"
              : "Save Changes"}
        </button>
      </CardContent>
    </Card>
  );
}
