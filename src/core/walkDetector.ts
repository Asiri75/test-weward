import { LocationFix } from '../types';

export function haversineMeters(a: LocationFix, b: LocationFix): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export interface WalkDetectorConfig {
  maxWalkSpeedMps: number;
  maxAccuracyM: number;
  teleportSpeedMps: number;
}

/**
 * Decides whether a location fix counts as "walking".
 * Multi-signal, cheapest first: accuracy gate, plausibility (anti-teleport),
 * then speed gate. Keeps the last accepted/seen fix to derive speed when the
 * device does not report it.
 */
export function createWalkDetector(cfg: WalkDetectorConfig) {
  let last: LocationFix | null = null;
  return {
    accept(fix: LocationFix): boolean {
      if (fix.accuracy > cfg.maxAccuracyM) return false;

      let derived = fix.speed != null && fix.speed >= 0 ? fix.speed : 0;
      if (last) {
        const dt = (fix.ts - last.ts) / 1000;
        const jump = dt > 0 ? haversineMeters(last, fix) / dt : Infinity;
        if (jump > cfg.teleportSpeedMps) {
          last = fix;
          return false; // implausible jump: spoof or GPS noise
        }
        if (fix.speed == null || fix.speed < 0) derived = jump;
      }

      last = fix;
      if (derived > cfg.maxWalkSpeedMps) return false; // vehicle/bike
      return true;
    },
  };
}
