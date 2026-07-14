# Architecture

The app uses a small DDD-inspired split under `src/modules/orapa-mine`.

## Domain

Pure game concepts with no React imports:

- Coordinates, board dimensions, edge labels, and coordinate parsing.
- Gem colors and signal color mixing.
- Mineral shapes, reflectors, and occupied grid cells.
- Prepared puzzles and solution comparison.
- Wave tracing and question answering.

## Application

`useCooperativeMineGame` owns the current puzzle, question history, reveal state,
family guess board, and answer submission use cases.

## Presentation

React components render the current application state declaratively:

- `CooperativeMineGame`
- `QuestionConsole`
- `BoardView`
- `GuessBoard`

All presentation styling is colocated in CSS modules.
