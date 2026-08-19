import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { MARK, QUEEN, type CellState } from '../../lib/game';
import { CELL_INDEX_ATTR } from '../hooks/useMarkPainting';
import type { Tr } from './types';

/** Print colours for a region, exposed to CSS as --p1 / --p2 custom properties. */
export type PatternColors = { p1: string; p2?: string };

export type CellProps = Readonly<{
  index: number;
  size: number;
  cell: CellState;
  color: string;
  conflict: boolean;
  justPlaced: boolean;
  attacked: boolean;
  sealed: boolean;
  /** Animation delay (s) when the cell was just attacked, or null. */
  highlightDelay: number | null;
  interactive: boolean;
  /** Generic CSS class painting this region's animal print (patterned skins). */
  regionClass?: string;
  /** Colours fed to the print class via --p1 / --p2 custom properties. */
  patternColors?: PatternColors;
  /** Animal emoji placed instead of a queen (patterned skins). */
  animal?: string;
  onClick: (i: number) => void;
  onMark: (i: number) => void;
  tr: Tr;
}>;

/** What a cell renders: its modifier classes, glyph and screen-reader state. */
type CellVisual = {
  classes: string[];
  content: string;
  contentClass: 'x-mark' | 'animal-mark';
  state: string;
};

function queenVisual(props: CellProps, classes: string[]): CellVisual {
  const state = props.tr('cellQueen');
  classes.push('queen');
  if (props.conflict) classes.push('conflict');
  if (props.justPlaced) classes.push('just-placed');

  if (props.animal) {
    classes.push('animal-piece');
    return { classes, content: props.animal, contentClass: 'animal-mark', state };
  }
  return { classes, content: '', contentClass: 'x-mark', state };
}

function describeCell(props: CellProps): CellVisual {
  const classes = ['cell'];
  if (props.regionClass) classes.push(props.regionClass);
  if (props.sealed) classes.push('sealed-region');

  if (props.cell === QUEEN) return queenVisual(props, classes);

  if (props.cell === MARK) {
    classes.push('marked');
    return { classes, content: '✕', contentClass: 'x-mark', state: props.tr('cellMarked') };
  }

  if (props.attacked) {
    classes.push('attacked');
    return { classes, content: '✕', contentClass: 'x-mark', state: props.tr('cellBlocked') };
  }

  return { classes, content: '', contentClass: 'x-mark', state: props.tr('cellEmpty') };
}

export function Cell(props: CellProps) {
  const {
    index,
    size,
    cell,
    color,
    highlightDelay,
    interactive,
    patternColors,
    onClick,
    onMark,
    tr,
  } = props;
  const { classes, content, contentClass, state } = describeCell(props);

  const row = Math.trunc(index / size) + 1;
  const col = (index % size) + 1;
  const highlighted = contentClass === 'x-mark' && highlightDelay !== null;

  // Enter/Space already activate a <button>; only the mark shortcut needs handling.
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      onMark(index);
    }
  };

  return (
    <button
      type="button"
      className={classes.join(' ')}
      {...{ [CELL_INDEX_ATTR]: index }}
      aria-label={`${tr('cellRow')} ${row}, ${tr('cellCol')} ${col}: ${state}`}
      aria-pressed={cell === QUEEN}
      tabIndex={interactive ? 0 : -1}
      style={
        {
          backgroundColor: color,
          ...(patternColors && {
            '--p1': patternColors.p1,
            '--p2': patternColors.p2 ?? patternColors.p1,
          }),
        } as CSSProperties
      }
      onClick={() => onClick(index)}
      onContextMenu={(e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onMark(index);
      }}
      onKeyDown={handleKeyDown}
    >
      {content && (
        <span
          className={`${contentClass}${highlighted ? ' x-new' : ''}`}
          style={highlighted ? { animationDelay: `${highlightDelay}s` } : undefined}
        >
          {content}
        </span>
      )}
    </button>
  );
}
