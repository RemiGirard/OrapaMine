import { describe, expect, it } from 'vitest'
import type { GuessPlacement } from '../domain/minerals'
import {
  initialKeyboardPlacementOrigin,
  moveKeyboardPlacementOrigin,
} from './keyboardPieceMovement'

const ruby: GuessPlacement = {
  face: 'front',
  mineralId: 'red-parallelogram',
  orientation: 'north',
  origin: null,
}

describe('keyboard piece movement application service', () => {
  it('starts an unplaced piece in the center of the board', () => {
    expect(initialKeyboardPlacementOrigin(ruby)).toEqual({
      column: 2,
      row: 4,
    })
  })

  it('starts a placed piece from its current origin', () => {
    expect(
      initialKeyboardPlacementOrigin({
        ...ruby,
        origin: { column: 6, row: 7 },
      }),
    ).toEqual({ column: 6, row: 7 })
  })

  it('moves one grid coordinate at a time', () => {
    expect(
      moveKeyboardPlacementOrigin(ruby, { column: 2, row: 4 }, 'right'),
    ).toEqual({ column: 3, row: 4 })
    expect(
      moveKeyboardPlacementOrigin(ruby, { column: 2, row: 4 }, 'up'),
    ).toEqual({ column: 2, row: 3 })
  })

  it('keeps one part of the piece visible at every board edge', () => {
    expect(
      moveKeyboardPlacementOrigin(ruby, { column: -2, row: 0 }, 'left'),
    ).toEqual({ column: -2, row: 0 })
    expect(
      moveKeyboardPlacementOrigin(ruby, { column: 7, row: 9 }, 'right'),
    ).toEqual({ column: 7, row: 9 })
  })
})
