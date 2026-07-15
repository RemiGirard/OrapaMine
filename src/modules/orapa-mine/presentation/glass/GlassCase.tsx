import { RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { minerals } from '../../domain/minerals'
import type { GuessPlacement, MineralId } from '../../domain/minerals'
import layoutStyles from '../GameTable.module.css'
import { PieceShape } from '../PieceShape'
import styles from './Glass.module.css'
import {
  glassCaseCavityLayout,
  glassCasePieceLayout,
  glassCaseSlotLayout,
} from './glassCaseLayout'
import type { GlassCasePieceLayout } from './glassCaseLayout'
import { RotatingPieceShape } from './RotatingPieceShape'
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
        aria-keyshortcuts="G"
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
  const slotLayout = glassCaseSlotLayout(placement.mineralId)
  const cavityLayout = glassCaseCavityLayout(placement.mineralId)
  const pieceLayout = glassCasePieceLayout(placement)

  return (
    <div
      className={[
        styles.stackSlot,
        isSelected ? styles.selectedStackSlot : '',
        isPlaced ? styles.usedStackSlot : '',
        isDragged ? styles.draggingStackSlot : '',
        isReturnTarget ? styles.returnTargetStackSlot : '',
      ].join(' ')}
      data-stack-height={slotLayout.height}
      data-stack-mineral-id={placement.mineralId}
      data-stack-width={slotLayout.width}
      style={{
        gridColumn: `${slotLayout.column + 1} / span ${slotLayout.width}`,
        gridRow: `${slotLayout.row + 1} / span ${slotLayout.height}`,
      }}
    >
      <div
        aria-hidden="true"
        className={styles.stackCavity}
        data-stack-cavity-mineral-id={placement.mineralId}
        style={caseItemStyle(cavityLayout)}
      >
        <PieceShape
          className={styles.stackCavityShape}
          face="front"
          mineralId={placement.mineralId}
          orientation={mineral.defaultOrientation}
        />
      </div>
      {isPlaced ? (
        <button
          aria-label={`Return ${mineral.name} to stack`}
          className={styles.stackResetButton}
          data-glass-control
          data-selected={isSelected ? 'true' : undefined}
          onClick={(event) => {
            event.stopPropagation()
            onRemove(placement.mineralId)
          }}
          onMouseDown={(event) => event.stopPropagation()}
          style={caseItemStyle(cavityLayout)}
          title={`Return ${mineral.name}`}
          type="button"
        >
          <RotateCcw size={18} />
        </button>
      ) : (
        <button
          aria-keyshortcuts="Enter Space R F"
          aria-label={`Move ${mineral.name}`}
          className={styles.stackPieceButton}
          data-glass-control
          data-selected={isSelected ? 'true' : undefined}
          data-testid={`toolbox-piece-${placement.mineralId}`}
          style={caseItemStyle(pieceLayout)}
          onClick={(event) => {
            movement.pickPieceFromClick(
              event,
              placement,
              movement.stackDragAnchor(placement),
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
          onMouseDown={(event) =>
            movement.startMovingPieceWithMouse(
              event,
              placement,
              movement.stackDragAnchor(placement),
            )
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              return
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
          onKeyUp={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
              movement.startMovingPieceWithKeyboard(placement)
            }
          }}
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
          <RotatingPieceShape
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

function caseItemStyle(layout: GlassCasePieceLayout): CSSProperties {
  return {
    height: `${layout.heightPercent}%`,
    left: `${layout.leftPercent}%`,
    top: `${layout.topPercent}%`,
    width: `${layout.widthPercent}%`,
  }
}
