import type { RefObject } from 'react'
import { boardSize } from '../../domain/coordinates'
import type { EdgeConnection } from '../../domain/edgeConnections'
import type { PlacementAssessment } from '../../domain/familySolution'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../../domain/minerals'
import type { Answer } from '../../domain/questions'
import type { CluePreviewSource } from '../clues/useClueInspection'
import {
  PlacementGhost,
  PlacedPiece,
  SolutionPiece,
  SubmittedGuessPiece,
} from '../glass/GlassPieces'
import glassStyles from '../glass/Glass.module.css'
import type { usePieceMovementInteraction } from '../glass/usePieceMovementInteraction'
import layoutStyles from '../GameTable.module.css'
import { LightPaths } from '../light/LightPaths'
import type { ActiveLight } from '../light/lightActivity'
import type { RayShot } from '../light/useRayShot'
import { EdgePortGroup } from './EdgePorts'
import styles from './SolutionBoard.module.css'

type MovementInteraction = ReturnType<typeof usePieceMovementInteraction>
type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function SolutionBoard({
  activeLight,
  boardRef,
  edgeAnswers,
  guess,
  movement,
  onAskEdge,
  onClearAnswerPreview,
  onClearAnswerSelection,
  onFlip,
  onPreviewAnswer,
  onRemove,
  onRotate,
  onSelectAnswer,
  onShotComplete,
  onShootEdge,
  placementAssessments,
  rayConnections,
  rayShot,
  selectedMineralId,
  showAllRays,
  showCurrentRay,
  showSubmittedComparison,
  showSolution,
  solutionPlacements,
  currentRay,
}: Readonly<{
  activeLight: ActiveLight | null
  boardRef: RefObject<HTMLDivElement | null>
  currentRay: RayAnswer | null
  edgeAnswers: ReadonlyMap<string, RayAnswer>
  guess: ReadonlyArray<GuessPlacement>
  movement: MovementInteraction
  onAskEdge: (edgeLabel: string) => void
  onClearAnswerPreview: (source: CluePreviewSource) => void
  onClearAnswerSelection: () => void
  onFlip: (mineralId: MineralId) => void
  onPreviewAnswer: (answer: Answer, source: CluePreviewSource) => void
  onRemove: (mineralId: MineralId) => void
  onRotate: (mineralId: MineralId) => void
  onSelectAnswer: (answer: RayAnswer) => void
  onShotComplete: (sequence: number) => void
  onShootEdge: (edgeLabel: string) => void
  placementAssessments: ReadonlyMap<MineralId, PlacementAssessment>
  rayConnections: ReadonlyArray<EdgeConnection>
  rayShot: RayShot | null
  selectedMineralId: MineralId
  showAllRays: boolean
  showCurrentRay: boolean
  showSubmittedComparison: boolean
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
    activeLight,
    answers: edgeAnswers,
    onAsk: onAskEdge,
    onClearPreview: onClearAnswerPreview,
    onClearSelection: onClearAnswerSelection,
    onPreview: onPreviewAnswer,
    onSelect: onSelectAnswer,
    onShoot: onShootEdge,
  }

  return (
    <div className={layoutStyles.boardColumn}>
      <div className={styles.gridShell} aria-label="Family solution board">
        <span className={styles.corner} />
        <EdgePortGroup {...edgeProps} side="top" />
        <span className={styles.corner} />

        <EdgePortGroup {...edgeProps} side="left" />

        <div
          aria-keyshortcuts="B ArrowUp ArrowRight ArrowDown ArrowLeft Enter Space Escape R F Delete Backspace"
          aria-label={
            movement.movementInput === 'keyboard' && draggedPlacement
              ? `Place ${draggedPlacement.mineralId} on family solution board`
              : 'Family solution board'
          }
          className={styles.boardSurface}
          data-keyboard-movement={
            movement.movementInput === 'keyboard' ? 'true' : undefined
          }
          data-testid="solution-board-surface"
          onClick={movement.dropPickedPiece}
          ref={boardRef}
          tabIndex={0}
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
            connections={rayConnections}
            currentRay={currentRay}
            onShotComplete={onShotComplete}
            rayShot={rayShot}
            showAllRays={showAllRays}
            showCurrentRay={showCurrentRay}
          />

          {movement.movementState?.target?.kind === 'board' &&
          draggedPlacement ? (
            <PlacementGhost
              assessment={placementAssessments.get(draggedPlacement.mineralId)}
              origin={movement.movementState.target.origin}
              placement={draggedPlacement}
            />
          ) : null}

          <div className={glassStyles.pieceLayer}>
            {showSubmittedComparison
              ? guess.map((placement) => (
                  <SubmittedGuessPiece
                    key={`submitted-${placement.mineralId}`}
                    placement={placement}
                  />
                ))
              : null}
            {showSolution
              ? solutionPlacements.map((placement) => (
                  <SolutionPiece
                    isComparison={showSubmittedComparison}
                    key={`solution-${placement.mineralId}`}
                    placement={placement}
                  />
                ))
              : null}
            {!showSubmittedComparison
              ? guess.map((placement) =>
                  placement.origin ? (
                    <PlacedPiece
                      isDragging={
                        movement.movementState?.mineralId ===
                        placement.mineralId
                      }
                      isSelected={placement.mineralId === selectedMineralId}
                      key={placement.mineralId}
                      movement={movement}
                      onFlip={onFlip}
                      onRemove={onRemove}
                      onRotate={onRotate}
                      placement={placement}
                      assessment={placementAssessments.get(placement.mineralId)}
                    />
                  ) : null,
                )
              : null}
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
