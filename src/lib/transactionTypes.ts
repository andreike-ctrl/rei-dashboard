/** Transaction types that count as a distribution to investors (regular dividends + refi proceeds). */
export const DISTRIBUTION_TYPES = new Set(["Distribution", "Refi"]);

export function isDistribution(type: string): boolean {
  return DISTRIBUTION_TYPES.has(type);
}
