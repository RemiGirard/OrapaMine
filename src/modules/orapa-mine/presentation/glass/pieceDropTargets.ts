import type {
  PieceMovementAnchor,
  PieceMovementTarget,
} from '../../application/pieceMovement'
import { boardSize } from '../../domain/coordinates'
import type { Coordinate } from '../../domain/coordinates'
import {
  canPlaceMineralWithOrientation,
  getMineralShape,
  placementsOverlap,
} from '../../domain/minerals'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../../domain/minerals'

export type ClientPoint = Readonly<{ x: number; y: number }>

export function movementTargetFromClientPoint({
  anchor,
  boardRect,
  documentRoot,
  guess,
  mineralId,
  point,
}: Readonly<{
  anchor: PieceMovementAnchor
  boardRect: DOMRect | null
  documentRoot: Document
  guess: ReadonlyArray<GuessPlacement>
  mineralId: MineralId
  point: ClientPoint
}>): PieceMovementTarget {
  const boardOrigin = targetOriginFromClientPoint(
    boardRect,
    guess,
    point,
    mineralId,
    anchor,
  )

  if (boardOrigin) {
    return { kind: 'board', origin: boardOrigin }
  }

  const placement = guess.find(
    (guessPlacement) => guessPlacement.mineralId === mineralId,
  )

  if (
    placement?.origin &&
    isPointOverStackSlot(documentRoot, point, mineralId)
  ) {
    return { kind: 'stack' }
  }

  return null
}

export function stackDragAnchor(
  placement: GuessPlacement,
): PieceMovementAnchor {
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return {
    column: shape.width / 2,
    row: shape.height / 2,
  }
}

export function placedDragAnchorFromClientPoint(
  boardRect: DOMRect | null,
  point: ClientPoint,
  placement: GuessPlacement,
): PieceMovementAnchor {
  const boardPoint = boardPointFromClientPoint(boardRect, point)

  if (!boardPoint || !placement.origin) {
    return stackDragAnchor(placement)
  }

  return {
    column: boardPoint.column - placement.origin.column,
    row: boardPoint.row - placement.origin.row,
  }
}

function targetOriginFromClientPoint(
  boardRect: DOMRect | null,
  guess: ReadonlyArray<GuessPlacement>,
  point: ClientPoint,
  mineralId: MineralId,
  anchor: PieceMovementAnchor,
): Coordinate | null {
  const boardPoint = boardPointFromClientPoint(boardRect, point)

  if (!boardPoint) {
    return null
  }

  const origin = {
    column: Math.round(boardPoint.column - anchor.column),
    row: Math.round(boardPoint.row - anchor.row),
  }

  return canDropMineral(guess, mineralId, origin) ? origin : null
}

function boardPointFromClientPoint(
  boardRect: DOMRect | null,
  point: ClientPoint,
): Coordinate | null {
  if (!boardRect) {
    return null
  }

  const column =
    ((point.x - boardRect.left) / boardRect.width) * boardSize.columns
  const row = ((point.y - boardRect.top) / boardRect.height) * boardSize.rows

  if (
    column < 0 ||
    column > boardSize.columns ||
    row < 0 ||
    row > boardSize.rows
  ) {
    return null
  }

  return { column, row }
}

function canDropMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
  origin: Coordinate,
) {
  const targetPlacement = guess.find(
    (placement) => placement.mineralId === mineralId,
  )

  if (!targetPlacement) {
    return false
  }

  if (
    !canPlaceMineralWithOrientation(
      mineralId,
      origin,
      targetPlacement.orientation,
      targetPlacement.face,
    )
  ) {
    return false
  }

  const nextPlacements = guess.flatMap<MineralPlacement>((placement) => {
    if (placement.mineralId === mineralId) {
      return [
        {
          face: targetPlacement.face,
          mineralId,
          orientation: targetPlacement.orientation,
          origin,
        },
      ]
    }

    return placement.origin
      ? [
          {
            face: placement.face,
            mineralId: placement.mineralId,
            orientation: placement.orientation,
            origin: placement.origin,
          },
        ]
      : []
  })

  return !placementsOverlap(nextPlacements)
}

function isPointOverStackSlot(
  documentRoot: Document,
  point: ClientPoint,
  mineralId: MineralId,
) {
  const stackSlots = documentRoot.querySelectorAll('[data-stack-mineral-id]')

  for (const stackSlot of stackSlots) {
    if (!(stackSlot instanceof HTMLElement)) {
      continue
    }

    if (stackSlot.dataset.stackMineralId !== mineralId) {
      continue
    }

    const rect = stackSlot.getBoundingClientRect()

    if (
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom
    ) {
      return true
    }
  }

  let currentElement = documentRoot.elementFromPoint(point.x, point.y)

  while (currentElement instanceof HTMLElement) {
    if (currentElement.dataset.stackMineralId === mineralId) {
      return true
    }

    currentElement = currentElement.parentElement
  }

  return false
}
