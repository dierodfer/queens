import type { BlindLevel } from '../i18n';

export type BlindConfig = { baseSeconds: number; stepSeconds: number };

export const BLIND_META: Record<BlindLevel, BlindConfig> = {
  easy: { baseSeconds: 20, stepSeconds: 10 },
  medium: { baseSeconds: 15, stepSeconds: 7 },
  hard: { baseSeconds: 5, stepSeconds: 5 },
};

/** Duration (ms) of an on-demand "show again" replay. Same for every level. */
export const BLIND_REPLAY_MS = 5000;

/** Time (ms) added to the stopwatch as the cost of a "show again" replay. */
export const BLIND_REPLAY_PENALTY_MS = 20000;

/** Preview duration (ms) before a blind run starts, scaled by board size. */
export function getBlindPreviewMs(level: BlindLevel, boardSize: number): number {
  const cfg = BLIND_META[level];
  const stepCount = Math.max(0, boardSize - 4);
  return (cfg.baseSeconds + stepCount * cfg.stepSeconds) * 1000;
}
