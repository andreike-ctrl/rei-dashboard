const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterDetailed = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

/** Format as $1,234,567 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return currencyFormatter.format(value);
}

/** Format as $1,234,567.89 */
export function formatCurrencyDetailed(
  value: number | null | undefined
): string {
  if (value == null) return "—";
  return currencyFormatterDetailed.format(value);
}

/** Format a decimal (e.g. 0.085) as 8.5% */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return percentFormatter.format(value);
}

/** Format a number that is already a percentage (e.g. 8.5 -> 8.5%) */
export function formatPercentRaw(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

/** Format as 1,234 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return numberFormatter.format(value);
}

/** Format a date string as "Jan 2024" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Format a date string as "Q1 2024" */
export function formatQuarter(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${quarter} ${date.getFullYear()}`;
}

/** Format a multiple like 1.85x */
export function formatMultiple(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}x`;
}
