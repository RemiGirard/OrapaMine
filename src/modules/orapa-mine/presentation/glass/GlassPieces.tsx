import type { CSSProperties, RefObject } from 'react'
import type { PieceMovementSession } from '../../application/pieceMovement'
import { boardSize, formatGridCoordinate } from '../../domain/coordinates'
import type { Coordinate } from '../../domain/coordinates'
import { getMineralShape, minerals } from '../../domain/minerals'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../../domain/minerals'
import styles from './Glass.module.css'
import { PieceShape } from '../PieceShape'
import type { usePieceMovementInteraction } from './usePieceMovementInteraction'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>

export function SolutionPiece({
  placement,
}: Readonly<{ placement: MineralPlacement }>) {
  const orientation =
    placement.orientation ?? minerals[placement.mineralId].defaultOrientation
  const face = placement.face ?? 'front'
  const shape = getMineralShape(placement.mineralId, orientation, face)
  const mineral = minerals[placement.mineralId]

  return (
    <span
      className={styles.solutionPiece}
      style={placementStyle(placement.origin, shape.width, shape.height)}
      title={`${mineral.name} solution`}
    >
      <PieceShape
        className={styles.solutionShape}
        face={face}
        mineralId={placement.mineralId}
        orientation={orientation}
      />
    </span>
  )
}

export function PlacementGhost({
  placement,
  origin,
}: Readonly<{
  placement: GuessPlacement
  origin: Coordinate
}>) {
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return (
    <span
      data-placement-ghost="true"
      className={styles.placementGhost}
      style={placementStyle(origin, shape.width, shape.height)}
    >
      <PieceShape
        className={styles.placementGhostShape}
        face={placement.face}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
    </span>
  )
}

export function PlacedPiece({
  isDragging,
  isSelected,
  movement,
  onFlip,
  onRotate,
  onSelect,
  placement,
}: Readonly<{
  isDragging: boolean
  isSelected: boolean
  movement: MovementInteraction
  onFlip: (mineralId: MineralId) => void
  onRotate: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
  placement: GuessPlacement
}>) {
  if (!placement.origin) {
    return null
  }

  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )
  const mineral = minerals[placement.mineralId]

  return (
    <div
      aria-label={`${mineral.name} at ${formatGridCoordinate(placement.origin)}`}
      className={[
        styles.placedPiece,
        isSelected ? styles.selectedPlacedPiece : '',
        isDragging ? styles.draggingPlacedPiece : '',
      ].join(' ')}
      data-testid={`placed-piece-${placement.mineralId}`}
      onClick={(event) =>
        movement.pickPieceFromClick(
          event,
          placement,
          movement.placedDragAnchorFromClientPoint(
            event.clientX,
            event.clientY,
            placement,
          ),
        )
      }
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onFlip(placement.mineralId)
      }}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (event.shiftKey) {
          onFlip(placement.mineralId)
          return
        }

        onRotate(placement.mineralId)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(placement.mineralId)
        }

        if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          onRotate(placement.mineralId)
        }

        if (event.key.toLowerCase() === 'f') {
          event.preventDefault()
          onFlip(placement.mineralId)
        }
      }}
      onMouseDown={(event) =>
        movement.startMovingPieceWithMouse(
          event,
          placement,
          movement.placedMouseDragAnchor(event, placement),
        )
      }
      onPointerCancel={() => movement.cancelMovingPiece(placement.mineralId)}
      onPointerDown={(event) =>
        movement.startMovingPiece(
          event,
          placement,
          movement.placedPointerDragAnchor(event, placement),
        )
      }
      role="button"
      style={placementStyle(placement.origin, shape.width, shape.height)}
      tabIndex={0}
      title={`${mineral.name} - ${placement.orientation}, ${placement.face}`}
    >
      <PieceShape
        className={styles.placedShape}
        face={placement.face}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
    </div>
  )
}

export function GlassDragPreview({
  boardRef,
  movementState,
  placement,
}: Readonly<{
  boardRef: RefObject<HTMLDivElement | null>
  movementState: PieceMovementSession
  placement: GuessPlacement
}>) {
  const boardRect = boardRef.current?.getBoundingClientRect()
  const cellWidth = boardRect ? boardRect.width / boardSize.columns : 48
  const cellHeight = boardRect ? boardRect.height / boardSize.rows : 48
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )
  const style: CSSProperties & Record<`--drag-${string}`, string> = {
    '--drag-anchor-x': `${(movementState.anchor.column / shape.width) * 100}%`,
    '--drag-anchor-y': `${(movementState.anchor.row / shape.height) * 100}%`,
    '--drag-start-scale': placement.origin ? '0.92' : '0.62',
    height: `${shape.height * cellHeight}px`,
    left: `${movementState.pointer.x - movementState.anchor.column * cellWidth}px`,
    top: `${movementState.pointer.y - movementState.anchor.row * cellHeight}px`,
    width: `${shape.width * cellWidth}px`,
  }

  return (
    <div
      aria-hidden="true"
      className={styles.dragPreview}
      data-glass-drag-preview="true"
      style={style}
    >
      <PieceShape
        className={styles.dragPreviewShape}
        face={placement.face}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
    </div>
  )
}

function placementStyle(
  origin: Coordinate,
  width: number,
  height: number,
): CSSProperties {
  return {
    height: `${(height / boardSize.rows) * 100}%`,
    left: `${(origin.column / boardSize.columns) * 100}%`,
    top: `${(origin.row / boardSize.rows) * 100}%`,
    width: `${(width / boardSize.columns) * 100}%`,
  }
}
