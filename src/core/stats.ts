import { HexId } from '../types';

/** Percentage of a neighborhood's hexes that have been explored. */
export function neighborhoodCoveragePct(explored: HexId[], neighborhood: HexId[]): number {
  if (neighborhood.length === 0) return 0;
  const set = new Set(explored);
  const inside = neighborhood.filter((h) => set.has(h)).length;
  return Math.round((inside / neighborhood.length) * 100);
}
