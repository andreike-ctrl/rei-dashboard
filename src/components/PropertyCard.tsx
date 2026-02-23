import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PropertyWithNav } from "@/types/database";

const assetClassColors: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  Multifamily: "default",
  Office: "secondary",
  Industrial: "outline",
  Hospitality: "warning",
  Student: "success",
  "Self-Storage": "outline",
};

interface PropertyCardProps {
  property: PropertyWithNav;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const badgeVariant = assetClassColors[property.asset_class] ?? "secondary";

  return (
    <Link to={`/property/${property.property_id}`} className="group block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {property.name}
                </h3>
                {property.exit_date && (
                  <Badge variant="warning" className="shrink-0">Exited</Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {property.msa}, {property.state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(property.investment_date)}
                </span>
                <span className="text-muted-foreground">
                  GP: {property.gp}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariant}>{property.asset_class}</Badge>
                <Badge variant="outline">{property.strategy}</Badge>
                <Badge variant="outline">Class {property.property_class}</Badge>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Current NAV
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(property.latest_nav)}
              </span>
              <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
