import * as Location from 'expo-location';
import { LocationFix } from '../types';
import { CONFIG } from '../config';
import { haversineMeters } from '../core/walkDetector';

export interface LocationSource {
  /** Starts emitting fixes; returns a stop function. */
  start(onFix: (f: LocationFix) => void): Promise<() => void>;
}

/** Real device location (foreground). Background is handled by backgroundTask. */
export const DeviceLocationSource: LocationSource = {
  async start(onFix) {
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: CONFIG.bgDistanceIntervalM },
      (p) =>
        onFix({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy ?? 999,
          speed: p.coords.speed,
          ts: p.timestamp,
        })
    );
    return () => sub.remove();
  },
};

/**
 * Replays a fixed route for a reproducible demo. The fixes are DELIVERED fast
 * (every intervalMs) but each fix's timestamp advances by the real time the
 * segment would take at the point's intended speed. So the WalkDetector sees a
 * genuine walking (or driving) speed, not a fake teleport from the fast delivery.
 * Timestamps are monotonic across runs (based on Date.now()), so re-running works.
 */
export function createSimulatedSource(route: LocationFix[], intervalMs = 500): LocationSource {
  return {
    async start(onFix) {
      let i = 0;
      let simTs = Date.now();
      let prev: LocationFix | null = null;
      const id = setInterval(() => {
        if (i >= route.length) {
          clearInterval(id);
          return;
        }
        const pt = route[i];
        if (prev) {
          const dist = haversineMeters(prev, pt);
          const speed = pt.speed && pt.speed > 0 ? pt.speed : 1.3;
          simTs += (dist / speed) * 1000; // advance clock by this segment's real duration
        }
        onFix({ ...pt, ts: simTs });
        prev = pt;
        i++;
      }, intervalMs);
      return () => clearInterval(id);
    },
  };
}
