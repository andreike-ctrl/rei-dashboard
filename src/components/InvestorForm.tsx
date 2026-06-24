import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/Card";
import type { Investor, Client } from "@/types/database";

interface InvestorFormProps {
  investors: Investor[];
  clients: Client[];
  onSaved: (investor: Investor) => void;
}

const INVESTOR_TYPES = ["Individual", "Joint", "Entity", "Trust", "LP", "LLC", "C Corp"];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
];

const RESPONSIBILITY_OPTIONS = ["N/A", "Client", "Veo 3"];

const EMPTY = {
  name: "",
  investor_type: "",
  client_id: "",
  tax_number: "",
  entity_number: "",
  address: "",
  state: "",
  annual_filings: "",
  annual_taxes: "",
};

export function InvestorForm({ investors, clients, onSaved }: InvestorFormProps) {
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [fields, setFields] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedId === "new") {
      setFields(EMPTY);
    } else {
      const inv = investors.find((i) => i.investor_id === selectedId);
      if (inv) {
        setFields({
          name: inv.name ?? "",
          investor_type: inv.investor_type ?? "",
          client_id: String(inv.client_id ?? ""),
          tax_number: inv.tax_number ?? "",
          entity_number: inv.entity_number ?? "",
          address: inv.address ?? "",
          state: inv.state ?? "",
          annual_filings: inv.annual_filings ?? "",
          annual_taxes: inv.annual_taxes ?? "",
        });
      }
    }
    setError(null);
    setSuccess(false);
  }, [selectedId, investors]);

  function set(field: keyof typeof EMPTY, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fields.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!fields.client_id) {
      setError("Client is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: fields.name.trim(),
      investor_type: fields.investor_type.trim() || null,
      client_id: parseInt(fields.client_id),
      tax_number: fields.tax_number.trim() || null,
      entity_number: fields.entity_number.trim() || null,
      address: fields.address.trim() || null,
      state: fields.state.trim() || null,
      annual_filings: fields.annual_filings || null,
      annual_taxes: fields.annual_taxes || null,
    };

    if (selectedId === "new") {
      const { data, error: err } = await supabase
        .from("investors")
        .insert(payload)
        .select();
      if (err) {
        setError(err.message);
      } else {
        const saved = (data as Investor[])?.[0];
        if (saved) {
          onSaved(saved);
          setSelectedId(saved.investor_id);
          setSuccess(true);
        } else {
          setError("Insert succeeded but no record was returned. Check Supabase RLS policies.");
        }
      }
    } else {
      const { data, error: err } = await supabase
        .from("investors")
        .update(payload)
        .eq("investor_id", selectedId)
        .select("investor_id");
      if (err) {
        setError(err.message);
      } else if (!data || data.length === 0) {
        setError("Update was blocked — check Supabase RLS policies for the investors table.");
      } else {
        const updated: Investor = {
          investor_id: selectedId,
          name: payload.name,
          investor_type: payload.investor_type ?? "",
          client_id: payload.client_id,
          tax_number: payload.tax_number ?? "",
          entity_number: payload.entity_number ?? null,
          address: payload.address ?? "",
          state: payload.state ?? "",
          annual_filings: payload.annual_filings ?? null,
          annual_taxes: payload.annual_taxes ?? null,
        };
        onSaved(updated);
        setSuccess(true);
      }
    }

    setSubmitting(false);
  }

  const isNew = selectedId === "new";

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Investor selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Investor
            </label>
            <select
              value={selectedId}
              onChange={(e) =>
                setSelectedId(
                  e.target.value === "new" ? "new" : parseInt(e.target.value)
                )
              }
              className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="new">+ New investor</option>
              {investors
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((i) => (
                  <option key={i.investor_id} value={i.investor_id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full legal name"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                value={fields.client_id}
                onChange={(e) => set("client_id", e.target.value)}
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select client…</option>
                {clients
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <option key={c.client_id} value={c.client_id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Investor Type
              </label>
              <select
                value={fields.investor_type}
                onChange={(e) => set("investor_type", e.target.value)}
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select type…</option>
                {INVESTOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tax Number (EIN / SSN)
              </label>
              <input
                type="text"
                value={fields.tax_number}
                onChange={(e) => set("tax_number", e.target.value)}
                placeholder="XX-XXXXXXX"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Business Entity Number
              </label>
              <input
                type="text"
                value={fields.entity_number}
                onChange={(e) => set("entity_number", e.target.value)}
                placeholder="e.g. L12345678901"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                State of Formation
              </label>
              <select
                value={fields.state}
                onChange={(e) => set("state", e.target.value)}
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select state…</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Address
            </label>
            <input
              type="text"
              value={fields.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, City, State ZIP"
              className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Responsibility */}
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Responsibility
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Annual Filings
                </label>
                <select
                  value={fields.annual_filings}
                  onChange={(e) => set("annual_filings", e.target.value)}
                  className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not set</option>
                  {RESPONSIBILITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Annual Taxes
                </label>
                <select
                  value={fields.annual_taxes}
                  onChange={(e) => set("annual_taxes", e.target.value)}
                  className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Not set</option>
                  {RESPONSIBILITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Investor {isNew ? "created" : "updated"} successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-9 px-6 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : isNew ? "Create Investor" : "Save Changes"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
