export type HexId = string;

export interface LocationFix {
  lat: number;
  lng: number;
  accuracy: number; // meters
  speed: number | null; // m/s, -1/null if unknown
  ts: number; // epoch ms
}
