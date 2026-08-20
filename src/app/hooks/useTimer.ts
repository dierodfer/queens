import { useCallback, useEffect, useRef, useState } from 'react';

export type Timer = {
  elapsed: number;
  setElapsed: (ms: number) => void;
  /** Starts (or restarts) the stopwatch, optionally resuming from `resumeMs` instead of zero. */
  start: (resumeMs?: number) => void;
  stop: () => void;
  /** Adds `ms` to the running time, as a penalty for an in-game assist. */
  penalize: (ms: number) => void;
  /** Milliseconds elapsed since the last `start()`, computed on demand. */
  since: () => number;
};

/** A simple stopwatch that ticks every 250ms while running. */
export function useTimer(initialMs = 0): Timer {
  const [elapsed, setElapsed] = useState(initialMs);
  const startedAt = useRef(0);
  const timerRef = useRef<number | null>(null);

  const start = useCallback((resumeMs = 0) => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    startedAt.current = Date.now() - resumeMs;
    setElapsed(resumeMs);
    timerRef.current = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
  }, []);

  // Charging time is the same as having started earlier, so the penalty flows
  // into `since()` (and therefore the ranking and the autosaved session) too.
  const penalize = useCallback((ms: number) => {
    startedAt.current -= ms;
    setElapsed(Date.now() - startedAt.current);
  }, []);

  const since = useCallback(() => Date.now() - startedAt.current, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  return { elapsed, setElapsed, start, stop, penalize, since };
}
