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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

interface LocationInputFormProps {
  properties: Property[];
}

interface GeoResult {
  lat: number;
  lon: number;
  placeName: string;
}

export function LocationInputForm({ properties }: LocationInputFormProps) {
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"building" | "poi">("building");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canGeocode = address.trim().length > 0;
  const hasValidCoords =
    lat !== "" && lon !== "" && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon));
  const canSubmit = propertyId != null && label.trim() !== "" && hasValidCoords;

  async function handleGeocode() {
    if (!canGeocode || !MAPBOX_TOKEN) return;

    setGeocoding(true);
    setGeoError(null);
    setGeoResult(null);

    try {
      const encoded = encodeURIComponent(address.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        setGeoError("No results found for this address. Try a more specific address.");
        setGeocoding(false);
        return;
      }

      const feature = data.features[0];
      const [lon, lat] = feature.center;

      setLat(lat.toString());
      setLon(lon.toString());
      setGeoResult({
        lat,
        lon,
        placeName: feature.place_name,
      });
    } catch {
      setGeoError("Failed to geocode address. Check your internet connection.");
    }

    setGeocoding(false);
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from("property_locations").insert([
      {
        property_id: propertyId,
        label: label.trim(),
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        type,
      },
    ]);

    if (error) {
      setSubmitError(error.message);
    } else {
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  function handleReset() {
    setPropertyId(null);
    setLabel("");
    setAddress("");
    setType("building");
    setLat("");
    setLon("");
    setGeoResult(null);
    setGeoError(null);
    setSubmitError(null);
    setSubmitted(false);
  }

  if (!MAPBOX_TOKEN) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Mapbox token not configured. Add VITE_MAPBOX_TOKEN to your .env file.
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    const property = properties.find((p) => p.property_id === propertyId);
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Location Added
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Added "{label}" ({type}) to {property?.name ?? "Unknown"}
            {geoResult?.placeName ? ` at ${geoResult.placeName}` : ` at ${lat}, ${lon}`}.
          </p>
          <button
            onClick={handleReset}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add Another Location
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Location</CardTitle>
      </CardHeader>
      <CardContent>
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
              Label
            </label>
            <input
              type="text"
              placeholder="e.g. Building A, Leasing Office"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "building" | "poi")}
              className={inputClass}
            >
              <option value="building">Building</option>
              <option value="poi">Point of Interest</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 123 Main St, Phoenix, AZ"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setGeoResult(null);
                  setGeoError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canGeocode) handleGeocode();
                }}
                className={inputClass}
              />
              <button
                onClick={handleGeocode}
                disabled={!canGeocode || geocoding}
                style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
                className="h-9 shrink-0 rounded-md border border-border bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {geocoding ? "..." : "Lookup"}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 33.4484"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. -112.0740"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Geocode result info */}
        {geoResult && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-800">
              {geoResult.placeName}
            </p>
          </div>
        )}

        {geoError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {geoError}
          </div>
        )}

        {submitError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Failed to submit: {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Add Location"}
        </button>
      </CardContent>
    </Card>
  );
}
