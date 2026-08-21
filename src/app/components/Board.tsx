import type { CellState } from '../../lib/game';
import type { GameMode } from '../../i18n';
import type { MarkPainting } from '../hooks/useMarkPainting';
import type { RotationFx } from '../hooks/useTwisterRotation';
import type { Skin } from '../skins';
import { COLORS, ROTATION_ANIM_MS } from '../constants';
import { Cell } from './Cell';
import type { Tr } from './types';

type BoardProps = Readonly<{
  size: number;
  cells: CellState[];
  board: number[];
  conflicts: Set<number>;
  attacked: Set<number>;
  newlyAttacked: Map<number, number>;
  sealedRegions: Set<number>;
  lastPlacedQueen: number | null;
  mode: GameMode | null;
  showBlindColors: boolean;
  won: boolean;
  rotationFx: RotationFx;
  painting: MarkPainting;
  onCellClick: (i: number) => void;
  onCellMark: (i: number) => void;
  colors?: string[];
  skin?: Skin;
  tr: Tr;
}>;

function boardClassName(size: number, won: boolean): string {
  if (won) return 'disabled' + (size >= 10 ? ' small-cells' : '');
  if (size >= 14) return 'smallest-cells';
  if (size >= 10) return 'small-cells';
  return '';
}

function cellPixels(size: number): number {
  if (size >= 14) return 28;
  if (size >= 10) return 36;
  return 50;
}

/** CSS `animation` shorthand for the twister spin, or undefined when idle. */
function spinAnimation(rotationFx: RotationFx): string | undefined {
  if (!rotationFx) return undefined;
  const keyframes = rotationFx.direction === 'right' ? 'boardSpinRight' : 'boardSpinLeft';
  return `${keyframes} ${ROTATION_ANIM_MS}ms cubic-bezier(.22,.86,.24,1)`;
}

export function Board({
  size,
  cells,
  board,
  conflicts,
  attacked,
  newlyAttacked,
  sealedRegions,
  lastPlacedQueen,
  mode,
  showBlindColors,
  won,
  rotationFx,
  painting,
  onCellClick,
  onCellMark,
  colors = COLORS,
  skin,
  tr,
}: BoardProps) {
  const animation = spinAnimation(rotationFx);
  const patterned = skin?.patterned && skin.regions;
  // The click that ends a paint stroke must not also drop a queen on the cell
  // the finger happened to be released over, and the `contextmenu` a
  // right-button stroke leaves behind must not toggle that cell back.
  const handleCellClick = (i: number) => {
    if (painting.shouldSwallowClick()) return;
    onCellClick(i);
  };
  const handleCellMark = (i: number) => {
    if (painting.shouldSwallowContextMenu()) return;
    onCellMark(i);
  };
  // A cell's identity is its board coordinate, which is what the key encodes.
  const cellEntries = cells.map((cell, index) => ({
    key: `r${Math.trunc(index / size)}c${index % size}`,
    index,
    cell,
  }));

  return (
    <section
      id="board"
      aria-label={tr('boardAria')}
      className={boardClassName(size, won)}
      style={{ gridTemplateColumns: `repeat(${size}, ${cellPixels(size)}px)`, animation }}
      {...painting.handlers}
      // Pointer capture retargets a right-drag's `contextmenu` here, past the
      // cell's own handler, so the native menu is suppressed board-wide.
      onContextMenu={(e) => e.preventDefault()}
    >
      {cellEntries.map(({ key, index: i, cell }) => {
        const region = patterned ? skin!.regions![board[i]] : undefined;
        return (
          <Cell
            key={key}
            index={i}
            size={size}
            cell={cell}
            color={showBlindColors ? colors[board[i]] : '#d8dee9'}
            conflict={conflicts.has(i)}
            justPlaced={i === lastPlacedQueen}
            attacked={attacked.has(i) && mode !== 'blind'}
            sealed={mode !== 'blind' && sealedRegions.has(board[i])}
            highlightDelay={newlyAttacked.has(i) ? (newlyAttacked.get(i) || 0) * 0.045 : null}
            interactive={!won}
            regionClass={showBlindColors && region ? `pat-${region.pattern}` : undefined}
            patternColors={showBlindColors && region ? { p1: region.p1, p2: region.p2 } : undefined}
            animal={showBlindColors ? region?.animal : undefined}
            onClick={handleCellClick}
            onMark={handleCellMark}
            tr={tr}
          />
        );
      })}
    </section>
  );
}
