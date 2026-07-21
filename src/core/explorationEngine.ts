import { latLngToCell, gridDisk } from 'h3-js';
import { LocationFix, HexId } from '../types';

/** Maps a fix to the current hex plus its ring (a small revealed patch). */
export function fixToHexes(fix: LocationFix, resolution: number, ringK: number): HexId[] {
  const center = latLngToCell(fix.lat, fix.lng, resolution);
  return gridDisk(center, ringK);
}

/** Returns only the hexes not already known (the fresh reveals). */
export function diffNewHexes(known: Set<HexId>, candidate: HexId[]): HexId[] {
  return candidate.filter((h) => !known.has(h));
}
