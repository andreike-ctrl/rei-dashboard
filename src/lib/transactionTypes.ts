/** Transaction types that count as a distribution to investors (regular dividends + refi + return of capital). */
export const DISTRIBUTION_TYPES = new Set(["Distribution", "Refi", "Return of Capital"]);

export function isDistribution(type: string): boolean {
  return DISTRIBUTION_TYPES.has(type);
}
