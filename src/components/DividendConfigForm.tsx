import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Property } from "@/types/database";

interface DividendConfigFormProps {
  properties: Property[];
  selectedPropertyId: number | null;
  onPropertyChange: (id: number | null) => void;
  totalAmount: string;
  onTotalAmountChange: (val: string) => void;
  dividendDate: string;
  onDateChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  onCalculate: () => void;
  isValid: boolean;
}

const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

export function DividendConfigForm({
  properties,
  selectedPropertyId,
  onPropertyChange,
  totalAmount,
  onTotalAmountChange,
  dividendDate,
  onDateChange,
  notes,
  onNotesChange,
  onCalculate,
  isValid,
}: DividendConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Property
            </label>
            <select
              value={selectedPropertyId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onPropertyChange(val ? parseInt(val, 10) : null);
              }}
              className={inputClass}
            >
              <option value="">Select a property…</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Total Distribution Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => onTotalAmountChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Distribution Date
            </label>
            <input
              type="date"
              value={dividendDate}
              onChange={(e) => onDateChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Notes
              <span className="ml-1 font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 2024 distribution"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          onClick={onCalculate}
          disabled={!isValid}
          style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
          className="mt-6 h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Calculate Distribution
        </button>
      </CardContent>
    </Card>
  );
}
