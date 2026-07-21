import * as Location from 'expo-location';
import { LocationFix } from '../types';
import { CONFIG } from '../config';

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

/** Replays a fixed route. Used for a reproducible demo video. */
export function createSimulatedSource(route: LocationFix[], intervalMs = 700): LocationSource {
  return {
    async start(onFix) {
      let i = 0;
      const id = setInterval(() => {
        if (i >= route.length) {
          clearInterval(id);
          return;
        }
        onFix({ ...route[i], ts: Date.now() });
        i++;
      }, intervalMs);
      return () => clearInterval(id);
    },
  };
}
