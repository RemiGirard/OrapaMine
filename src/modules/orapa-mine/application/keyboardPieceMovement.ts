import { boardSize } from '../domain/coordinates'
import type { Coordinate } from '../domain/coordinates'
import { getMineralShape } from '../domain/minerals'
import type { GuessPlacement } from '../domain/minerals'

export type KeyboardMovementDirection = 'down' | 'left' | 'right' | 'up'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function initialKeyboardPlacementOrigin(
  placement: GuessPlacement,
): Coordinate {
  if (placement.origin) {
    return placement.origin
  }

  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return {
    column: Math.floor((boardSize.columns - shape.width) / 2),
    row: Math.floor((boardSize.rows - shape.height) / 2),
  }
}

export function moveKeyboardPlacementOrigin(
  placement: GuessPlacement,
  origin: Coordinate,
  direction: KeyboardMovementDirection,
): Coordinate {
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )
  const columnDelta = direction === 'left' ? -1 : direction === 'right' ? 1 : 0
  const rowDelta = direction === 'up' ? -1 : direction === 'down' ? 1 : 0

  // Keep one row or column of the piece on the board so invalid edge
  // placements remain visible and can be corrected.
  return {
    column: clamp(
      origin.column + columnDelta,
      1 - shape.width,
      boardSize.columns - 1,
    ),
    row: clamp(origin.row + rowDelta, 1 - shape.height, boardSize.rows - 1),
  }
}
