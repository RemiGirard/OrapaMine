import { describe, expect, it } from 'vitest'
import {
  finishPieceMovement,
  movePieceMovement,
  startPieceMovement,
} from './pieceMovement'

describe('piece movement application service', () => {
  it('turns pointer movement over the board into a place command', () => {
    const session = startPieceMovement({
      anchor: { column: 1, row: 1 },
      mineralId: 'red-parallelogram',
      pointer: { x: 10, y: 10 },
      target: null,
    })
    const movedSession = movePieceMovement(
      session,
      { x: 160, y: 120 },
      {
        kind: 'board',
        origin: { column: 3, row: 2 },
      },
    )

    expect(movedSession.hasMoved).toBe(true)
    expect(finishPieceMovement(movedSession, movedSession.target)).toEqual({
      kind: 'place',
      mineralId: 'red-parallelogram',
      origin: { column: 3, row: 2 },
    })
  })

  it('turns a placed piece movement over its stack slot into a return command', () => {
    const session = startPieceMovement({
      anchor: { column: 0.5, row: 0.5 },
      mineralId: 'yellow-triangle',
      pointer: { x: 20, y: 20 },
      target: null,
    })
    const movedSession = movePieceMovement(session, { x: 24, y: 24 }, null)
    const returnSession = movePieceMovement(
      movedSession,
      { x: 8, y: 8 },
      {
        kind: 'stack',
      },
    )

    expect(finishPieceMovement(returnSession, returnSession.target)).toEqual({
      kind: 'return',
      mineralId: 'yellow-triangle',
    })
  })
})
