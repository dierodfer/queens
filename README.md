![Queeens](src/assets/queeens-image.png)

![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0.1-646CFF?logo=vite&logoColor=white)

## ▶️ Play the Web App

[Play now on GitHub Pages!](https://dierodfer.github.io/queeens/)

Fast, clean, and a little chaotic.
Queeens is a logic puzzle game built with React, TypeScript and Vite, where you place one queen per region without conflicts, based on the 8 queens problem.

<p>
  <img src="docs/screenshots/twister-mode.png" alt="Twister mode rules in the menu" width="32%" />
  <img src="docs/screenshots/twister-rotation.png" alt="Twister mode board mid-rotation" width="32%" />
  <img src="docs/screenshots/exit-confirm.png" alt="Exit confirmation dialog" width="32%" />
</p>

## Game Rules ♟️

- Place exactly one queen in each region.
- Avoid conflicts in the same row.
- Avoid conflicts in the same column.
- Avoid adjacent diagonals.
- Avoid placing queens in the same region/color.

Attacked cells are marked and blocked for queen placement, so the board stays readable while you solve.

## Controls 🖐️

- **Tap / click** a cell to place or remove a queen.
- **Right click** (or the `x` key on a focused cell) toggles a single discard X.
- **Drag** across the board — with either mouse button, or a finger — to paint a
  run of X marks in one gesture. The state of the cell **at the moment you press
  it** decides the whole stroke: press an unmarked cell and everything you cross
  gets marked, press a marked one and everything you cross gets cleared. That
  holds even though pressing a cell can mark it on its own (a long press on
  touch, a right press on desktop), so holding and then sliding keeps marking
  rather than undoing itself. Queens are never painted over, and the press that
  ends a stroke does not place a queen.

## Game Modes ✨

- **Classic** — the standard puzzle: place one queen per region with no two
  queens sharing a row, column, or short diagonal.
- **Twister** — same rules as Classic, but the board rotates every time you
  place a queen, mark 5 X cells, or after 30 seconds of inactivity. A rotation
  earned mid-drag waits until you lift your finger, so the board never spins
  out from under the stroke you are drawing.
- **Blind** — memorize the region colors during a preview countdown, then
  solve the board with the colors hidden. Choose `Easy`, `Medium`, or `Hard`
  to change how long you get to memorize it. **Show again** re-reveals the
  colors for 5 seconds and costs +20 seconds on the clock; your queens stay
  exactly where you put them.

## Quick Start 🚀

```bash
npm install
npm start
```

Other useful commands:

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run preview      # preview the production build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run format       # format with Prettier
npm test             # run the unit tests (Vitest)
```

## Architecture 🧩

The code is organized in layers so each piece stays small and focused:

- **`src/lib/`** — pure, framework-agnostic game logic (conflict/attack
  detection, board rotation, ranking, time formatting, blind timing). No React,
  fully unit-tested.
- **`src/app/hooks/`** — stateful behavior isolated from rendering: `useTimer`
  (stopwatch), `useBlindPreview` (memorize countdown), `useTwisterRotation`
  (board rotation triggers and timers) and `useMarkPainting` (the drag-to-mark
  gesture).
- **`src/app/components/`** — presentational components that only render props.
- **`src/app/Queeens.tsx`** — orchestrates state and wires the hooks and
  components together.

## Testing 🧪

Unit tests run with [Vitest](https://vitest.dev/) and cover the pure logic in
`src/lib/` (conflict/attack detection, rotation, ranking storage, formatting and
blind timing).

```bash
npm test          # run once
npm run test:watch # watch mode
```
