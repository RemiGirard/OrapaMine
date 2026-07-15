import { Mic, RotateCcw, Shuffle } from 'lucide-react'
import { useMemo, useRef } from 'react'
import type { VoiceRecognitionStatus } from '../application/voiceRecognition'
import type { SolutionSubmissionReadiness } from '../application/solutionSubmission'
import {
  assessGuessPlacements,
  moveGuessMineral,
} from '../domain/familySolution'
import type { GuessResult } from '../domain/familySolution'
import type { Coordinate } from '../domain/coordinates'
import {
  edgeAnswersShareConnection,
  edgeConnectionsFrom,
} from '../domain/edgeConnections'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../domain/minerals'
import type { Answer } from '../domain/questions'
import { SolutionBoard } from './board/SolutionBoard'
import { ClueNotebook } from './clues/ClueNotebook'
import { useClueInspection } from './clues/useClueInspection'
import { GlassCase } from './glass/GlassCase'
import { GlassDragPreview } from './glass/GlassPieces'
import { usePieceMovementInteraction } from './glass/usePieceMovementInteraction'
import styles from './GameTable.module.css'
import { useGameKeyboardControls } from './keyboard/useGameKeyboardControls'
import { LightControls } from './light/LightControls'
import { resolveActiveLight } from './light/lightActivity'
import { isVisibleRay } from './light/lightVisibility'
import { useRayShot } from './light/useRayShot'
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
    readiness: SolutionSubmissionReadiness
    result: GuessResult | null
    selectedMineralId: MineralId
  }>
  light: Readonly<{
    currentRay: RayAnswer | null
    onShowAllRaysChange: (visible: boolean) => void
    onShowCurrentRayChange: (visible: boolean) => void
    raysByPort: ReadonlyMap<string, RayAnswer>
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
  const clueInspection = useClueInspection(clues.answers)
  const movement = usePieceMovementInteraction({
    boardRef,
    guess: familySolution.guess,
    onPlace: familySolution.onPlace,
    onRemove: familySolution.onRemove,
    onSelect: familySolution.onSelect,
  })
  const rayConnections = useMemo(
    () => edgeConnectionsFrom(light.raysByPort.values()),
    [light.raysByPort],
  )
  const rayShot = useRayShot(light.raysByPort)
  const currentAnswerRay =
    clues.currentAnswer?.mode === 'edge' ? clues.currentAnswer : null
  const inspectedClue = clueInspection.activeAnswer ?? currentAnswerRay
  const inspectedRay = useMemo(() => {
    if (!inspectedClue) {
      return light.currentRay
    }

    return (
      light.raysByPort.get(inspectedClue.query) ??
      (light.currentRay?.query === inspectedClue.query
        ? light.currentRay
        : null)
    )
  }, [inspectedClue, light.currentRay, light.raysByPort])
  const verifiedInspectedRay = useMemo(() => {
    if (!inspectedClue || !inspectedRay) {
      return inspectedRay
    }

    return edgeAnswersShareConnection(inspectedClue, inspectedRay)
      ? inspectedRay
      : null
  }, [inspectedClue, inspectedRay])
  const activeLight = resolveActiveLight({
    inspectedClue,
    rayShot: rayShot.rayShot,
    showVerifiedRay: light.showCurrentRay,
    verifiedRay: verifiedInspectedRay,
  })
  const hasCurrentRay = isVisibleRay(verifiedInspectedRay)

  useGameKeyboardControls({
    boardRef,
    hasCurrentRay,
    movement,
    onFlip: familySolution.onFlip,
    onRotate: familySolution.onRotate,
    onShowAllRaysChange: light.onShowAllRaysChange,
    onShowCurrentRayChange: light.onShowCurrentRayChange,
    onSubmit: familySolution.onSubmit,
    readiness: familySolution.readiness,
    showAllRays: light.showAllRays,
    showCurrentRay: light.showCurrentRay,
  })

  const draggedPlacement = movement.movementState
    ? familySolution.guess.find(
        (placement) =>
          placement.mineralId === movement.movementState?.mineralId,
      )
    : null
  const interactionGuess = useMemo(() => {
    const target = movement.movementState?.target

    return target?.kind === 'board' && movement.movementState
      ? moveGuessMineral(
          familySolution.guess,
          movement.movementState.mineralId,
          target.origin,
        )
      : familySolution.guess
  }, [familySolution.guess, movement.movementState])
  const placementAssessments = useMemo(
    () => assessGuessPlacements(interactionGuess),
    [interactionGuess],
  )

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
            hasCurrentRay={hasCurrentRay}
            onShowAllRaysChange={light.onShowAllRaysChange}
            onShowCurrentRayChange={light.onShowCurrentRayChange}
            showAllRays={light.showAllRays}
            showCurrentRay={light.showCurrentRay}
          />
          <span aria-hidden="true" className={styles.controlDivider} />
          <div className={styles.headingActions}>
            <button
              aria-label="New puzzle"
              onClick={() => {
                movement.cancelActiveMovement()
                puzzle.onNext()
              }}
              title="New puzzle"
              type="button"
            >
              <Shuffle size={17} />
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
              onClick={() => {
                movement.cancelActiveMovement()
                familySolution.onReset()
              }}
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
          activeLight={activeLight}
          boardRef={boardRef}
          currentRay={verifiedInspectedRay}
          edgeAnswers={clues.edgeAnswers}
          guess={familySolution.guess}
          movement={movement}
          onAskEdge={clues.onAskEdge}
          onClearAnswerPreview={clueInspection.clearPreview}
          onClearAnswerSelection={clueInspection.clearSelection}
          onFlip={familySolution.onFlip}
          onPreviewAnswer={clueInspection.previewAnswer}
          onRemove={familySolution.onRemove}
          onRotate={familySolution.onRotate}
          onSelectAnswer={clueInspection.selectAnswer}
          onShotComplete={rayShot.completeRayShot}
          onShootEdge={rayShot.shootRay}
          placementAssessments={placementAssessments}
          rayConnections={rayConnections}
          rayShot={rayShot.rayShot}
          selectedMineralId={familySolution.selectedMineralId}
          showAllRays={light.showAllRays}
          showCurrentRay={light.showCurrentRay}
          showSubmittedComparison={Boolean(
            puzzle.showSolution &&
            familySolution.result &&
            !familySolution.result.solved,
          )}
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
            <SolutionSubmission
              onSubmit={familySolution.onSubmit}
              onToggleSolution={puzzle.onToggleSolution}
              readiness={familySolution.readiness}
              result={familySolution.result}
              showSolution={puzzle.showSolution}
            />
            <ClueNotebook
              answers={clues.answers}
              onClearPreview={clueInspection.clearPreview}
              onPreview={clueInspection.previewAnswer}
              onShootEdge={rayShot.shootRay}
              previewedAnswerId={clueInspection.activeAnswerId}
            />
          </div>
        </div>
      </div>

      {movement.movementState && draggedPlacement ? (
        <GlassDragPreview
          boardRef={boardRef}
          isInvalid={
            placementAssessments.get(draggedPlacement.mineralId)?.valid ===
            false
          }
          movementState={movement.movementState}
          placement={draggedPlacement}
        />
      ) : null}
    </aside>
  )
}
