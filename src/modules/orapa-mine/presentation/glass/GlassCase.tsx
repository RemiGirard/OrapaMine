import { RotateCcw } from 'lucide-react'
import { minerals } from '../../domain/minerals'
import type { GuessPlacement, MineralId } from '../../domain/minerals'
import layoutStyles from '../GameTable.module.css'
import { PieceShape } from '../PieceShape'
import styles from './Glass.module.css'
import type { usePieceMovementInteraction } from './usePieceMovementInteraction'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>

export function GlassCase({
  guess,
  movement,
  onFlip,
  onRemove,
  onRotate,
  selectedMineralId,
}: Readonly<{
  guess: ReadonlyArray<GuessPlacement>
  movement: MovementInteraction
  onFlip: (mineralId: MineralId) => void
  onRemove: (mineralId: MineralId) => void
  onRotate: (mineralId: MineralId) => void
  selectedMineralId: MineralId
}>) {
  return (
    <div className={layoutStyles.stackCase}>
      <div className={styles.toolbarHeader}>Glass stack</div>
      <div
        className={styles.pieceStack}
        aria-label="Glass piece stack"
        onClick={movement.dropPickedPiece}
      >
        {guess.map((placement) => (
          <GlassCaseSlot
            isSelected={placement.mineralId === selectedMineralId}
            key={placement.mineralId}
            movement={movement}
            onFlip={onFlip}
            onRemove={onRemove}
            onRotate={onRotate}
            placement={placement}
          />
        ))}
      </div>
    </div>
  )
}

function GlassCaseSlot({
  isSelected,
  movement,
  onFlip,
  onRemove,
  onRotate,
  placement,
}: Readonly<{
  isSelected: boolean
  movement: MovementInteraction
  onFlip: (mineralId: MineralId) => void
  onRemove: (mineralId: MineralId) => void
  onRotate: (mineralId: MineralId) => void
  placement: GuessPlacement
}>) {
  const mineral = minerals[placement.mineralId]
  const isPlaced = placement.origin !== null
  const isDragged = movement.movementState?.mineralId === placement.mineralId
  const isReturnTarget =
    isDragged && movement.movementState?.target?.kind === 'stack'

  return (
    <div
      className={[
        styles.stackSlot,
        isSelected ? styles.selectedStackSlot : '',
        isPlaced ? styles.usedStackSlot : '',
        isDragged ? styles.draggingStackSlot : '',
        isReturnTarget ? styles.returnTargetStackSlot : '',
      ].join(' ')}
      data-stack-mineral-id={placement.mineralId}
    >
      {isPlaced ? (
        <button
          aria-label={`Return ${mineral.name} to stack`}
          className={styles.stackResetButton}
          onClick={(event) => {
            event.stopPropagation()
            onRemove(placement.mineralId)
          }}
          onMouseDown={(event) => event.stopPropagation()}
          title={`Return ${mineral.name}`}
          type="button"
        >
          <PieceShape
            className={styles.stackGhostShape}
            face={placement.face}
            mineralId={placement.mineralId}
            orientation={placement.orientation}
          />
          <RotateCcw size={18} />
        </button>
      ) : (
        <button
          aria-label={`Move ${mineral.name}`}
          className={styles.stackPieceButton}
          onClick={(event) =>
            movement.pickPieceFromClick(
              event,
              placement,
              movement.stackDragAnchor(placement),
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
          onMouseDown={(event) =>
            movement.startMovingPieceWithMouse(
              event,
              placement,
              movement.stackDragAnchor(placement),
            )
          }
          onPointerCancel={() =>
            movement.cancelMovingPiece(placement.mineralId)
          }
          onPointerDown={(event) =>
            movement.startMovingPiece(
              event,
              placement,
              movement.stackDragAnchor(placement),
            )
          }
          title={`${mineral.name} - ${placement.orientation}, ${placement.face}`}
          type="button"
        >
          <PieceShape
            className={styles.stackShape}
            face={placement.face}
            mineralId={placement.mineralId}
            orientation={placement.orientation}
          />
        </button>
      )}
    </div>
  )
}
