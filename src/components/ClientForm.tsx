import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/Card";
import type { Client } from "@/types/database";

interface ClientFormProps {
  clients: Client[];
  onSaved: (client: Client) => void;
}

const EMPTY = { name: "", domicile: "", email: "", phone: "", address: "" };

export function ClientForm({ clients, onSaved }: ClientFormProps) {
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [fields, setFields] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedId === "new") {
      setFields(EMPTY);
    } else {
      const client = clients.find((c) => c.client_id === selectedId);
      if (client) {
        setFields({
          name: client.name ?? "",
          domicile: client.domicile ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          address: client.address ?? "",
        });
      }
    }
    setError(null);
    setSuccess(false);
  }, [selectedId, clients]);

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

    setSubmitting(true);
    setError(null);

    const payload = {
      name: fields.name.trim(),
      domicile: fields.domicile.trim() || null,
      email: fields.email.trim() || null,
      phone: fields.phone.trim() || null,
      address: fields.address.trim() || null,
    };

    if (selectedId === "new") {
      const { data, error: err } = await supabase
        .from("clients")
        .insert(payload)
        .select();
      if (err) {
        setError(err.message);
      } else {
        const saved = (data as Client[])?.[0];
        if (saved) {
          onSaved(saved);
          setSelectedId(saved.client_id);
          setSuccess(true);
        } else {
          setError("Insert succeeded but no record was returned. Check Supabase RLS policies.");
        }
      }
    } else {
      const { error: err } = await supabase
        .from("clients")
        .update(payload)
        .eq("client_id", selectedId);
      if (err) {
        setError(err.message);
      } else {
        // Construct updated record from local state since RLS may block SELECT after UPDATE
        const updated: Client = {
          client_id: selectedId,
          name: payload.name,
          domicile: payload.domicile ?? "",
          email: payload.email ?? "",
          phone: payload.phone ?? "",
          address: payload.address ?? "",
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
          {/* Client selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Client
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
              <option value="new">+ New client</option>
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
                Domicile
              </label>
              <input
                type="text"
                value={fields.domicile}
                onChange={(e) => set("domicile", e.target.value)}
                placeholder="e.g. Texas, USA"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={fields.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Phone
              </label>
              <input
                type="text"
                value={fields.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-9 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
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

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Client {isNew ? "created" : "updated"} successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="h-9 px-6 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isNew
                ? "Create Client"
                : "Save Changes"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
