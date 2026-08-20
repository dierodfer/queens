import { describe, expect, it } from 'vitest';
import { BLIND_REPLAY_MS, BLIND_REPLAY_PENALTY_MS, getBlindPreviewMs } from './blind';

describe('getBlindPreviewMs', () => {
  it('uses the base time for the smallest board', () => {
    expect(getBlindPreviewMs('easy', 4)).toBe(20000);
    expect(getBlindPreviewMs('hard', 4)).toBe(5000);
  });

  it('adds a step per cell above size 4', () => {
    // easy: (20 + (8-4)*10) * 1000
    expect(getBlindPreviewMs('easy', 8)).toBe(60000);
    // medium: (15 + (6-4)*7) * 1000
    expect(getBlindPreviewMs('medium', 6)).toBe(29000);
  });

  it('never goes below the base for tiny boards', () => {
    expect(getBlindPreviewMs('medium', 2)).toBe(15000);
  });
});

describe('replay constants', () => {
  it('reveals for 5 seconds regardless of level', () => {
    expect(BLIND_REPLAY_MS).toBe(5000);
  });

  it('charges 20 seconds for a replay', () => {
    expect(BLIND_REPLAY_PENALTY_MS).toBe(20000);
  });
});
