import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { PropertyLocation } from "@/types/database";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface PropertyMapProps {
  locations: PropertyLocation[];
}

export function PropertyMap({ locations }: PropertyMapProps) {
  if (!MAPBOX_TOKEN || locations.length === 0) return null;

  const { center, zoom, buildings, pois } = useMemo(() => {
    // Separate buildings from POIs
    const bldgs = locations.filter((l) => l.type === "building");
    const poiList = locations.filter((l) => l.type === "poi");

    // Center on buildings only (POIs are context, not the focus)
    const centerLocs = bldgs.length > 0 ? bldgs : locations;

    if (centerLocs.length === 1 && poiList.length === 0) {
      return {
        center: { lat: centerLocs[0].lat, lon: centerLocs[0].lon },
        zoom: 14,
        buildings: bldgs,
        pois: poiList,
      };
    }

    // Include all locations for bounds calculation
    let minLat = Infinity,
      maxLat = -Infinity,
      minLon = Infinity,
      maxLon = -Infinity;

    for (const loc of locations) {
      if (loc.lat < minLat) minLat = loc.lat;
      if (loc.lat > maxLat) maxLat = loc.lat;
      if (loc.lon < minLon) minLon = loc.lon;
      if (loc.lon > maxLon) maxLon = loc.lon;
    }

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const latSpan = maxLat - minLat;
    const lonSpan = maxLon - minLon;
    const span = Math.max(latSpan, lonSpan);

    let z = 14;
    if (span > 0.5) z = 9;
    else if (span > 0.1) z = 11;
    else if (span > 0.01) z = 13;

    return { center: { lat: centerLat, lon: centerLon }, zoom: z, buildings: bldgs, pois: poiList };
  }, [locations]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full overflow-hidden rounded-md">
          <Map
            initialViewState={{
              latitude: center.lat,
              longitude: center.lon,
              zoom,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />
            {/* POIs rendered first so buildings appear on top */}
            {pois.map((loc) => (
              <Marker
                key={loc.location_id}
                latitude={loc.lat}
                longitude={loc.lon}
                anchor="bottom"
              >
                <div className="group relative flex flex-col items-center">
                  <MapPin className="h-5 w-5 text-gray-500 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} />
                  {loc.label && (
                    <span className="absolute -top-6 whitespace-nowrap rounded bg-background px-2 py-0.5 text-xs font-medium text-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      {loc.label}
                    </span>
                  )}
                </div>
              </Marker>
            ))}
            {buildings.map((loc) => (
              <Marker
                key={loc.location_id}
                latitude={loc.lat}
                longitude={loc.lon}
                anchor="bottom"
              >
                <div className="group relative flex flex-col items-center">
                  <MapPin className="h-8 w-8 text-primary drop-shadow-md" fill="currentColor" strokeWidth={1.5} />
                  {loc.label && (
                    <span className="absolute -top-6 whitespace-nowrap rounded bg-background px-2 py-0.5 text-xs font-medium text-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      {loc.label}
                    </span>
                  )}
                </div>
              </Marker>
            ))}
          </Map>
        </div>
        {(buildings.length > 1 || pois.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {buildings.map((loc) => (
              <span key={loc.location_id}>
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-primary" />
                {loc.label ?? "Building"}
              </span>
            ))}
            {pois.map((loc) => (
              <span key={loc.location_id}>
                <MapPin className="mr-1 inline h-3.5 w-3.5 text-gray-500" />
                {loc.label ?? "POI"}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
