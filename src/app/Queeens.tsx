import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18N, type BlindLevel, type GameMode, type Lang } from '../i18n';
import { SKINS, type SkinId } from './skins';
import {
  EMPTY,
  MARK,
  QUEEN,
  getAttacked,
  getAttackedByOneQueen,
  getConflicts,
  paintCell,
  rotateFlat,
  type CellState,
  type RotationDirection,
} from '../lib/game';
import { parseVersionFromYaml, shortHash } from '../lib/format';
import {
  addRankingEntry,
  getRankingEntries,
  loadRankingStore,
  saveRankingStore,
} from '../lib/ranking';
import { BLIND_REPLAY_MS, BLIND_REPLAY_PENALTY_MS, getBlindPreviewMs } from '../lib/blind';
import { pickBoard } from '../lib/boardPicker';
import { clearSession, loadSession, saveSession } from '../lib/session';
import { useTimer } from './hooks/useTimer';
import { useBlindPreview } from './hooks/useBlindPreview';
import { useMarkPainting } from './hooks/useMarkPainting';
import { useTwisterRotation } from './hooks/useTwisterRotation';
import { Board } from './components/Board';
import { ExitConfirm } from './components/ExitConfirm';
import { Menu } from './components/Menu';
import { Ranking } from './components/Ranking';
import { ResumeConfirm } from './components/ResumeConfirm';
import { TopBar } from './components/TopBar';
import { WinPopup } from './components/WinPopup';

export default function Queeens() {
  // Read once, at mount: if a round was in progress when the page was last
  // closed/reloaded, restore it (behind a resume/restart prompt) instead of
  // starting on the menu.
  const [initialSession] = useState(() => loadSession());

  const [skinId, setSkinId] = useState<SkinId>('default');
  const [lang, setLang] = useState<Lang>('en');
  const [size, setSize] = useState<number | null>(initialSession?.size ?? null);
  const [board, setBoard] = useState<number[]>(initialSession?.board ?? []);
  const [cells, setCells] = useState<CellState[]>(initialSession?.cells ?? []);
  const [won, setWon] = useState(false);
  const [showMenu, setShowMenu] = useState(!initialSession);
  const [showWin, setShowWin] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResume, setShowResume] = useState(!!initialSession);
  const [boardKey, setBoardKey] = useState(initialSession?.boardKey ?? '');
  const [boardLabel, setBoardLabel] = useState(initialSession?.boardLabel ?? '');
  const [boardOrdinal, setBoardOrdinal] = useState<{ index: number; total: number } | null>(
    initialSession?.boardOrdinal ?? null,
  );
  const [version, setVersion] = useState('--');
  const [lastPlacedQueen, setLastPlacedQueen] = useState<number | null>(null);
  const [mode, setMode] = useState<GameMode | null>(initialSession?.mode ?? 'classic');
  const [blindLevel, setBlindLevel] = useState<BlindLevel | null>(
    initialSession?.blindLevel ?? null,
  );
  const [marksSinceRotation, setMarksSinceRotation] = useState(0);
  const [lastAddTimestamp, setLastAddTimestamp] = useState<number>(Date.now());

  const [paintingMarks, setPaintingMarks] = useState(false);

  // Paint strokes read cell state outside of render. A stroke touches each cell
  // at most once, so this snapshot only ever has to be fresh as of the last
  // commit before the stroke began.
  const cellsRef = useRef<CellState[]>(cells);
  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  const {
    elapsed,
    setElapsed,
    start: startTimer,
    stop: stopTimer,
    penalize,
    since,
  } = useTimer(initialSession?.elapsedMs ?? 0);

  const blind = useBlindPreview();

  const handleRotate = useCallback(
    (direction: RotationDirection) => {
      if (!size) return;
      setBoard((prev) => rotateFlat(prev, size, direction));
      setCells((prev) => rotateFlat(prev, size, direction));
      setLastPlacedQueen(null);
      setMarksSinceRotation(0);
      setLastAddTimestamp(Date.now());
    },
    [size],
  );
  const rotation = useTwisterRotation({
    enabled: mode === 'twister' && size != null,
    paused: won || showMenu || showWin || showResume,
    suspended: paintingMarks,
    lastAddTimestamp,
    marksSinceRotation,
    onRotate: handleRotate,
  });

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}version.yml`, { cache: 'no-store' })
      .then((r) => r.text())
      .then((text) => setVersion(parseVersionFromYaml(text)))
      .catch(() => {});
  }, []);

  const beginRound = useCallback(
    (n: number) => {
      setCells(new Array(n * n).fill(EMPTY));
      setWon(false);
      setShowWin(false);
      setLastPlacedQueen(null);
      setMarksSinceRotation(0);
      setLastAddTimestamp(Date.now());
      rotation.reset();
      if (mode === 'blind' && blindLevel) blind.begin(getBlindPreviewMs(blindLevel, n));
      startTimer();
    },
    [mode, blindLevel, blind, rotation, startTimer],
  );

  const startGame = useCallback(
    (n: number) => {
      const { board: flat, index, total } = pickBoard(n);
      const sig = flat.join(',');
      setSize(n);
      setBoard(flat);
      setShowMenu(false);
      setShowExitConfirm(false);
      setBoardKey(`${n}|${sig}`);
      setBoardLabel(`${n}x${n} - ${shortHash(sig)}`);
      setBoardOrdinal({ index, total });
      beginRound(n);
    },
    [beginRound],
  );

  const startRound = useCallback(() => {
    if (size && board.length) beginRound(size);
  }, [size, board, beginRound]);

  useEffect(() => {
    if (!size || won) return;
    const conflicts = getConflicts(cells, board, size);
    const qCount = cells.filter((s) => s === QUEEN).length;
    if (qCount === size && conflicts.size === 0) {
      setWon(true);
      stopTimer();
      const el = since();
      setElapsed(el);
      saveRankingStore(addRankingEntry(loadRankingStore(), boardKey, el, Date.now()));
      clearSession();
      setShowWin(true);
    }
  }, [cells, size, board, won, boardKey, stopTimer, since, setElapsed]);

  // Autosave the in-progress round so it can be offered for resume after a
  // reload. Also saves on pagehide/beforeunload for the freshest elapsed time.
  useEffect(() => {
    if (!size || !mode || !boardOrdinal || won || showMenu || showResume) return;
    const persist = () => {
      saveSession({
        size,
        board,
        cells,
        mode,
        blindLevel,
        boardKey,
        boardLabel,
        boardOrdinal,
        elapsedMs: since(),
      });
    };
    persist();
    window.addEventListener('pagehide', persist);
    window.addEventListener('beforeunload', persist);
    return () => {
      window.removeEventListener('pagehide', persist);
      window.removeEventListener('beforeunload', persist);
    };
  }, [
    size,
    mode,
    boardOrdinal,
    won,
    showMenu,
    showResume,
    board,
    cells,
    blindLevel,
    boardKey,
    boardLabel,
    since,
  ]);

  const conflicts = useMemo(
    () => (size ? getConflicts(cells, board, size) : new Set<number>()),
    [cells, board, size],
  );
  const attacked = useMemo(
    () => (size ? getAttacked(cells, board, size) : new Set<number>()),
    [cells, board, size],
  );

  const newlyAttacked = useMemo(() => {
    if (lastPlacedQueen == null || !size || cells[lastPlacedQueen] !== QUEEN)
      return new Map<number, number>();
    const byNew = getAttackedByOneQueen(lastPlacedQueen, board, size);
    const otherCells = cells.map((v, i) => (i === lastPlacedQueen ? EMPTY : v)) as CellState[];
    const alreadyAttacked = getAttacked(otherCells, board, size);
    const result = new Map<number, number>();
    const qx = lastPlacedQueen % size;
    const qy = Math.trunc(lastPlacedQueen / size);
    byNew.forEach((ci) => {
      if (!alreadyAttacked.has(ci) && cells[ci] !== QUEEN) {
        const cx = ci % size;
        const cy = Math.trunc(ci / size);
        result.set(ci, Math.max(Math.abs(cx - qx), Math.abs(cy - qy)));
      }
    });
    return result;
  }, [cells, board, size, lastPlacedQueen]);

  const sealedRegions = useMemo(() => {
    if (!size) return new Set<number>();
    const regions = new Map<number, number[]>();
    board.forEach((region, index) => {
      const bucket = regions.get(region);
      if (bucket) bucket.push(index);
      else regions.set(region, [index]);
    });

    const sealed = new Set<number>();
    regions.forEach((indices, region) => {
      const hasQueen = indices.some((index) => cells[index] === QUEEN);
      const closed = indices.every((index) => cells[index] === MARK || attacked.has(index));
      if (!hasQueen && closed) sealed.add(region);
    });
    return sealed;
  }, [size, board, cells, attacked]);

  const rankingEntries = boardKey ? getRankingEntries(loadRankingStore(), boardKey) : [];
  const queenCount = cells.reduce<number>((count, cell) => count + (cell === QUEEN ? 1 : 0), 0);

  const resetToMenu = useCallback(() => {
    stopTimer();
    blind.stop();
    rotation.reset();
    clearSession();
    setShowWin(false);
    setShowExitConfirm(false);
    setShowResume(false);
    setWon(false);
    setSize(null);
    setBoard([]);
    setCells([]);
    setBoardKey('');
    setBoardLabel('');
    setLastPlacedQueen(null);
    setShowMenu(true);
  }, [stopTimer, blind, rotation]);

  const goToMenu = useCallback(() => {
    if (size) setShowExitConfirm(true);
    else resetToMenu();
  }, [size, resetToMenu]);

  const resumeSession = useCallback(() => {
    setShowResume(false);
    startTimer(elapsed);
  }, [startTimer, elapsed]);

  // A replay is a paid hint: it shows the colours again for a fixed 5s and
  // leaves the board untouched, charging 20s of stopwatch time instead.
  const replayBlindPreview = useCallback(() => {
    if (mode !== 'blind' || !blindLevel || !size || won || blind.active) return;
    penalize(BLIND_REPLAY_PENALTY_MS);
    blind.begin(BLIND_REPLAY_MS);
  }, [mode, blindLevel, size, won, blind, penalize]);

  const setCellAt = useCallback((i: number, value: CellState) => {
    setCells((prev) => {
      const next = [...prev];
      next[i] = next[i] === value ? EMPTY : value;
      return next;
    });
  }, []);

  const placeQueen = useCallback(
    (i: number) => {
      if (won || blind.active) return;
      if (cells[i] !== QUEEN && attacked.has(i)) return;
      const placing = cells[i] !== QUEEN;
      setCellAt(i, QUEEN);
      if (placing) {
        setLastAddTimestamp(Date.now());
        if (mode === 'twister') rotation.trigger();
      }
      setLastPlacedQueen(placing ? i : null);
    },
    [won, blind, cells, attacked, mode, rotation, setCellAt],
  );

  const toggleMark = useCallback(
    (i: number) => {
      if (blind.active || won || cells[i] === QUEEN) return;
      const adding = cells[i] !== MARK;
      setCellAt(i, MARK);
      if (adding) {
        setLastAddTimestamp(Date.now());
        setMarksSinceRotation((prev) => prev + 1);
      }
      setLastPlacedQueen(null);
    },
    [blind, won, cells, setCellAt],
  );

  /**
   * Sets one cell to the intent of the current paint stroke. Unlike
   * `toggleMark` this is absolute, so every cell a drag crosses ends up in the
   * same state no matter what it held before.
   */
  const paintMark = useCallback(
    (i: number, mark: boolean) => {
      if (blind.active || won) return;
      // A cell that `paintCell` leaves alone (a queen, or one already in the
      // target state) must not count towards the every-5-marks rotation.
      if (paintCell(cellsRef.current, i, mark) === cellsRef.current) return;
      setCells((prev) => paintCell(prev, i, mark));
      setLastAddTimestamp(Date.now());
      if (mark) setMarksSinceRotation((prev) => prev + 1);
      setLastPlacedQueen(null);
    },
    [blind.active, won],
  );

  const painting = useMarkPainting({
    enabled: size != null && !won && !blind.active,
    isMarked: useCallback((i: number) => cellsRef.current[i] === MARK, []),
    onPaint: paintMark,
    onPaintStart: useCallback(() => setPaintingMarks(true), []),
    onPaintEnd: useCallback(() => setPaintingMarks(false), []),
  });

  const activeSkin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  useEffect(() => {
    document.body.dataset.skin = skinId;
  }, [skinId]);

  const cycleSkin = useCallback(() => {
    setSkinId((prev) => {
      const idx = SKINS.findIndex((s) => s.id === prev);
      return SKINS[(idx + 1) % SKINS.length].id;
    });
  }, []);

  const overlay = showMenu || showWin || showExitConfirm || showResume;
  const showBlindColors = mode !== 'blind' || blind.active;
  const locale = I18N[lang];
  const tr = useCallback((key: string): string => locale[key] ?? key, [locale]);

  return (
    <>
      <TopBar
        size={size}
        mode={mode}
        elapsed={elapsed}
        queenCount={queenCount}
        boardOrdinal={boardOrdinal}
        version={version}
        blindPreviewActive={blind.active}
        blindPreviewRemainingMs={blind.remainingMs}
        onMenu={goToMenu}
        onNewBoard={() => size && startGame(size)}
        onSkipBlind={blind.stop}
        skinEmoji={activeSkin.emoji}
        skinLabel={activeSkin.label}
        onCycleSkin={cycleSkin}
        tr={tr}
      />

      {size && size > 0 && (
        <Board
          size={size}
          cells={cells}
          board={board}
          conflicts={conflicts}
          attacked={attacked}
          newlyAttacked={newlyAttacked}
          sealedRegions={sealedRegions}
          lastPlacedQueen={lastPlacedQueen}
          mode={mode}
          showBlindColors={showBlindColors}
          won={won}
          rotationFx={rotation.rotationFx}
          painting={painting}
          onCellClick={placeQueen}
          onCellMark={toggleMark}
          colors={activeSkin.boardColors}
          skin={activeSkin}
          tr={tr}
        />
      )}

      {mode === 'blind' && size && !blind.active && (
        <div id="blind-actions">
          <button type="button" id="blind-reveal-btn" onClick={replayBlindPreview}>
            {tr('showAgain')}
          </button>
        </div>
      )}

      <Ranking entries={rankingEntries} boardLabel={boardLabel} tr={tr} />

      {overlay && (
        // A purely visual scrim: popups deliberately do not close on outside clicks.
        <div className="overlay show" />
      )}

      {showMenu && (
        <Menu
          lang={lang}
          onToggleLang={() => setLang((prev) => (prev === 'en' ? 'es' : 'en'))}
          mode={mode}
          onSelectMode={setMode}
          blindLevel={blindLevel}
          onSelectBlindLevel={setBlindLevel}
          onStartGame={startGame}
          tr={tr}
        />
      )}

      {showWin && (
        <WinPopup
          elapsed={elapsed}
          onRetry={startRound}
          onNext={() => size && startGame(size)}
          tr={tr}
        />
      )}

      {showExitConfirm && (
        <ExitConfirm onCancel={() => setShowExitConfirm(false)} onConfirm={resetToMenu} tr={tr} />
      )}

      {showResume && (
        <ResumeConfirm
          boardLabel={boardLabel}
          onResume={resumeSession}
          onRestart={resetToMenu}
          tr={tr}
        />
      )}
    </>
  );
}
