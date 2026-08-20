import type { BlindLevel, GameMode } from '../i18n';

export const COLORS = [
  '#77DD77',
  '#AEC6CF',
  '#F6D7A7',
  '#FFB7B2',
  '#B39EB5',
  '#FF6961',
  '#FFD1DC',
  '#CFCFC4',
  '#C1E1C1',
  '#F7CAC9',
  '#F4A259',
  '#7BC8A4',
  '#89A7FF',
  '#D7A9E3',
  '#F0E68C',
  '#9AD1D4',
];

export const LEVEL_OPTIONS = [5, 6, 7, 8, 9, 10, 12, 14];

export const TORNADO_BIAS = 0.65;
export const ROTATION_ANIM_MS = 900;
export const ROTATION_SWAP_MS = 16;

export const MODE_LABEL_KEYS: Record<GameMode, string> = {
  classic: 'mode.classic.label',
  twister: 'mode.twister.label',
  blind: 'mode.blind.label',
};

export const MODE_RULE_KEYS: Record<GameMode, string[]> = {
  classic: ['mode.classic.rule.1', 'mode.classic.rule.2', 'mode.classic.rule.3'],
  twister: [
    'mode.twister.rule.1',
    'mode.twister.rule.2',
    'mode.twister.rule.3',
    'mode.twister.rule.4',
  ],
  blind: ['mode.blind.rule.1', 'mode.blind.rule.2', 'mode.blind.rule.3'],
};

export const BLIND_LEVEL_LABEL_KEYS: Record<BlindLevel, string> = {
  easy: 'blind.level.easy',
  medium: 'blind.level.medium',
  hard: 'blind.level.hard',
};
