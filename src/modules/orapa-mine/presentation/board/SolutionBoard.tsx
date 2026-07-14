import type { RefObject } from 'react'
import { boardSize } from '../../domain/coordinates'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../../domain/minerals'
import type { Answer } from '../../domain/questions'
import {
  PlacementGhost,
  PlacedPiece,
  SolutionPiece,
} from '../glass/GlassPieces'
import glassStyles from '../glass/Glass.module.css'
import type { usePieceMovementInteraction } from '../glass/usePieceMovementInteraction'
import layoutStyles from '../GameTable.module.css'
import { LightPaths } from '../light/LightPaths'
import { EdgePortGroup } from './EdgePorts'
import styles from './SolutionBoard.module.css'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>
type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function SolutionBoard({
  activeAnswer,
  allRays,
  boardRef,
  edgeAnswers,
  guess,
  movement,
  onAskEdge,
  onClearAnswerPreview,
  onFlip,
  onPreviewAnswer,
  onRotate,
  onSelect,
  selectedMineralId,
  showAllRays,
  showCurrentRay,
  showSolution,
  solutionPlacements,
  currentRay,
}: Readonly<{
  activeAnswer: RayAnswer | null
  allRays: ReadonlyArray<RayAnswer>
  boardRef: RefObject<HTMLDivElement | null>
  currentRay: RayAnswer | null
  edgeAnswers: ReadonlyMap<string, RayAnswer>
  guess: ReadonlyArray<GuessPlacement>
  movement: MovementInteraction
  onAskEdge: (edgeLabel: string) => void
  onClearAnswerPreview: () => void
  onFlip: (mineralId: MineralId) => void
  onPreviewAnswer: (answer: Answer) => void
  onRotate: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
  selectedMineralId: MineralId
  showAllRays: boolean
  showCurrentRay: boolean
  showSolution: boolean
  solutionPlacements: ReadonlyArray<MineralPlacement>
}>) {
  const draggedPlacement = movement.movementState
    ? guess.find(
        (placement) =>
          placement.mineralId === movement.movementState?.mineralId,
      )
    : null
  const edgeProps = {
    activeAnswer,
    answers: edgeAnswers,
    onAsk: onAskEdge,
    onClearPreview: onClearAnswerPreview,
    onPreview: onPreviewAnswer,
  }

  return (
    <div className={layoutStyles.boardColumn}>
      <div className={styles.gridShell} aria-label="Family solution board">
        <span className={styles.corner} />
        <EdgePortGroup {...edgeProps} side="top" />
        <span className={styles.corner} />

        <EdgePortGroup {...edgeProps} side="left" />

        <div
          className={styles.boardSurface}
          onClick={movement.dropPickedPiece}
          ref={boardRef}
        >
          <div className={styles.cellLayer}>
            {Array.from({ length: boardSize.rows }, (_rowValue, row) =>
              Array.from(
                { length: boardSize.columns },
                (_columnValue, column) => (
                  <span
                    aria-hidden="true"
                    className={styles.cell}
                    key={`${column}:${row}`}
                  />
                ),
              ),
            )}
          </div>

          <LightPaths
            allRays={allRays}
            currentRay={currentRay}
            showAllRays={showAllRays}
            showCurrentRay={showCurrentRay}
          />

          {movement.movementState?.target?.kind === 'board' &&
          draggedPlacement ? (
            <PlacementGhost
              origin={movement.movementState.target.origin}
              placement={draggedPlacement}
            />
          ) : null}

          <div className={glassStyles.pieceLayer}>
            {showSolution
              ? solutionPlacements.map((placement) => (
                  <SolutionPiece
                    key={`solution-${placement.mineralId}`}
                    placement={placement}
                  />
                ))
              : null}
            {guess.map((placement) =>
              placement.origin ? (
                <PlacedPiece
                  isDragging={
                    movement.movementState?.mineralId === placement.mineralId
                  }
                  isSelected={placement.mineralId === selectedMineralId}
                  key={placement.mineralId}
                  movement={movement}
                  onFlip={onFlip}
                  onRotate={onRotate}
                  onSelect={onSelect}
                  placement={placement}
                />
              ) : null,
            )}
          </div>
        </div>

        <EdgePortGroup {...edgeProps} side="right" />

        <span className={styles.corner} />
        <EdgePortGroup {...edgeProps} side="bottom" />
        <span className={styles.corner} />
      </div>
    </div>
  )
}
