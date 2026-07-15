import type {
  PieceMovementAnchor,
  PieceMovementTarget,
} from '../../application/pieceMovement'
import { boardSize } from '../../domain/coordinates'
import type { Coordinate } from '../../domain/coordinates'
import { getMineralShape } from '../../domain/minerals'
import type { GuessPlacement, MineralId } from '../../domain/minerals'

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
  const placement = guess.find(
    (guessPlacement) => guessPlacement.mineralId === mineralId,
  )
  const boardOrigin = placement
    ? targetOriginFromClientPoint(boardRect, point, anchor, placement)
    : null

  if (boardOrigin) {
    return { kind: 'board', origin: boardOrigin }
  }

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
  point: ClientPoint,
  anchor: PieceMovementAnchor,
  placement: GuessPlacement,
): Coordinate | null {
  const boardPoint = boardPointFromClientPoint(boardRect, point)

  if (!boardPoint) {
    return null
  }

  const origin = {
    column: Math.round(boardPoint.column - anchor.column),
    row: Math.round(boardPoint.row - anchor.row),
  }
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )
  const intersectsBoard =
    origin.column < boardSize.columns &&
    origin.row < boardSize.rows &&
    origin.column + shape.width > 0 &&
    origin.row + shape.height > 0

  return intersectsBoard ? origin : null
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

  return { column, row }
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
