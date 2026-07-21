export const CONFIG = {
  h3Resolution: 10, // ~65m hexes
  revealRingK: 1, // reveal current hex + 1 ring
  maxWalkSpeedMps: 2.5, // > ~9 km/h = not walking
  maxAccuracyM: 30, // ignore imprecise fixes
  teleportSpeedMps: 12, // implausible jump = spoof/noise
  bgDistanceIntervalM: 20, // background location cadence
} as const;
