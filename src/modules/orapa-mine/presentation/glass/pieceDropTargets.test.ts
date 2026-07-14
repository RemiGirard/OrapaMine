/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest'
import { createEmptyGuess, moveGuessMineral } from '../../domain/familySolution'
import type { Puzzle } from '../../domain/puzzles'
import {
  movementTargetFromClientPoint,
  placedDragAnchorFromClientPoint,
  stackDragAnchor,
} from './pieceDropTargets'

const puzzle: Puzzle = {
  id: 'drop-target-test',
  placements: [
    { mineralId: 'red-parallelogram', origin: { column: 0, row: 0 } },
    { mineralId: 'yellow-triangle', origin: { column: 4, row: 4 } },
  ],
  ruleset: 'basic',
  title: 'Drop Target Test',
}

const boardRect = {
  bottom: 1000,
  height: 1000,
  left: 0,
  right: 800,
  top: 0,
  width: 800,
  x: 0,
  y: 0,
} as DOMRect

afterEach(() => {
  document.body.replaceChildren()
})

describe('piece drop target adapter', () => {
  it('maps the pointer and drag anchor to a valid grid origin', () => {
    const guess = createEmptyGuess(puzzle)
    const redPlacement = guess[0]

    expect(
      movementTargetFromClientPoint({
        anchor: stackDragAnchor(redPlacement),
        boardRect,
        documentRoot: document,
        guess,
        mineralId: redPlacement.mineralId,
        point: { x: 350, y: 350 },
      }),
    ).toEqual({ kind: 'board', origin: { column: 2, row: 3 } })
  })

  it('rejects a drop that overlaps another placed mineral', () => {
    const guess = moveGuessMineral(
      createEmptyGuess(puzzle),
      'yellow-triangle',
      { column: 2, row: 3 },
    )
    const redPlacement = guess[0]

    expect(
      movementTargetFromClientPoint({
        anchor: stackDragAnchor(redPlacement),
        boardRect,
        documentRoot: document,
        guess,
        mineralId: redPlacement.mineralId,
        point: { x: 350, y: 350 },
      }),
    ).toBeNull()
  })

  it('recognizes the matching foam slot as a return target', () => {
    const guess = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 2, row: 3 },
    )
    const slot = document.createElement('div')
    slot.dataset.stackMineralId = 'red-parallelogram'
    slot.getBoundingClientRect = () =>
      ({ bottom: 120, left: 20, right: 120, top: 20 }) as DOMRect
    document.body.append(slot)

    expect(
      movementTargetFromClientPoint({
        anchor: { column: 1, row: 0.5 },
        boardRect: null,
        documentRoot: document,
        guess,
        mineralId: 'red-parallelogram',
        point: { x: 70, y: 70 },
      }),
    ).toEqual({ kind: 'stack' })
  })

  it('preserves the grabbed point when a placed piece starts moving', () => {
    const placement = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 2, row: 3 },
    )[0]

    const anchor = placedDragAnchorFromClientPoint(
      boardRect,
      { x: 325, y: 340 },
      placement,
    )

    expect(anchor.column).toBeCloseTo(1.25)
    expect(anchor.row).toBeCloseTo(0.4)
  })
})
