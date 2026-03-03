export interface CashFlow {
  amount: number; // negative = outflow, positive = inflow
  date: Date;
}

/**
 * Compute the Internal Rate of Return for an irregular series of cash flows
 * using Newton-Raphson iteration (same as Excel's XIRR).
 *
 * Returns null if:
 *  - fewer than 2 cash flows
 *  - cash flows don't have both signs (no solution exists)
 *  - algorithm fails to converge
 */
export function xirr(cashflows: CashFlow[]): number | null {
  if (cashflows.length < 2) return null;

  const hasPositive = cashflows.some((cf) => cf.amount > 0);
  const hasNegative = cashflows.some((cf) => cf.amount < 0);
  if (!hasPositive || !hasNegative) return null;

  // Days from first cash flow date, expressed in fractional years
  const t0 = cashflows[0].date.getTime();
  const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  const years = cashflows.map((cf) => (cf.date.getTime() - t0) / MS_PER_YEAR);

  // NPV at a given rate
  function npv(rate: number): number {
    return cashflows.reduce(
      (sum, cf, i) => sum + cf.amount / Math.pow(1 + rate, years[i]),
      0
    );
  }

  // dNPV/dRate (derivative for Newton step)
  function dnpv(rate: number): number {
    return cashflows.reduce(
      (sum, cf, i) =>
        sum + (-years[i] * cf.amount) / Math.pow(1 + rate, years[i] + 1),
      0
    );
  }

  // Try multiple starting guesses to improve convergence
  const guesses = [0.1, 0.3, -0.1, 0.5, -0.3];

  for (const guess of guesses) {
    let rate = guess;
    for (let iter = 0; iter < 200; iter++) {
      const v = npv(rate);
      const dv = dnpv(rate);
      if (Math.abs(dv) < 1e-12) break;
      const step = v / dv;
      rate -= step;
      // Clamp to (-100%, +1000%) to avoid divergence
      if (rate <= -1) rate = -0.9999;
      if (rate > 10) rate = 10;
      if (Math.abs(step) < 1e-8) {
        // Verify the result is a real solution (not a spurious root)
        if (Math.abs(npv(rate)) < 1) return rate;
      }
    }
  }

  return null;
}
