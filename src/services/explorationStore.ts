import { HexId } from '../types';

const KEY = 'explored_hexes_v1';

/** Minimal key-value contract (satisfied by MMKV and by an in-memory object). */
export interface KV {
  getString(k: string): string | undefined;
  set(k: string, v: string): void;
}

/**
 * Persists the explored hex set. Storage is injected so the engine stays
 * decoupled from MMKV (and trivially testable with an in-memory object).
 */
export function createExplorationStore(storage: KV) {
  const load = (): Set<HexId> => {
    const raw = storage.getString(KEY);
    return new Set<HexId>(raw ? (JSON.parse(raw) as HexId[]) : []);
  };
  let set = load();
  return {
    load: () => (set = load()),
    add(hexes: HexId[]) {
      hexes.forEach((h) => set.add(h));
      storage.set(KEY, JSON.stringify([...set]));
    },
    getAll: (): HexId[] => [...set],
  };
}
