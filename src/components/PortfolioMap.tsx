import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { PropertyLocation } from "@/types/database";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface PortfolioMapProps {
  locations: PropertyLocation[];
}

export function PortfolioMap({ locations }: PortfolioMapProps) {
  const buildings = useMemo(() => locations.filter((l) => l.type === "building"), [locations]);

  const { center, zoom } = useMemo(() => {
    if (buildings.length === 0) return { center: { lat: 39, lon: -98 }, zoom: 3 };

    if (buildings.length === 1) {
      return { center: { lat: buildings[0].lat, lon: buildings[0].lon }, zoom: 10 };
    }

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const loc of buildings) {
      if (loc.lat < minLat) minLat = loc.lat;
      if (loc.lat > maxLat) maxLat = loc.lat;
      if (loc.lon < minLon) minLon = loc.lon;
      if (loc.lon > maxLon) maxLon = loc.lon;
    }

    const span = Math.max(maxLat - minLat, maxLon - minLon);
    let z = 4;
    if (span > 20) z = 3;
    else if (span > 10) z = 4;
    else if (span > 5) z = 5;
    else if (span > 2) z = 6;
    else if (span > 0.5) z = 8;
    else if (span > 0.1) z = 11;
    else z = 13;

    return {
      center: { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 },
      zoom: z,
    };
  }, [buildings]);

  if (!MAPBOX_TOKEN) return null;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Portfolio Map</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 pb-6 px-6">
        <div className="h-full min-h-[240px] w-full overflow-hidden">
          <Map
            initialViewState={{ latitude: center.lat, longitude: center.lon, zoom }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />
            {buildings.map((loc) => (
              <Marker key={loc.location_id} latitude={loc.lat} longitude={loc.lon} anchor="bottom">
                <div className="group relative flex flex-col items-center">
                  <MapPin className="h-6 w-6 text-primary drop-shadow-md" fill="currentColor" strokeWidth={1.5} />
                  {loc.label && (
                    <span className="absolute -top-6 whitespace-nowrap rounded bg-background px-2 py-0.5 text-xs font-medium text-foreground shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {loc.label}
                    </span>
                  )}
                </div>
              </Marker>
            ))}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}
