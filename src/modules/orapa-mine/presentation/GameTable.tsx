import { Mic, RotateCcw } from 'lucide-react'
import { useRef } from 'react'
import type { ClueConsistency } from '../application/clueConsistency'
import type { VoiceRecognitionStatus } from '../application/voiceRecognition'
import type { GuessResult } from '../domain/familySolution'
import type { Coordinate } from '../domain/coordinates'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../domain/minerals'
import type { Answer } from '../domain/questions'
import { SolutionBoard } from './board/SolutionBoard'
import { ClueNotebook } from './clues/ClueNotebook'
import { useCluePreview } from './clues/useCluePreview'
import { GlassCase } from './glass/GlassCase'
import { GlassDragPreview } from './glass/GlassPieces'
import { usePieceMovementInteraction } from './glass/usePieceMovementInteraction'
import styles from './GameTable.module.css'
import { LightControls } from './light/LightControls'
import { SolutionSubmission } from './solution/SolutionSubmission'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export type GameTableProps = Readonly<{
  clues: Readonly<{
    answers: ReadonlyArray<Answer>
    consistency: ClueConsistency
    currentAnswer: Answer | null
    edgeAnswers: ReadonlyMap<string, RayAnswer>
    onAskEdge: (edgeLabel: string) => void
  }>
  familySolution: Readonly<{
    guess: ReadonlyArray<GuessPlacement>
    onFlip: (mineralId: MineralId) => void
    onPlace: (mineralId: MineralId, origin: Coordinate) => void
    onRemove: (mineralId: MineralId) => void
    onReset: () => void
    onRotate: (mineralId: MineralId) => void
    onSelect: (mineralId: MineralId) => void
    onSubmit: () => void
    result: GuessResult | null
    selectedMineralId: MineralId
  }>
  light: Readonly<{
    allRays: ReadonlyArray<RayAnswer>
    currentRay: RayAnswer | null
    onShowAllRaysChange: (visible: boolean) => void
    onShowCurrentRayChange: (visible: boolean) => void
    showAllRays: boolean
    showCurrentRay: boolean
  }>
  puzzle: Readonly<{
    showSolution: boolean
    solutionPlacements: ReadonlyArray<MineralPlacement>
  }>
  voice: Readonly<{
    onStart: () => void
    status: VoiceRecognitionStatus
  }>
}>

export function GameTable({
  clues,
  familySolution,
  light,
  puzzle,
  voice,
}: GameTableProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const cluePreview = useCluePreview(clues.answers)
  const movement = usePieceMovementInteraction({
    boardRef,
    guess: familySolution.guess,
    onPlace: familySolution.onPlace,
    onRemove: familySolution.onRemove,
    onSelect: familySolution.onSelect,
  })
  const currentAnswerRay =
    clues.currentAnswer?.mode === 'edge' ? clues.currentAnswer : null
  const activeAnswer = cluePreview.previewedAnswer ?? currentAnswerRay
  const draggedPlacement = movement.movementState
    ? familySolution.guess.find(
        (placement) =>
          placement.mineralId === movement.movementState?.mineralId,
      )
    : null

  return (
    <aside
      className={styles.panel}
      onPointerCancel={movement.cancelActiveMovement}
    >
      <div className={styles.heading}>
        <div className={styles.headingActions}>
          <button
            aria-label="Speak"
            className={voice.status === 'listening' ? styles.listening : ''}
            onClick={voice.onStart}
            title={voice.status === 'error' ? 'Voice unavailable' : 'Speak'}
            type="button"
          >
            <Mic size={17} />
          </button>
          <button
            aria-label="Reset solution"
            onClick={familySolution.onReset}
            type="button"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <div className={styles.playSurface}>
        <SolutionBoard
          activeAnswer={activeAnswer}
          allRays={light.allRays}
          boardRef={boardRef}
          currentRay={light.currentRay}
          edgeAnswers={clues.edgeAnswers}
          guess={familySolution.guess}
          movement={movement}
          onAskEdge={clues.onAskEdge}
          onClearAnswerPreview={cluePreview.clearPreview}
          onFlip={familySolution.onFlip}
          onPreviewAnswer={cluePreview.previewAnswer}
          onRotate={familySolution.onRotate}
          onSelect={familySolution.onSelect}
          selectedMineralId={familySolution.selectedMineralId}
          showAllRays={light.showAllRays}
          showCurrentRay={light.showCurrentRay}
          showSolution={puzzle.showSolution}
          solutionPlacements={puzzle.solutionPlacements}
        />

        <div className={styles.sideRail}>
          <GlassCase
            guess={familySolution.guess}
            movement={movement}
            onFlip={familySolution.onFlip}
            onRemove={familySolution.onRemove}
            onRotate={familySolution.onRotate}
            selectedMineralId={familySolution.selectedMineralId}
          />

          <div className={styles.statusRail}>
            <LightControls
              hasCurrentRay={light.currentRay !== null}
              onShowAllRaysChange={light.onShowAllRaysChange}
              onShowCurrentRayChange={light.onShowCurrentRayChange}
              showAllRays={light.showAllRays}
              showCurrentRay={light.showCurrentRay}
            />
            <ClueNotebook
              answers={clues.answers}
              consistency={clues.consistency}
              currentAnswer={clues.currentAnswer}
              currentRayPreview={light.currentRay}
              onClearPreview={cluePreview.clearPreview}
              onPreview={cluePreview.previewAnswer}
              previewedAnswerId={cluePreview.previewedAnswerId}
            />
            <SolutionSubmission
              onSubmit={familySolution.onSubmit}
              result={familySolution.result}
            />
          </div>
        </div>
      </div>

      {movement.movementState && draggedPlacement ? (
        <GlassDragPreview
          boardRef={boardRef}
          movementState={movement.movementState}
          placement={draggedPlacement}
        />
      ) : null}
    </aside>
  )
}
