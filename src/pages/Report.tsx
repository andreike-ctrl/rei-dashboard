import { useEffect, useState, useRef } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { Download, ImagePlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PropertyReportPDF } from "@/components/PropertyReportPDF";
import { Spinner } from "@/components/ui/Spinner";
import type { Property, Valuation, Transaction, Metric, Investor, Client } from "@/types/database";

export interface PhotoItem {
  dataUrl: string;
  caption: string;
}

// ── Generate period options: H1/H2 from 2022 to current year + 1 ──
function generatePeriods(): string[] {
  const periods: string[] = [];
  const endYear = new Date().getFullYear() + 1;
  for (let y = 2022; y <= endYear; y++) {
    periods.push(`H1 ${y}`, `H2 ${y}`);
  }
  return periods.reverse(); // most recent first
}

const PERIODS = generatePeriods();

export function Report() {
  // ── Properties list ──
  const [properties, setProperties] = useState<Property[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);

  // ── Report controls ──
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [period, setPeriod] = useState<string>(PERIODS[2] ?? PERIODS[0]); // default to current half-year area
  const [commentary, setCommentary] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    Promise.all(
      files.map(
        (file) =>
          new Promise<PhotoItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ dataUrl: reader.result as string, caption: "" });
            reader.readAsDataURL(file);
          })
      )
    ).then((newPhotos) => setPhotos((prev) => [...prev, ...newPhotos]));
    e.target.value = "";
  }

  function updateCaption(index: number, caption: string) {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, caption } : p))
    );
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Property data for the selected property ──
  const [property, setProperty] = useState<Property | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // ── Load properties on mount ──
  useEffect(() => {
    supabase.from("properties").select("*").order("name").then(({ data }) => {
      if (data) setProperties(data as Property[]);
      setPropsLoading(false);
    });
  }, []);

  // ── Load full property data when selection changes ──
  useEffect(() => {
    if (!selectedPropertyId) {
      setProperty(null);
      return;
    }

    setDataLoading(true);

    async function load() {
      const id = selectedPropertyId!;

      const [propRes, valRes, txnRes, metricRes] = await Promise.all([
        supabase.from("properties").select("*").eq("property_id", id).single(),
        supabase.from("valuations").select("*").eq("property_id", id).order("date", { ascending: true }),
        supabase.from("transactions").select("*").eq("property_id", id).order("date", { ascending: true }),
        supabase.from("metrics").select("*").eq("property_id", id).order("as_of_date", { ascending: true }),
      ]);

      const typedTxns = (txnRes.data ?? []) as Transaction[];

      // fetch investors + clients
      const investorIds = [...new Set(typedTxns.map((t) => t.investor_id))];
      let typedInvestors: Investor[] = [];
      let typedClients: Client[] = [];

      if (investorIds.length > 0) {
        const { data: invData } = await supabase.from("investors").select("*").in("investor_id", investorIds);
        typedInvestors = (invData ?? []) as Investor[];
        const clientIds = [...new Set(typedInvestors.map((i) => i.client_id))];
        if (clientIds.length > 0) {
          const { data: cliData } = await supabase.from("clients").select("*").in("client_id", clientIds);
          typedClients = (cliData ?? []) as Client[];
        }
      }

      setProperty((propRes.data as Property) ?? null);
      setValuations((valRes.data ?? []) as Valuation[]);
      setTransactions(typedTxns);
      setMetrics((metricRes.data ?? []) as Metric[]);
      setInvestors(typedInvestors);
      setClients(typedClients);
      setDataLoading(false);
    }

    load();
  }, [selectedPropertyId]);

  const pdfReady = property !== null && !dataLoading;

  const pdfDoc = pdfReady ? (
    <PropertyReportPDF
      property={property}
      valuations={valuations}
      transactions={transactions}
      metrics={metrics}
      investors={investors}
      clients={clients}
      period={period}
      commentary={commentary}
      photos={photos}
    />
  ) : null;

  const fileName = property
    ? `VO2 Report ${period.split(" ").reverse().join(" ")} ${property.name}.pdf`
    : "VO2 Report.pdf";

  return (
    <div className="flex flex-col gap-6">

      {/* ── Controls bar ── */}
      <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Report Builder</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Property selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Property
            </label>
            {propsLoading ? (
              <div className="h-9 rounded-md border border-border animate-pulse bg-muted/40" />
            ) : (
              <select
                value={selectedPropertyId ?? ""}
                onChange={(e) => setSelectedPropertyId(e.target.value ? parseInt(e.target.value) : null)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a property…</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Period selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reporting Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Download button — only when ready */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground opacity-0 select-none">
              &nbsp;
            </label>
            {pdfReady && pdfDoc ? (
              <PDFDownloadLink document={pdfDoc} fileName={fileName}>
                {({ loading: pdfLoading }) => (
                  <button
                    disabled={pdfLoading}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-700 text-white px-4 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {pdfLoading ? "Preparing…" : "Download PDF"}
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <button
                disabled
                className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 text-sm font-semibold opacity-30"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Commentary */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Manager Commentary <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={4}
            placeholder="Add text here"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Photo gallery */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Photos <span className="normal-case font-normal">(optional)</span>
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="relative">
                    <img
                      src={photo.dataUrl}
                      alt=""
                      className="h-28 w-full rounded-md object-cover border border-border"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updateCaption(i, e.target.value)}
                    placeholder="Caption (optional)"
                    className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Preview pane ── */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {!selectedPropertyId ? (
          <div className="flex h-[700px] items-center justify-center bg-muted/20">
            <p className="text-sm text-muted-foreground">Select a property to preview the report.</p>
          </div>
        ) : dataLoading ? (
          <div className="flex h-[700px] items-center justify-center bg-muted/20">
            <Spinner />
          </div>
        ) : pdfDoc ? (
          <PDFViewer width="100%" height={700} showToolbar={false} style={{ border: "none" }}>
            {pdfDoc}
          </PDFViewer>
        ) : null}
      </div>

    </div>
  );
}
