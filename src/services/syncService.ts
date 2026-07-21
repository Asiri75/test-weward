import { HexId } from '../types';

export interface SyncService {
  push(hexes: HexId[]): Promise<void>;
  pullMerged(): Promise<HexId[]>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock backend. The "server" set is seeded with another device's exploration,
 * so pullMerged proves the cross-device union. Swap this implementation for a
 * real backend later without touching any consumer (dependency inversion).
 * Only H3 ids cross this boundary: no coordinates, no timestamps.
 */
export function createMockSyncService(seedDeviceB: HexId[] = []): SyncService {
  const server = new Set<HexId>(seedDeviceB);
  return {
    async push(hexes) {
      await delay(200);
      hexes.forEach((h) => server.add(h));
    },
    async pullMerged() {
      await delay(200);
      return [...server];
    },
  };
}
