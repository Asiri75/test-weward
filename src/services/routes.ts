import { LocationFix } from '../types';

// A short walking loop (~1.3 m/s) and a fast driving line (~14 m/s) for the demo.
export const WALK_ROUTE: LocationFix[] = Array.from({ length: 40 }, (_, i) => ({
  lat: 48.8566 + i * 0.00012,
  lng: 2.3522 + i * 0.00008,
  accuracy: 8,
  speed: 1.3,
  ts: i * 1000,
}));

export const DRIVE_ROUTE: LocationFix[] = Array.from({ length: 40 }, (_, i) => ({
  lat: 48.8566 + i * 0.0013,
  lng: 2.3522 + i * 0.0009,
  accuracy: 8,
  speed: 14,
  ts: i * 1000,
}));
