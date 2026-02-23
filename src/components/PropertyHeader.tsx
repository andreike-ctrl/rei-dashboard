import { ArrowLeft, ExternalLink, MapPin, Building, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatNumber } from "@/lib/format";
import type { Property } from "@/types/database";

interface PropertyHeaderProps {
  property: Property;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Properties
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {property.name}
            </h1>
            {property.exit_date && (
              <Badge variant="warning">Exited {formatDate(property.exit_date)}</Badge>
            )}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {property.entity} &middot; GP: {property.gp}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{property.asset_class}</Badge>
            <Badge variant="outline">{property.strategy}</Badge>
            <Badge variant="outline">Class {property.property_class}</Badge>
          </div>
        </div>

        {property.website && (
          <a
            href={property.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            Website
          </a>
        )}
      </div>

      {/* Property details grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailItem
          icon={<MapPin className="h-4 w-4" />}
          label="Location"
          value={`${property.msa}, ${property.state}`}
        />
        <DetailItem
          icon={<Calendar className="h-4 w-4" />}
          label="Investment Date"
          value={formatDate(property.investment_date)}
        />
        {property.units && (
          <DetailItem
            icon={<Building className="h-4 w-4" />}
            label="Units"
            value={formatNumber(property.units)}
          />
        )}
        {property.buildings && (
          <DetailItem
            icon={<Building className="h-4 w-4" />}
            label="Buildings"
            value={formatNumber(property.buildings)}
          />
        )}
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
