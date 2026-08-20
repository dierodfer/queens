import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

export type BlindPreview = {
  active: boolean;
  remainingMs: number;
  begin: (ms: number) => void;
  stop: () => void;
};

/**
 * Drives the "memorize the board" countdown used by blind mode. Previews are
 * purely visual: queens already on the board are never touched, so a replay
 * costs time (see `BLIND_REPLAY_PENALTY_MS`) instead of progress.
 */
export function useBlindPreview(): BlindPreview {
  const [active, setActive] = useState(false);
  const [until, setUntil] = useState<number | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
  }, []);

  const stop = useCallback(() => {
    clear();
    setActive(false);
    setUntil(null);
  }, [clear]);

  const begin = useCallback(
    (ms: number) => {
      clear();
      setActive(true);
      setUntil(Date.now() + ms);
      tickRef.current = window.setInterval(tick, 250);
      timerRef.current = window.setTimeout(stop, ms);
    },
    [clear, stop],
  );

  useEffect(() => clear, [clear]);

  return { active, remainingMs: until ? Math.max(0, until - Date.now()) : 0, begin, stop };
}
