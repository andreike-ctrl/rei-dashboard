import { useState, useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrencyDetailed, formatNumber } from "@/lib/format";

export interface DividendRow {
  investorId: number;
  investorName: string;
  clientName: string;
  units: number;
  ownership: number;
  cashAmount: number;
  isEdited: boolean;
}

interface DividendReviewTableProps {
  rows: DividendRow[];
  onUpdateRow: (investorId: number, newCashAmount: number) => void;
  totalAmount: number;
  dividendDate: string;
  propertyName: string;
  notes: string;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function EditableCell({
  value,
  isEdited,
  onCommit,
}: {
  value: number;
  isEdited: boolean;
  onCommit: (val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setEditValue(value.toFixed(2));
    setEditing(true);
  }

  function commit() {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed)) {
      onCommit(Math.round(parsed * 100) / 100);
    }
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className="h-7 w-28 rounded border border-ring bg-background px-2 text-right text-sm tabular-nums text-foreground focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className={`cursor-pointer rounded px-1.5 py-0.5 tabular-nums hover:bg-muted/50 transition-colors ${
        isEdited ? "text-primary font-semibold" : ""
      }`}
    >
      {formatCurrencyDetailed(value)}
    </span>
  );
}

export function DividendReviewTable({
  rows,
  onUpdateRow,
  totalAmount,
  dividendDate,
  propertyName,
  notes,
  onBack,
  onSubmit,
  submitting,
}: DividendReviewTableProps) {
  const totalAllocated = rows.reduce((s, r) => s + r.cashAmount, 0);
  const variance = Math.round((totalAllocated - totalAmount) * 100) / 100;
  const hasVariance = Math.abs(variance) > 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Review Distribution
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({rows.length} investor{rows.length !== 1 ? "s" : ""})
          </span>
        </CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {propertyName} — {dividendDate}
          {notes && ` — ${notes}`}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Click any amount to edit it before submitting.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Investor
                </th>
                <th className="pb-3 pr-4 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Units
                </th>
                <th className="pb-3 pr-4 text-right font-medium text-muted-foreground">
                  Ownership
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Distribution Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.investorId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {row.investorName}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {row.clientName}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {formatNumber(row.units)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-foreground">
                    {(row.ownership * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 text-right">
                    <EditableCell
                      value={row.cashAmount}
                      isEdited={row.isEdited}
                      onCommit={(val) => onUpdateRow(row.investorId, val)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td
                  colSpan={2}
                  className="pt-3 pr-4 font-semibold text-foreground"
                >
                  Total
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {formatNumber(rows.reduce((s, r) => s + r.units, 0))}
                </td>
                <td className="pt-3 pr-4 text-right font-semibold tabular-nums text-foreground">
                  {(rows.reduce((s, r) => s + r.ownership, 0) * 100).toFixed(
                    1
                  )}
                  %
                </td>
                <td className="pt-3 text-right font-semibold tabular-nums text-foreground">
                  {formatCurrencyDetailed(totalAllocated)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {hasVariance && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Allocated total ({formatCurrencyDetailed(totalAllocated)}) differs
              from configured amount ({formatCurrencyDetailed(totalAmount)}) by{" "}
              {formatCurrencyDetailed(Math.abs(variance))}
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onBack}
            disabled={submitting}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="h-10 rounded-md border border-border text-sm font-medium text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
            className="h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit to Database"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
