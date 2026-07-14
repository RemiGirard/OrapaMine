# Architecture

Orapa Mine is one bounded context organized with inward dependencies. The code is
feature-oriented at the presentation edge and concept-oriented in the domain.

## Dependency Rule

```text
presentation  --->  application  --->  domain
      |                                  ^
      +----------------------------------+

infrastructure  --->  application ports
```

- `domain` has no React, browser, DOM, or infrastructure imports.
- `application` coordinates domain rules through pure use cases. It has no React or DOM imports.
- `infrastructure` implements application ports, such as browser speech recognition.
- `presentation` adapts React and browser events to application commands. It may read domain
  value types to render the board, but it does not implement game rules.

## Domain Model

- `coordinates`: board dimensions, coordinates, directions, and edge-port parsing.
- `minerals`: gemstone identity, face, orientation, polygon, optical cells, placement validity,
  and overlap rules.
- `waves`: deterministic wave tracing through placed optical cells.
- `questions`: edge and coordinate questions and their answers.
- `familySolution`: the family's candidate placement and exact solution comparison.
- `puzzles`: prepared puzzle definitions.
- `colors`: gem colors and resulting signal-color mixtures.
- `voiceCommands`: spoken language translated to a domain question.

The same mineral shape drives rendering, placement validation, and optics. There is no separate
UI-only representation of a game piece.

## Application Use Cases

- `clueNotebook`: ask a clue, retain the latest 18 answers, and index known edge clues.
- `clueConsistency`: compare every recorded edge clue with the rays produced by the current
  family placement, counting repeated questions once in the summary.
- `familySolution`: start, select, place, rotate, flip, return, reset, and submit the family map.
- `cooperativeGame`: the puzzle-session aggregate and command reducer. Starting a new puzzle
  resets all puzzle-scoped features together.
- `gameView`: derives the current puzzle, current-placement light preview, all live rays, and
  edge-answer lookup without storing duplicate state.
- `pieceMovement`: pointer-agnostic movement session and final place/return commands.
- `voiceRecognition`: port used by browser speech-recognition infrastructure.

Application functions return new immutable state. React is only an adapter around
`reduceCooperativeGame`.

## Presentation Features

- `CooperativeMineGame`: route-level composition and puzzle controls.
- `GameTable`: composes explicit `clues`, `familySolution`, `light`, `puzzle`, and `voice`
  view-model contracts.
- `board`: board surface and clickable perimeter ports.
- `glass`: foam case, rendered pieces, drag lifecycle, and DOM hit-testing adapter.
- `light`: current/all ray overlays and visibility controls.
- `clues`: current answer, notebook history, and temporary answer preview.
- `solution`: submission feedback.

Each feature owns its React component and CSS module. Cross-feature layout belongs to
`GameTable.module.css`; glass appearance and overlays remain owned by the glass feature.

## Interaction Boundary

Dragging is deliberately split in two:

1. `application/pieceMovement.ts` models start, movement threshold, target, and resulting command.
2. `presentation/glass/pieceDropTargets.ts` converts client coordinates and DOM rectangles into
   board or foam-case targets while calling domain placement and overlap rules.
3. `presentation/glass/usePieceMovementInteraction.ts` owns browser listener lifetime and dispatches
   the resulting place/return command to React.

This keeps browser mechanics replaceable without duplicating placement rules.

## Testing Strategy

- Domain tests cover geometry, optics, color mixing, and exact family-solution comparison.
- Application tests cover aggregate transitions and the movement state machine.
- Adapter tests cover pointer-to-board geometry, invalid overlap, and foam-case return targets.
- React interaction tests exercise the complete case-to-board-to-case workflow, rotation, flipping,
  ray clipping, ray visibility, and edge-output emphasis.
