import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
} from "@/lib/format";
import type { Property, Transaction, Valuation } from "@/types/database";

interface FinancialOverviewProps {
  property: Property;
  transactions: Transaction[];
  valuations: Valuation[];
}

const FUNDING_TYPES = new Set(["Capital Call", "Funding", "Purchase"]);

export function FinancialOverview({
  property,
  transactions,
  valuations,
}: FinancialOverviewProps) {
  // Sum distributions paid to date
  const distributionsPaid = transactions
    .filter((t) => t.type === "Distribution")
    .reduce((sum, t) => sum + t.cash_amount, 0);

  // Other proceeds (everything that's not funding and not distribution)
  const otherProceeds = transactions
    .filter((t) => !FUNDING_TYPES.has(t.type) && t.type !== "Distribution")
    .reduce((sum, t) => sum + t.cash_amount, 0);

  // Current NAV = latest valuation
  const currentNav =
    valuations.length > 0 ? valuations[valuations.length - 1].nav : null;

  // Current multiple = (current NAV + distributions + other proceeds) / VO2 raise
  const currentMultiple =
    currentNav != null && property.vo2_raise > 0
      ? (currentNav + distributionsPaid + otherProceeds) / property.vo2_raise
      : null;

  const items: { label: string; value: string }[] = [
    { label: "VO2 Raise", value: formatCurrency(property.vo2_raise) },
    { label: "Total Equity", value: formatCurrency(property.total_equity) },
    { label: "Total Debt", value: formatCurrency(property.total_debt) },
    { label: "Purchase Price", value: formatCurrency(property.purchase_price) },
    { label: "Current NAV", value: formatCurrency(currentNav) },
    { label: "Distributions Paid", value: formatCurrency(distributionsPaid) },
    { label: "Other Proceeds", value: formatCurrency(otherProceeds) },
    { label: "Current Multiple", value: formatMultiple(currentMultiple) },
    { label: "Projected LP IRR", value: formatPercent(property.projected_lp_irr) },
    { label: "Projected IRR", value: formatPercent(property.projected_irr) },
    { label: "Projected Multiple", value: formatMultiple(property.projected_multiple) },
    { label: "Senior Loan Rate", value: formatPercent(property.senior_loan_rate) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
