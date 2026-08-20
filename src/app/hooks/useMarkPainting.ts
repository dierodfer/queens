import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/** Attribute a cell carries so a drag can resolve which cell it is over. */
export const CELL_INDEX_ATTR = 'data-cell-index';

type Options = {
  /** Painting is allowed (live board, no blind preview running). */
  enabled: boolean;
  /**
   * Whether the cell the gesture started on already carries a mark. Decides the
   * whole stroke's intent: starting on a marked cell erases, otherwise marks.
   */
  isMarked: (index: number) => boolean;
  /** Applies the stroke's intent to one cell. Called once per cell per stroke. */
  onPaint: (index: number, mark: boolean) => void;
  /** Fires when a stroke begins and ends, so callers can gate side effects. */
  onPaintStart: () => void;
  onPaintEnd: () => void;
};

export type MarkPainting = {
  /** A stroke is in progress. */
  painting: boolean;
  /** Spread onto the board container. */
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
  };
  /**
   * True while the click that closes a paint stroke is still pending, so the
   * board can swallow it instead of placing a queen. Reset on the next press.
   */
  shouldSwallowClick: () => boolean;
};

/** Resolves the cell index under a viewport point, or null if there is none. */
function cellIndexAt(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  const cell = el?.closest(`[${CELL_INDEX_ATTR}]`);
  const raw = cell?.getAttribute(CELL_INDEX_ATTR);
  if (raw == null) return null;
  const index = Number(raw);
  return Number.isInteger(index) ? index : null;
}

/**
 * Turns a press-and-drag across the board into a stroke of X marks.
 *
 * A press that never leaves its starting cell stays a plain click (placing a
 * queen); as soon as the pointer enters a second cell the gesture becomes a
 * paint stroke, applying one intent — mark or erase, decided by the cell it
 * started on — to every cell it touches, including the starting one.
 */
export function useMarkPainting({
  enabled,
  isMarked,
  onPaint,
  onPaintStart,
  onPaintEnd,
}: Options): MarkPainting {
  const [painting, setPainting] = useState(false);
  const pointerRef = useRef<number | null>(null);
  const originRef = useRef<number | null>(null);
  const markingRef = useRef(false);
  const paintedRef = useRef(false);
  const swallowClickRef = useRef(false);
  // Cells already painted by this stroke: a pointer emits many moves per cell,
  // and re-painting one would double-count it towards the rotation trigger.
  const visitedRef = useRef<Set<number>>(new Set());

  const finish = useCallback(() => {
    const wasPainting = paintedRef.current;
    pointerRef.current = null;
    originRef.current = null;
    paintedRef.current = false;
    visitedRef.current.clear();
    if (!wasPainting) return;
    swallowClickRef.current = true;
    setPainting(false);
    onPaintEnd();
  }, [onPaintEnd]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      swallowClickRef.current = false;
      // Only the primary button paints; right-click stays a single-cell toggle.
      if (!enabled || e.button !== 0) return;
      const index = cellIndexAt(e.clientX, e.clientY);
      if (index == null) return;
      pointerRef.current = e.pointerId;
      originRef.current = index;
      paintedRef.current = false;
      visitedRef.current.clear();
      // Deliberately no `setPointerCapture` yet: capturing here would retarget
      // the compatibility click to the board, and a press that never becomes a
      // drag has to reach the cell as an ordinary click so it places a queen.
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const origin = originRef.current;
      if (origin == null || pointerRef.current !== e.pointerId) return;
      const index = cellIndexAt(e.clientX, e.clientY);
      if (index == null) return;

      if (!paintedRef.current) {
        // Still on the starting cell: this is not (yet) a drag.
        if (index === origin) return;
        markingRef.current = !isMarked(origin);
        paintedRef.current = true;
        // Now that this is unambiguously a stroke, capture the pointer so it
        // keeps reporting even if the finger leaves the board.
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setPainting(true);
        onPaintStart();
        visitedRef.current.add(origin);
        onPaint(origin, markingRef.current);
      }
      if (visitedRef.current.has(index)) return;
      visitedRef.current.add(index);
      onPaint(index, markingRef.current);
    },
    [isMarked, onPaint, onPaintStart],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (pointerRef.current !== e.pointerId) return;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
      finish();
    },
    [finish],
  );

  // A stroke interrupted by the browser (scroll takeover, window blur) still
  // has to release the rotation gate it opened.
  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (pointerRef.current !== e.pointerId) return;
      finish();
    },
    [finish],
  );

  useEffect(() => {
    if (enabled) return;
    finish();
  }, [enabled, finish]);

  const shouldSwallowClick = useCallback(() => {
    if (!swallowClickRef.current) return false;
    swallowClickRef.current = false;
    return true;
  }, []);

  return {
    painting,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    shouldSwallowClick,
  };
}
