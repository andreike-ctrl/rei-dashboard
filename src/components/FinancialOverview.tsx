import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  formatCurrency,
  formatPercent,
  formatMultiple,
} from "@/lib/format";
import { xirr } from "@/lib/xirr";
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

  // Current NAV = latest valuation (valuations are ordered ascending by date)
  const latestValuation = valuations.length > 0 ? valuations[valuations.length - 1] : null;
  const currentNav = latestValuation?.nav ?? null;

  // Actual capital called = sum of all funding-type outflows (already negative in DB)
  // Use this as the denominator so that Purchase outflows are counted alongside their
  // matching Sale inflows in the numerator — consistent with standard PE MOIC convention.
  const actualCapitalCalled = -transactions
    .filter((t) => FUNDING_TYPES.has(t.type))
    .reduce((sum, t) => sum + t.cash_amount, 0);

  const denominator = actualCapitalCalled > 0 ? actualCapitalCalled : property.vo2_raise;

  // Current multiple = (current NAV + distributions + other proceeds) / actual capital called
  const currentMultiple =
    currentNav != null && denominator > 0
      ? (currentNav + distributionsPaid + otherProceeds) / denominator
      : null;

  // --- Actual IRR via XIRR ---
  // Cash flows from VO2 LP perspective:
  //   Funding types: already negative in DB (money out) → pass through as-is
  //   Distributions / other proceeds: positive (money in) → pass through as-is
  //   Terminal value: latest NAV as a positive inflow at the latest valuation date
  const actualIrr = (() => {
    if (transactions.length === 0 || currentNav == null || latestValuation == null) return null;

    const flows = transactions
      .filter((t) => t.cash_amount !== 0)
      .map((t) => ({
        amount: t.cash_amount,
        date: new Date(t.date + "T00:00:00"),
      }));

    if (flows.length === 0) return null;

    // Add terminal NAV as a positive inflow at the latest valuation date
    flows.push({
      amount: currentNav,
      date: new Date(latestValuation.date + "T00:00:00"),
    });

    // Sort chronologically (required by xirr)
    flows.sort((a, b) => a.date.getTime() - b.date.getTime());

    return xirr(flows);
  })();

  const pricePerUnit =
    property.purchase_price && property.units
      ? property.purchase_price / property.units
      : null;
  const pricePerBed =
    property.purchase_price && property.beds
      ? property.purchase_price / Number(property.beds)
      : null;
  const pricePerBuilding =
    property.purchase_price && property.buildings
      ? property.purchase_price / property.buildings
      : null;

  const items: { label: string; value: string; highlight?: boolean }[] = [
    { label: "VO2 Raise", value: formatCurrency(property.vo2_raise) },
    { label: "Total Equity", value: formatCurrency(property.total_equity) },
    { label: "Total Debt", value: formatCurrency(property.total_debt) },
    { label: "Purchase Price", value: formatCurrency(property.purchase_price) },
    ...(pricePerBuilding != null ? [{ label: "Price / Building", value: formatCurrency(pricePerBuilding) }] : []),
    ...(pricePerUnit != null ? [{ label: "Price / Unit", value: formatCurrency(pricePerUnit) }] : []),
    ...(pricePerBed != null ? [{ label: "Price / Bed", value: formatCurrency(pricePerBed) }] : []),
    { label: "Capital Called", value: formatCurrency(actualCapitalCalled > 0 ? actualCapitalCalled : property.vo2_raise) },
    { label: "Current NAV", value: formatCurrency(currentNav) },
    { label: "Distributions Paid", value: formatCurrency(distributionsPaid) },
    { label: "Other Proceeds", value: formatCurrency(otherProceeds) },
    { label: "Current Multiple", value: formatMultiple(currentMultiple), highlight: true },
    { label: "Actual IRR", value: actualIrr != null ? formatPercent(actualIrr) : "—", highlight: true },
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
              <p className={`mt-1 text-lg font-semibold ${item.highlight ? "text-primary" : "text-foreground"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
