import { Eye, EyeOff, Mic, RotateCcw, Shuffle } from 'lucide-react'
import { useRef } from 'react'
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
    onNext: () => void
    onToggleSolution: () => void
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
      <header className={styles.gameHeader}>
        <h1 className={styles.title}>Orapa Mine</h1>
        <div
          aria-label="Game options"
          className={styles.controlBar}
          role="toolbar"
        >
          <LightControls
            hasCurrentRay={light.currentRay !== null}
            onShowAllRaysChange={light.onShowAllRaysChange}
            onShowCurrentRayChange={light.onShowCurrentRayChange}
            showAllRays={light.showAllRays}
            showCurrentRay={light.showCurrentRay}
          />
          <span aria-hidden="true" className={styles.controlDivider} />
          <div className={styles.headingActions}>
            <button
              aria-label="New puzzle"
              onClick={puzzle.onNext}
              title="New puzzle"
              type="button"
            >
              <Shuffle size={17} />
            </button>
            <button
              aria-label={
                puzzle.showSolution ? 'Hide solution' : 'Reveal solution'
              }
              aria-pressed={puzzle.showSolution}
              onClick={puzzle.onToggleSolution}
              title={puzzle.showSolution ? 'Hide solution' : 'Reveal solution'}
              type="button"
            >
              {puzzle.showSolution ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
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
              title="Reset solution"
              type="button"
            >
              <RotateCcw size={17} />
            </button>
          </div>
        </div>
      </header>

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
            <ClueNotebook
              answers={clues.answers}
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
