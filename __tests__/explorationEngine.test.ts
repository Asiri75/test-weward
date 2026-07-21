import { test, expect } from '@jest/globals';
import { fixToHexes, diffNewHexes } from '../src/core/explorationEngine';

const fix = { lat: 48.8566, lng: 2.3522, accuracy: 10, speed: 1, ts: 0 };

test('maps a fix to the current hex plus its ring', () => {
  const hexes = fixToHexes(fix, 10, 1);
  expect(hexes.length).toBe(7); // center + 6 neighbours
  expect(new Set(hexes).size).toBe(7);
});

test('diff returns only unknown hexes', () => {
  const hexes = fixToHexes(fix, 10, 1);
  const known = new Set([hexes[0]]);
  const fresh = diffNewHexes(known, hexes);
  expect(fresh).not.toContain(hexes[0]);
  expect(fresh.length).toBe(6);
});
