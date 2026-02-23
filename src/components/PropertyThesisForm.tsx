import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/Card";
import type { Property } from "@/types/database";

interface Props {
  properties: Property[];
}

export function PropertyThesisForm({ properties }: Props) {
  const [propertyId, setPropertyId] = useState("");
  const [thesis, setThesis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // When property changes, pre-fill existing thesis
  useEffect(() => {
    if (!propertyId) { setThesis(""); return; }
    const prop = properties.find((p) => p.property_id === parseInt(propertyId, 10));
    setThesis(prop?.investment_thesis ?? "");
  }, [propertyId, properties]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase
      .from("properties")
      .update({ investment_thesis: thesis.trim() || null })
      .eq("property_id", parseInt(propertyId, 10));

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId("");
    setThesis("");
    setSubmitError(null);
    setSubmitted(false);
  }

  if (submitted) {
    const prop = properties.find((p) => p.property_id === parseInt(propertyId, 10));
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h3 className="mt-4 text-base font-semibold text-foreground">Investment Thesis Saved</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Updated thesis for <strong>{prop?.name}</strong>.
          </p>
          <button
            onClick={handleReset}
            className="mt-5 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Edit Another Property
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a property…</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Thesis textarea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Investment Thesis
            </label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={6}
              placeholder="Describe the property's investment strategy and business plan…"
              disabled={!propertyId}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 resize-y"
            />
          </div>

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!propertyId || submitting}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Thesis"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
