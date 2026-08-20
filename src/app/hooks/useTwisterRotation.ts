import { useCallback, useEffect, useRef, useState } from 'react';
import { oppositeDirection, type RotationDirection } from '../../lib/game';
import { randomUnit } from '../../lib/random';
import { ROTATION_ANIM_MS, ROTATION_SWAP_MS, TORNADO_BIAS } from '../constants';

export type RotationFx = { direction: RotationDirection; runId: number } | null;

type Options = {
  /** Twister mode active on a live board. */
  enabled: boolean;
  /** Suspend the idle-timeout rotation (menu/win/solved). */
  paused: boolean;
  /**
   * Hold back the every-5-marks rotation while a paint stroke is in progress,
   * so the board never spins out from under the finger drawing on it. Releasing
   * the flag rotates immediately if the stroke got there.
   */
  suspended?: boolean;
  lastAddTimestamp: number;
  marksSinceRotation: number;
  /** Applies a 90deg rotation to the board once the swap delay elapses. */
  onRotate: (direction: RotationDirection) => void;
};

export type TwisterRotation = {
  rotationFx: RotationFx;
  /** Schedule a rotation now (no-op while one is animating). */
  trigger: () => void;
  /** Cancel any pending rotation and re-roll the favored direction. */
  reset: () => void;
};

export function useTwisterRotation({
  enabled,
  paused,
  suspended = false,
  lastAddTimestamp,
  marksSinceRotation,
  onRotate,
}: Options): TwisterRotation {
  const [rotationFx, setRotationFx] = useState<RotationFx>(null);
  const [favored, setFavored] = useState<RotationDirection>('right');
  const runRef = useRef(0);
  const swapRef = useRef<number | null>(null);
  const endRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (swapRef.current !== null) window.clearTimeout(swapRef.current);
    if (endRef.current !== null) window.clearTimeout(endRef.current);
  }, []);

  const trigger = useCallback(() => {
    if (!enabled || rotationFx) return;
    const direction = randomUnit() < TORNADO_BIAS ? favored : oppositeDirection(favored);
    const runId = ++runRef.current;
    clearTimers();
    setRotationFx({ direction, runId });
    swapRef.current = window.setTimeout(() => onRotate(direction), ROTATION_SWAP_MS);
    endRef.current = window.setTimeout(() => {
      setRotationFx((current) => (current?.runId === runId ? null : current));
    }, ROTATION_ANIM_MS);
  }, [enabled, rotationFx, favored, clearTimers, onRotate]);

  const reset = useCallback(() => {
    clearTimers();
    setRotationFx(null);
    setFavored(randomUnit() < 0.5 ? 'right' : 'left');
  }, [clearTimers]);

  // Rotate after 30s without any action.
  useEffect(() => {
    if (!enabled || paused) return;
    const timer = window.setInterval(() => {
      if (Date.now() - lastAddTimestamp >= 30000) trigger();
    }, 500);
    return () => window.clearInterval(timer);
  }, [enabled, paused, lastAddTimestamp, trigger]);

  // Rotate after 5 marks — deferred to the end of a paint stroke.
  useEffect(() => {
    if (enabled && !suspended && marksSinceRotation >= 5) trigger();
  }, [enabled, suspended, marksSinceRotation, trigger]);

  useEffect(() => clearTimers, [clearTimers]);

  return { rotationFx, trigger, reset };
}
