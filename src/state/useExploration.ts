import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { latLngToCell, gridDisk } from 'h3-js';
import { HexId, LocationFix } from '../types';
import { CONFIG } from '../config';
import { createWalkDetector } from '../core/walkDetector';
import { fixToHexes, diffNewHexes } from '../core/explorationEngine';
import { createExplorationStore } from '../services/explorationStore';
import { createMockSyncService } from '../services/syncService';

const storage = createMMKV();
const store = createExplorationStore(storage);
const detector = createWalkDetector(CONFIG);

// Device B's exploration (a patch a few blocks away) so syncNow reveals it in the demo.
const deviceBSeed: HexId[] = gridDisk(latLngToCell(48.86, 2.349, CONFIG.h3Resolution), 2);
const sync = createMockSyncService(deviceBSeed);

interface ExplorationState {
  exploredHexes: HexId[];
  hydrate: () => void;
  ingestFix: (fix: LocationFix) => void;
  syncNow: () => Promise<void>;
  reset: () => void;
}

export const useExploration = create<ExplorationState>((set, get) => ({
  exploredHexes: [],
  hydrate: () => {
    store.load();
    set({ exploredHexes: store.getAll() });
  },
  ingestFix: (fix) => {
    if (!detector.accept(fix)) return;
    const known = new Set(get().exploredHexes);
    const fresh = diffNewHexes(known, fixToHexes(fix, CONFIG.h3Resolution, CONFIG.revealRingK));
    if (fresh.length === 0) return;
    store.add(fresh);
    set({ exploredHexes: store.getAll() });
    void sync.push(fresh); // fire-and-forget, offline-safe in the mock
  },
  syncNow: async () => {
    const merged = await sync.pullMerged();
    store.add(merged);
    set({ exploredHexes: store.getAll() });
  },
  reset: () => {
    store.clear();
    set({ exploredHexes: [] });
  },
}));
