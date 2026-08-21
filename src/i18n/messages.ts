import type { Lang } from '../types/i18n';

/**
 * Every UI string in the app, one entry per message with a value per language.
 *
 * Languages live side by side rather than in a file each: parallel per-language
 * files are the same key list written twice, which drifts out of sync silently
 * and reads to duplication detectors as one copied block. Here a missing or
 * stale translation is visible on the line it belongs to, and `satisfies`
 * makes an incomplete entry a type error.
 */
export const MESSAGES = {
  menu: { en: 'Menu', es: 'Menu' },
  newBoard: { en: 'New Board', es: 'Nuevo tablero' },
  time: { en: 'Time', es: 'Tiempo' },
  mode: { en: 'Mode', es: 'Modo' },
  noMode: { en: 'Not selected', es: 'Sin seleccionar' },
  skin: { en: 'Skin', es: 'Tema' },
  memorizeBoard: { en: 'Memorize board', es: 'Memoriza el tablero' },
  startNow: { en: 'Start now', es: 'Empezar ya' },
  queens: { en: 'Queeens', es: 'Queeens' },
  version: { en: 'Version', es: 'Version' },
  showAgain: { en: 'Show again (5s, +20s)', es: 'Mostrar de nuevo (5s, +20s)' },
  localRanking: { en: 'Local ranking', es: 'Ranking local' },
  board: { en: 'Board', es: 'Tablero' },
  rules: { en: 'Rules', es: 'Reglas' },
  difficulty: { en: 'Difficulty', es: 'Dificultad' },
  pickDifficulty: {
    en: 'Pick a difficulty to enable levels.',
    es: 'Selecciona dificultad para habilitar niveles.',
  },
  congrats: { en: 'Congratulations!', es: 'Felicidades!' },
  allQueensPlaced: { en: 'You placed all queens!', es: 'Has colocado todas las reinas!' },
  tookTime: { en: 'You took', es: 'Has tardado' },
  retryBoard: { en: 'Retry board', es: 'Reintentar tablero' },
  nextBoard: { en: 'Next board', es: 'Siguiente tablero' },
  confirmExitTitle: { en: 'Leave current game?', es: 'Salir de la partida actual?' },
  confirmExit: {
    en: 'Returning to menu will end the current game. Continue?',
    es: 'Volver al menu terminara la partida actual. Continuar?',
  },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  continue: { en: 'Continue', es: 'Continuar' },
  resumeTitle: { en: 'Resume your game?', es: 'Continuar tu partida?' },
  resumePrompt: {
    en: 'You have a game in progress. Do you want to continue where you left off?',
    es: 'Tienes una partida en curso. Quieres seguir por donde lo habias dejado?',
  },
  resumeContinue: { en: 'Continue game', es: 'Seguir jugando' },
  resumeRestart: { en: 'Start over', es: 'Empezar de nuevo' },
  blindDifficultyAria: { en: 'Blind mode difficulty', es: 'Dificultad modo blind' },
  rankingAria: { en: 'Local ranking for current board', es: 'Ranking local del tablero actual' },
  modeAria: { en: 'Game modes', es: 'Modos de juego' },
  languageAria: { en: 'Language', es: 'Idioma' },
  boardAria: { en: 'Game board', es: 'Tablero de juego' },
  cellRow: { en: 'Row', es: 'Fila' },
  cellCol: { en: 'column', es: 'columna' },
  cellEmpty: { en: 'empty', es: 'vacia' },
  cellQueen: { en: 'queen', es: 'reina' },
  cellMarked: { en: 'marked', es: 'marcada' },
  cellBlocked: { en: 'blocked', es: 'bloqueada' },
  'mode.classic.label': { en: 'Classic', es: 'Clasico' },
  'mode.twister.label': { en: 'Twister', es: 'Twister' },
  'mode.blind.label': { en: 'Blind', es: 'Blind' },
  'mode.classic.rule.1': {
    en: 'Place one queen per color/region.',
    es: 'Coloca una reina por color/region.',
  },
  'mode.classic.rule.2': {
    en: 'Queeens cannot share row, column, or short diagonal.',
    es: 'No pueden compartir fila, columna ni diagonal corta.',
  },
  'mode.classic.rule.3': {
    en: 'Right click to mark a discard X; drag with either button to mark or clear a whole run.',
    es: 'Click derecho para marcar una cruz; arrastra con cualquier boton para marcar o quitar varias.',
  },
  'mode.twister.rule.1': { en: 'Board rotates when:', es: 'El tablero gira cuando:' },
  'mode.twister.rule.2': { en: '- you place a queen', es: '- colocas una reina' },
  'mode.twister.rule.3': {
    en: '- you place 5 X marks (after you lift your finger)',
    es: '- pones 5 cruces (al levantar el dedo)',
  },
  'mode.twister.rule.4': {
    en: '- 30 seconds pass with no actions.',
    es: '- tras 30 segundos sin anadir nada.',
  },
  'mode.blind.rule.1': {
    en: 'Memorize colors at the beginning.',
    es: 'Memoriza colores al inicio.',
  },
  'mode.blind.rule.2': {
    en: 'You will then play on a board with hidden colors.',
    es: 'Jugaras sobre un tablero sin colores visibles.',
  },
  'mode.blind.rule.3': {
    en: 'Show again reveals the colors for 5s and costs +20s. Your queens stay put.',
    es: 'Mostrar de nuevo revela los colores 5s y cuesta +20s. Tus reinas se mantienen.',
  },
  'blind.level.easy': { en: 'Easy', es: 'Facil' },
  'blind.level.medium': { en: 'Medium', es: 'Medio' },
  'blind.level.hard': { en: 'Hard', es: 'Dificil' },
} satisfies Record<string, Record<Lang, string>>;

export type MessageKey = keyof typeof MESSAGES;
