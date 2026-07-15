import type { CSSProperties, RefObject } from 'react'
import type { PieceMovementSession } from '../../application/pieceMovement'
import { boardSize, formatGridCoordinate } from '../../domain/coordinates'
import type { Coordinate } from '../../domain/coordinates'
import type {
  PlacementAssessment,
  PlacementIssue,
} from '../../domain/familySolution'
import { getMineralShape, minerals } from '../../domain/minerals'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../../domain/minerals'
import styles from './Glass.module.css'
import { PieceShape } from '../PieceShape'
import { RotatingPieceShape } from './RotatingPieceShape'
import type { usePieceMovementInteraction } from './usePieceMovementInteraction'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>

export function SolutionPiece({
  isComparison = false,
  placement,
}: Readonly<{ isComparison?: boolean; placement: MineralPlacement }>) {
  const orientation =
    placement.orientation ?? minerals[placement.mineralId].defaultOrientation
  const face = placement.face ?? 'front'
  const shape = getMineralShape(placement.mineralId, orientation, face)
  const mineral = minerals[placement.mineralId]

  return (
    <span
      className={[
        styles.solutionPiece,
        isComparison ? styles.comparisonSolutionPiece : '',
      ].join(' ')}
      data-solution-display={isComparison ? 'comparison' : 'preview'}
      data-testid={`solution-piece-${placement.mineralId}`}
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

export function SubmittedGuessPiece({
  placement,
}: Readonly<{ placement: GuessPlacement }>) {
  if (!placement.origin) {
    return null
  }

  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return (
    <span
      aria-hidden="true"
      className={styles.submittedGuessPiece}
      data-submitted-guess-backdrop="true"
      data-testid={`submitted-guess-${placement.mineralId}`}
      style={placementStyle(placement.origin, shape.width, shape.height)}
    >
      <PieceShape
        className={styles.submittedGuessShape}
        face={placement.face}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
    </span>
  )
}

export function PlacementGhost({
  assessment,
  placement,
  origin,
}: Readonly<{
  assessment: PlacementAssessment | undefined
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
      data-placement-state={assessment?.valid === false ? 'invalid' : 'valid'}
      className={[
        styles.placementGhost,
        assessment?.valid === false ? styles.invalidPlacementGhost : '',
      ].join(' ')}
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
  assessment,
  isDragging,
  isSelected,
  movement,
  onFlip,
  onRotate,
  onSelect,
  placement,
}: Readonly<{
  assessment: PlacementAssessment | undefined
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
  const issueDescription = placementIssueDescription(assessment?.issues ?? [])
  const accessiblePlacement = `${mineral.name} at ${formatGridCoordinate(placement.origin)}`

  return (
    <div
      aria-invalid={assessment?.valid === false ? true : undefined}
      aria-label={
        issueDescription
          ? `${accessiblePlacement}, invalid placement: ${issueDescription}`
          : accessiblePlacement
      }
      className={[
        styles.placedPiece,
        isSelected ? styles.selectedPlacedPiece : '',
        isDragging ? styles.draggingPlacedPiece : '',
        assessment?.valid === false ? styles.invalidPlacedPiece : '',
      ].join(' ')}
      data-placement-state={assessment?.valid === false ? 'invalid' : 'valid'}
      data-testid={`placed-piece-${placement.mineralId}`}
      onClick={(event) => {
        if (movement.movementState) {
          movement.dropPickedPiece(event)
          return
        }

        movement.pickPieceFromClick(
          event,
          placement,
          movement.placedDragAnchorFromClientPoint(
            event.clientX,
            event.clientY,
            placement,
          ),
        )
      }}
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
      onMouseDown={(event) => {
        if (movement.movementState) {
          event.preventDefault()
          event.stopPropagation()
          return
        }

        movement.startMovingPieceWithMouse(
          event,
          placement,
          movement.placedMouseDragAnchor(event, placement),
        )
      }}
      onPointerCancel={() => movement.cancelMovingPiece(placement.mineralId)}
      onPointerDown={(event) => {
        if (movement.movementState) {
          event.preventDefault()
          event.stopPropagation()
          return
        }

        movement.startMovingPiece(
          event,
          placement,
          movement.placedPointerDragAnchor(event, placement),
        )
      }}
      role="button"
      style={placementStyle(placement.origin, shape.width, shape.height)}
      tabIndex={0}
      title={
        issueDescription
          ? `${mineral.name} - ${placement.orientation}, ${placement.face}. Invalid: ${issueDescription}`
          : `${mineral.name} - ${placement.orientation}, ${placement.face}`
      }
    >
      <RotatingPieceShape
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
  isInvalid,
  movementState,
  placement,
}: Readonly<{
  boardRef: RefObject<HTMLDivElement | null>
  isInvalid: boolean
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
      className={[
        styles.dragPreview,
        isInvalid ? styles.invalidDragPreview : '',
      ].join(' ')}
      data-glass-drag-preview="true"
      data-placement-state={isInvalid ? 'invalid' : 'valid'}
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

function placementIssueDescription(issues: ReadonlyArray<PlacementIssue>) {
  return issues
    .map((issue) =>
      issue === 'outside-board'
        ? 'outside the board'
        : 'overlaps another piece',
    )
    .join(' and ')
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
