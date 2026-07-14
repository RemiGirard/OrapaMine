# Architecture

The app uses a small DDD-inspired split under `src/modules/orapa-mine`.

## Domain

Pure game concepts with no React imports:

- Coordinates, board dimensions, edge labels, and coordinate parsing.
- Gem colors and signal color mixing.
- Mineral optical-cell shapes, orientations, occupied grid cells, and contact rules.
- Prepared puzzles and solution comparison.
- Wave tracing and question answering.

## Application

`useCooperativeMineGame` owns the current puzzle, ray history, reveal state,
selected family piece, family guess board, rotations, and answer submission use cases.

## Presentation

React components render the current application state declaratively:

- `CooperativeMineGame`
- `GuessBoard`
- `PieceShape`
- `ColorDot`

All presentation styling is colocated in CSS modules.
