import { ArrowLeft, MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import type { Client } from "@/types/database";

interface ClientHeaderProps {
  client: Client;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <div>
      <Link
        to="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Link>

      <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{client.domicile}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailItem
          icon={<MapPin className="h-4 w-4" />}
          label="Address"
          value={client.address}
        />
        <DetailItem
          icon={<MapPin className="h-4 w-4" />}
          label="Domicile"
          value={client.domicile}
        />
        <DetailItem
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={client.email}
        />
        <DetailItem
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={client.phone}
        />
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
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}
