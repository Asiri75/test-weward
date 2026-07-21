import { test, expect } from '@jest/globals';
import { createWalkDetector } from '../src/core/walkDetector';
import { CONFIG } from '../src/config';

const base = { lat: 48.8566, lng: 2.3522, accuracy: 10, speed: 1.2, ts: 0 };

test('accepts a precise walking fix', () => {
  const d = createWalkDetector(CONFIG);
  expect(d.accept(base)).toBe(true);
});

test('rejects an imprecise fix', () => {
  const d = createWalkDetector(CONFIG);
  expect(d.accept({ ...base, accuracy: 100 })).toBe(false);
});

test('rejects vehicle speed', () => {
  const d = createWalkDetector(CONFIG);
  expect(d.accept({ ...base, speed: 8 })).toBe(false);
});

test('rejects an implausible jump between fixes', () => {
  const d = createWalkDetector(CONFIG);
  d.accept({ ...base, speed: null });
  // ~2km away, 1s later => teleport
  const jumped = { lat: 48.87, lng: 2.37, accuracy: 10, speed: null, ts: 1000 };
  expect(d.accept(jumped)).toBe(false);
});
