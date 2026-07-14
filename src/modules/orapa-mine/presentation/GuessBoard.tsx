import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { useRef, useState } from 'react'
import { Mic, RotateCcw } from 'lucide-react'
import {
  boardSize,
  bottomLabels,
  formatGridCoordinate,
  leftLabels,
  parseEdgePort,
  rightLabels,
  topLabels,
} from '../domain/coordinates'
import type { Coordinate } from '../domain/coordinates'
import {
  canPlaceMineralWithOrientation,
  getMineralShape,
  minerals,
  placementsOverlap,
} from '../domain/minerals'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
} from '../domain/minerals'
import type { Answer } from '../domain/questions'
import { ColorDot } from './ColorDot'
import { PieceShape } from './PieceShape'
import { colorValue } from './colorPalette'
import styles from './GuessBoard.module.css'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult:
    | ((event: {
        results: ArrayLike<{ 0?: { transcript?: string } } | undefined>
      }) => void)
    | null
  start: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window &
  Readonly<{
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }>

type GuessBoardProps = Readonly<{
  answers: ReadonlyArray<Answer>
  currentAnswer: Answer | null
  currentRayPreview: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers: ReadonlyMap<string, Answer>
  guess: ReadonlyArray<GuessPlacement>
  onAskEdge: (edgeLabel: string) => void
  onPlaceSelected: (origin: Coordinate) => void
  onPlace: (mineralId: MineralId, origin: Coordinate) => void
  onRemove: (mineralId: MineralId) => void
  onReset: () => void
  onRotate: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
  onSubmit: () => void
  onToggleLightPath: (showLightPath: boolean) => void
  onVoiceCommand: (transcript: string) => void
  result: {
    solved: boolean
    exactPlacements: number
    totalPlacements: number
  } | null
  selectedMineralId: MineralId
  showLightPath: boolean
  showSolution: boolean
  solutionPlacements: ReadonlyArray<MineralPlacement>
}>

type DragState = Readonly<{
  anchor: {
    column: number
    row: number
  }
  mineralId: MineralId
  pointer: {
    x: number
    y: number
  }
  targetOrigin: Coordinate | null
}>

export function GuessBoard({
  answers,
  currentAnswer,
  currentRayPreview,
  edgeAnswers,
  guess,
  onAskEdge,
  onPlaceSelected,
  onPlace,
  onRemove,
  onReset,
  onRotate,
  onSelect,
  onSubmit,
  onToggleLightPath,
  onVoiceCommand,
  result,
  selectedMineralId,
  showLightPath,
  showSolution,
  solutionPlacements,
}: GuessBoardProps) {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'error'>(
    'idle',
  )
  const [hoveredLogbookAnswerId, setHoveredLogbookAnswerId] = useState<
    number | null
  >(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const draggedPlacement = dragState
    ? guess.find((placement) => placement.mineralId === dragState.mineralId)
    : null
  const hoveredLogbookAnswer =
    answers.find(
      (answer): answer is Extract<Answer, { mode: 'edge' }> =>
        answer.id === hoveredLogbookAnswerId && answer.mode === 'edge',
    ) ?? null
  const activeEdgeLight = hoveredLogbookAnswer ?? currentRayPreview
  const activeRayLabels = new Set(
    activeEdgeLight
      ? [activeEdgeLight.query, activeEdgeLight.exitLabel].filter(
          (label): label is string => Boolean(label),
        )
      : [],
  )
  const activeEmitterLabel = activeEdgeLight?.query
  const activeReceiverLabel = activeEdgeLight?.exitLabel
  const activeRayColor = activeEdgeLight
    ? colorValue(activeEdgeLight.signalColor)
    : undefined

  function listenForVoiceCommand() {
    const speechWindow = window as SpeechWindow
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

    if (!Recognition) {
      setVoiceState('error')
      return
    }

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'
    recognition.onend = () => setVoiceState('idle')
    recognition.onerror = () => setVoiceState('error')
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript

      if (transcript) {
        onVoiceCommand(transcript)
      }
    }
    setVoiceState('listening')
    recognition.start()
  }

  function activeRoleForEdge(label: string) {
    if (label === activeEmitterLabel) {
      return 'emitter'
    }

    if (label === activeReceiverLabel) {
      return 'receiver'
    }

    return null
  }

  function previewLogbookAnswer(answer: Answer) {
    if (answer.mode === 'edge') {
      setHoveredLogbookAnswerId(answer.id)
    }
  }

  function clearLogbookPreview() {
    setHoveredLogbookAnswerId(null)
  }

  function commitDragState(nextDragState: DragState | null) {
    dragStateRef.current = nextDragState
    setDragState(nextDragState)
  }

  function boardPointFromClientPoint(clientX: number, clientY: number) {
    const boardRect = boardRef.current?.getBoundingClientRect()

    if (!boardRect) {
      return null
    }

    const column =
      ((clientX - boardRect.left) / boardRect.width) * boardSize.columns
    const row = ((clientY - boardRect.top) / boardRect.height) * boardSize.rows

    if (
      column < 0 ||
      column > boardSize.columns ||
      row < 0 ||
      row > boardSize.rows
    ) {
      return null
    }

    return { column, row }
  }

  function boardPointFromPointer(event: ReactPointerEvent) {
    return boardPointFromClientPoint(event.clientX, event.clientY)
  }

  function targetOriginFromClientPoint(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
    anchor: DragState['anchor'],
  ) {
    const boardPoint = boardPointFromClientPoint(clientX, clientY)

    if (!boardPoint) {
      return null
    }

    const origin = {
      column: Math.round(boardPoint.column - anchor.column),
      row: Math.round(boardPoint.row - anchor.row),
    }

    return canDropMineral(mineralId, origin) ? origin : null
  }

  function targetOriginFromPointer(
    event: ReactPointerEvent,
    mineralId: MineralId,
    anchor: DragState['anchor'],
  ) {
    return targetOriginFromClientPoint(
      event.clientX,
      event.clientY,
      mineralId,
      anchor,
    )
  }

  function canDropMineral(mineralId: MineralId, origin: Coordinate) {
    const targetPlacement = guess.find(
      (placement) => placement.mineralId === mineralId,
    )

    if (!targetPlacement) {
      return false
    }

    if (
      !canPlaceMineralWithOrientation(
        mineralId,
        origin,
        targetPlacement.orientation,
      )
    ) {
      return false
    }

    const nextPlacements = guess.flatMap<MineralPlacement>((placement) => {
      if (placement.mineralId === mineralId) {
        return [
          {
            mineralId,
            orientation: targetPlacement.orientation,
            origin,
          },
        ]
      }

      return placement.origin
        ? [
            {
              mineralId: placement.mineralId,
              orientation: placement.orientation,
              origin: placement.origin,
            },
          ]
        : []
    })

    return !placementsOverlap(nextPlacements)
  }

  function dragPreviewStyle(
    dragStateValue: DragState,
    placement: GuessPlacement,
  ) {
    const boardRect = boardRef.current?.getBoundingClientRect()
    const cellWidth = boardRect ? boardRect.width / boardSize.columns : 48
    const cellHeight = boardRect ? boardRect.height / boardSize.rows : 48
    const shape = getMineralShape(placement.mineralId, placement.orientation)

    return {
      height: `${shape.height * cellHeight}px`,
      left: `${dragStateValue.pointer.x - dragStateValue.anchor.column * cellWidth}px`,
      top: `${dragStateValue.pointer.y - dragStateValue.anchor.row * cellHeight}px`,
      width: `${shape.width * cellWidth}px`,
    } satisfies CSSProperties
  }

  function stackDragAnchor(placement: GuessPlacement) {
    const shape = getMineralShape(placement.mineralId, placement.orientation)

    return {
      column: shape.width / 2,
      row: shape.height / 2,
    }
  }

  function placedDragAnchor(
    event: ReactPointerEvent,
    placement: GuessPlacement,
  ) {
    const boardPoint = boardPointFromPointer(event)

    if (!boardPoint || !placement.origin) {
      return stackDragAnchor(placement)
    }

    return {
      column: boardPoint.column - placement.origin.column,
      row: boardPoint.row - placement.origin.row,
    }
  }

  function startMovingPiece(
    event: ReactPointerEvent<HTMLElement>,
    placement: GuessPlacement,
    anchor: DragState['anchor'],
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    commitDragState({
      anchor,
      mineralId: placement.mineralId,
      pointer: {
        x: event.clientX,
        y: event.clientY,
      },
      targetOrigin: targetOriginFromPointer(event, placement.mineralId, anchor),
    })
    onSelect(placement.mineralId)
  }

  function movePiecePreview(
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    const currentDragState = dragStateRef.current

    if (currentDragState?.mineralId !== mineralId) {
      return
    }

    event.preventDefault()
    commitDragState({
      ...currentDragState,
      pointer: {
        x: event.clientX,
        y: event.clientY,
      },
      targetOrigin: targetOriginFromPointer(
        event,
        mineralId,
        currentDragState.anchor,
      ),
    })
  }

  function startNativeStackDrag(
    event: ReactDragEvent<HTMLButtonElement>,
    placement: GuessPlacement,
  ) {
    const anchor = stackDragAnchor(placement)
    const transparentDragImage = document.createElement('span')

    transparentDragImage.style.height = '1px'
    transparentDragImage.style.opacity = '0'
    transparentDragImage.style.position = 'fixed'
    transparentDragImage.style.width = '1px'
    document.body.append(transparentDragImage)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', placement.mineralId)
    event.dataTransfer.setDragImage(transparentDragImage, 0, 0)
    window.setTimeout(() => transparentDragImage.remove(), 0)
    commitDragState({
      anchor,
      mineralId: placement.mineralId,
      pointer: {
        x: event.clientX,
        y: event.clientY,
      },
      targetOrigin: targetOriginFromClientPoint(
        event.clientX,
        event.clientY,
        placement.mineralId,
        anchor,
      ),
    })
    onSelect(placement.mineralId)
  }

  function moveNativePiecePreview(event: ReactDragEvent<HTMLElement>) {
    const currentDragState = dragStateRef.current

    if (!currentDragState || (event.clientX === 0 && event.clientY === 0)) {
      return
    }

    event.preventDefault()
    commitDragState({
      ...currentDragState,
      pointer: {
        x: event.clientX,
        y: event.clientY,
      },
      targetOrigin: targetOriginFromClientPoint(
        event.clientX,
        event.clientY,
        currentDragState.mineralId,
        currentDragState.anchor,
      ),
    })
  }

  function finishNativePieceMove(event: ReactDragEvent<HTMLElement>) {
    const currentDragState = dragStateRef.current

    if (!currentDragState) {
      return
    }

    event.preventDefault()
    const targetOrigin =
      event.clientX === 0 && event.clientY === 0
        ? currentDragState.targetOrigin
        : targetOriginFromClientPoint(
            event.clientX,
            event.clientY,
            currentDragState.mineralId,
            currentDragState.anchor,
          )
    commitDragState(null)

    if (targetOrigin) {
      onPlace(currentDragState.mineralId, targetOrigin)
    }
  }

  function cancelNativePieceMove() {
    commitDragState(null)
  }

  function finishMovingPiece(
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    const currentDragState = dragStateRef.current

    if (currentDragState?.mineralId !== mineralId) {
      return
    }

    event.preventDefault()
    const targetOrigin = targetOriginFromPointer(
      event,
      mineralId,
      currentDragState.anchor,
    )
    commitDragState(null)

    if (targetOrigin) {
      onPlace(mineralId, targetOrigin)
    }
  }

  function cancelMovingPiece(mineralId: MineralId) {
    if (dragStateRef.current?.mineralId === mineralId) {
      commitDragState(null)
    }
  }

  function moveActivePiecePreview(event: ReactPointerEvent<HTMLElement>) {
    const activeDragState = dragStateRef.current

    if (activeDragState) {
      movePiecePreview(event, activeDragState.mineralId)
    }
  }

  function finishActivePieceMove(event: ReactPointerEvent<HTMLElement>) {
    const activeDragState = dragStateRef.current

    if (activeDragState) {
      finishMovingPiece(event, activeDragState.mineralId)
    }
  }

  return (
    <aside
      className={styles.panel}
      onPointerCancel={() => commitDragState(null)}
      onPointerMove={moveActivePiecePreview}
      onPointerUp={finishActivePieceMove}
    >
      <div className={styles.heading}>
        <div className={styles.headingActions}>
          <button
            aria-label="Speak"
            className={voiceState === 'listening' ? styles.listening : ''}
            onClick={listenForVoiceCommand}
            title={voiceState === 'error' ? 'Voice unavailable' : 'Speak'}
            type="button"
          >
            <Mic size={17} />
          </button>
          <button aria-label="Reset solution" onClick={onReset} type="button">
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <div className={styles.playSurface}>
        <div className={styles.boardColumn}>
          <div className={styles.gridShell} aria-label="Family solution board">
            <span className={styles.corner} />
            <div className={styles.columnLabels}>
              {topLabels.map((label) => (
                <EdgeButton
                  activeRole={activeRoleForEdge(label)}
                  activeColor={activeRayColor}
                  answer={edgeAnswers.get(label)}
                  isActive={activeRayLabels.has(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>
            <span className={styles.corner} />

            <div className={styles.rowLabels}>
              {leftLabels.map((label) => (
                <EdgeButton
                  activeRole={activeRoleForEdge(label)}
                  activeColor={activeRayColor}
                  answer={edgeAnswers.get(label)}
                  isActive={activeRayLabels.has(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>

            <div
              className={styles.boardSurface}
              onDragOver={moveNativePiecePreview}
              onDrop={finishNativePieceMove}
              ref={boardRef}
            >
              <div className={styles.cellLayer}>
                {Array.from({ length: boardSize.rows }, (_rowValue, row) =>
                  Array.from(
                    { length: boardSize.columns },
                    (_columnValue, column) => {
                      const coordinate = { column, row }

                      return (
                        <button
                          aria-label={`Place ${minerals[selectedMineralId].name} at ${formatGridCoordinate(coordinate)}`}
                          className={styles.cell}
                          key={`${column}:${row}`}
                          onClick={() => onPlaceSelected(coordinate)}
                          type="button"
                        />
                      )
                    },
                  ),
                )}
              </div>

              {currentRayPreview && showLightPath ? (
                <RayOverlay answer={currentRayPreview} />
              ) : null}

              {dragState?.targetOrigin && draggedPlacement ? (
                <PlacementGhost
                  mineralId={draggedPlacement.mineralId}
                  orientation={draggedPlacement.orientation}
                  origin={dragState.targetOrigin}
                />
              ) : null}

              <div className={styles.pieceLayer}>
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
                      isSelected={placement.mineralId === selectedMineralId}
                      isDragging={dragState?.mineralId === placement.mineralId}
                      key={placement.mineralId}
                      onMoveCancel={cancelMovingPiece}
                      onMoveEnd={finishMovingPiece}
                      onMovePreview={movePiecePreview}
                      onMoveStart={(event, piecePlacement) =>
                        startMovingPiece(
                          event,
                          piecePlacement,
                          placedDragAnchor(event, piecePlacement),
                        )
                      }
                      onRotate={onRotate}
                      onSelect={onSelect}
                      placement={placement}
                    />
                  ) : null,
                )}
              </div>
            </div>

            <div className={styles.rightLabels}>
              {rightLabels.map((label) => (
                <EdgeButton
                  activeRole={activeRoleForEdge(label)}
                  activeColor={activeRayColor}
                  answer={edgeAnswers.get(label)}
                  isActive={activeRayLabels.has(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>

            <span className={styles.corner} />
            <div className={styles.bottomLabels}>
              {bottomLabels.map((label) => (
                <EdgeButton
                  activeRole={activeRoleForEdge(label)}
                  activeColor={activeRayColor}
                  answer={edgeAnswers.get(label)}
                  isActive={activeRayLabels.has(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>
            <span className={styles.corner} />
          </div>
        </div>

        <div className={styles.sideRail}>
          <div className={styles.stackCase}>
            <div className={styles.toolbarHeader}>Glass stack</div>
            <div className={styles.pieceStack} aria-label="Glass piece stack">
              {guess.map((placement) => {
                const mineral = minerals[placement.mineralId]
                const isSelected = placement.mineralId === selectedMineralId
                const isPlaced = placement.origin !== null

                return (
                  <div
                    className={[
                      styles.stackSlot,
                      isSelected ? styles.selectedStackSlot : '',
                      isPlaced ? styles.usedStackSlot : '',
                    ].join(' ')}
                    key={placement.mineralId}
                  >
                    {isPlaced ? (
                      <button
                        aria-label={`Return ${mineral.name} to stack`}
                        className={styles.stackResetButton}
                        onClick={() => onRemove(placement.mineralId)}
                        title={`Return ${mineral.name}`}
                        type="button"
                      >
                        <PieceShape
                          className={styles.stackGhostShape}
                          mineralId={placement.mineralId}
                          orientation={placement.orientation}
                        />
                        <RotateCcw size={18} />
                      </button>
                    ) : (
                      <button
                        aria-label={`Move ${mineral.name}`}
                        className={styles.stackPieceButton}
                        draggable
                        onClick={() => onSelect(placement.mineralId)}
                        onContextMenu={(event) => {
                          event.preventDefault()
                          onRotate(placement.mineralId)
                        }}
                        onDragEnd={cancelNativePieceMove}
                        onDragStart={(event) =>
                          startNativeStackDrag(event, placement)
                        }
                        onPointerCancel={() =>
                          cancelMovingPiece(placement.mineralId)
                        }
                        onPointerDown={(event) =>
                          startMovingPiece(
                            event,
                            placement,
                            stackDragAnchor(placement),
                          )
                        }
                        onPointerMove={(event) =>
                          movePiecePreview(event, placement.mineralId)
                        }
                        onPointerUp={(event) =>
                          finishMovingPiece(event, placement.mineralId)
                        }
                        title={`${mineral.name} - ${placement.orientation}`}
                        type="button"
                      >
                        <PieceShape
                          className={styles.stackShape}
                          mineralId={placement.mineralId}
                          orientation={placement.orientation}
                        />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.statusRail}>
            {currentAnswer ? (
              <div className={styles.currentLight}>
                <ColorDot
                  color={
                    currentAnswer.signalColor === 'absorbed'
                      ? 'absorbed'
                      : currentAnswer.signalColor
                  }
                />
                <div>
                  <strong>
                    {currentAnswer.mode === 'edge'
                      ? 'Current ray'
                      : 'Current cell'}
                  </strong>
                  <span>
                    {currentAnswer.query} - {currentAnswer.message}
                  </span>
                  {currentRayPreview ? (
                    <small>Preview - {currentRayPreview.message}</small>
                  ) : null}
                </div>
                <label>
                  <input
                    checked={showLightPath}
                    onChange={(event) =>
                      onToggleLightPath(event.target.checked)
                    }
                    type="checkbox"
                  />
                  Show light
                </label>
              </div>
            ) : null}

            {answers.length > 0 ? (
              <ol className={styles.logbook} aria-label="Logbook">
                {answers.slice(0, 6).map((answer) => (
                  <li
                    className={[
                      answer.mode === 'edge' ? styles.edgeLogEntry : '',
                      answer.id === hoveredLogbookAnswerId
                        ? styles.activeLogEntry
                        : '',
                    ].join(' ')}
                    key={answer.id}
                    onBlur={clearLogbookPreview}
                    onFocus={() => previewLogbookAnswer(answer)}
                    onPointerEnter={() => previewLogbookAnswer(answer)}
                    onPointerLeave={clearLogbookPreview}
                    style={
                      answer.mode === 'edge'
                        ? ({
                            '--logbook-active-color': colorValue(
                              answer.signalColor,
                            ),
                          } as CSSProperties)
                        : undefined
                    }
                    tabIndex={answer.mode === 'edge' ? 0 : undefined}
                  >
                    <ColorDot
                      color={
                        answer.signalColor === 'absorbed'
                          ? 'absorbed'
                          : answer.signalColor
                      }
                    />
                    <span>
                      {answer.mode === 'edge'
                        ? answer.query
                        : `Cell ${answer.query}`}
                    </span>
                    <strong>{answer.message}</strong>
                  </li>
                ))}
              </ol>
            ) : null}

            <button
              className={styles.submitButton}
              onClick={onSubmit}
              type="button"
            >
              Submit
            </button>

            {result ? (
              <p className={result.solved ? styles.solved : styles.notSolved}>
                {result.solved
                  ? 'Solved'
                  : `${result.exactPlacements}/${result.totalPlacements} exact`}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {dragState && draggedPlacement ? (
        <div
          aria-hidden="true"
          className={styles.dragPreview}
          style={dragPreviewStyle(dragState, draggedPlacement)}
        >
          <PieceShape
            className={styles.dragPreviewShape}
            mineralId={draggedPlacement.mineralId}
            orientation={draggedPlacement.orientation}
          />
        </div>
      ) : null}
    </aside>
  )
}

function EdgeButton({
  activeRole,
  activeColor,
  answer,
  isActive,
  label,
  onAskEdge,
}: Readonly<{
  activeRole: 'emitter' | 'receiver' | null
  activeColor: string | undefined
  answer: Answer | undefined
  isActive: boolean
  label: string
  onAskEdge: (edgeLabel: string) => void
}>) {
  return (
    <button
      aria-label={`Send ray ${label}`}
      data-edge-role={activeRole ?? undefined}
      data-edge-side={label.slice(0, 1)}
      className={[
        answer ? styles.answeredEdge : '',
        isActive ? styles.activeRayEdge : '',
        activeRole === 'emitter' ? styles.activeEmitterEdge : '',
        activeRole === 'receiver' ? styles.activeReceiverEdge : '',
      ].join(' ')}
      onClick={() => onAskEdge(label)}
      style={
        answer || activeColor
          ? ({
              '--edge-answer-color': answer
                ? colorValue(answer.signalColor)
                : activeColor,
              '--edge-active-color': activeColor,
            } as CSSProperties)
          : undefined
      }
      title={answer ? `${label}: ${answer.message}` : `Send ray ${label}`}
      type="button"
    >
      {label}
    </button>
  )
}

function RayOverlay({
  answer,
}: Readonly<{ answer: Answer & { mode: 'edge' } }>) {
  const points = rayPoints(answer)

  if (points.length < 2) {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={styles.rayLayer}
      preserveAspectRatio="none"
      style={
        {
          '--ray-color': colorValue(answer.signalColor),
        } as CSSProperties
      }
      viewBox={`${-rayViewBoxOffset} ${-rayViewBoxOffset} ${100 + rayViewBoxOffset * 2} ${100 + rayViewBoxOffset * 2}`}
    >
      <polyline className={styles.rayGlow} points={toSvgPoints(points)} />
      <polyline className={styles.rayCore} points={toSvgPoints(points)} />
      <circle
        className={styles.raySpark}
        cx={points[0].x}
        cy={points[0].y}
        r="1.1"
      />
      <circle
        className={styles.raySpark}
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="1.1"
      />
    </svg>
  )
}

const rayViewBoxOffset = 4.5
const horizontalRayEdgeOffset = 3
const verticalRayEdgeOffset = 4

function rayPoints(answer: Answer & { mode: 'edge' }) {
  const entryPoint = edgePoint(answer.query)
  const pathPoints = answer.path.map((coordinate) => ({
    x: ((coordinate.column + 0.5) / boardSize.columns) * 100,
    y: ((coordinate.row + 0.5) / boardSize.rows) * 100,
  }))
  const exitPoint = answer.exitLabel ? edgePoint(answer.exitLabel) : null

  return [entryPoint, ...pathPoints, exitPoint].filter(
    (point): point is { x: number; y: number } => point !== null,
  )
}

function edgePoint(label: string) {
  const edgePort = parseEdgePort(label)

  if (!edgePort) {
    return null
  }

  if (edgePort.label.startsWith('T') || edgePort.label.startsWith('B')) {
    const column = Number(edgePort.label.slice(1)) - 0.5

    return {
      x: (column / boardSize.columns) * 100,
      y: edgePort.label.startsWith('T')
        ? -horizontalRayEdgeOffset
        : 100 + horizontalRayEdgeOffset,
    }
  }

  const row = Number(edgePort.label.slice(1)) - 0.5

  return {
    x: edgePort.label.startsWith('L')
      ? -verticalRayEdgeOffset
      : 100 + verticalRayEdgeOffset,
    y: (row / boardSize.rows) * 100,
  }
}

function toSvgPoints(points: ReadonlyArray<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function SolutionPiece({
  placement,
}: Readonly<{
  placement: MineralPlacement
}>) {
  const orientation =
    placement.orientation ?? minerals[placement.mineralId].defaultOrientation
  const shape = getMineralShape(placement.mineralId, orientation)
  const mineral = minerals[placement.mineralId]

  return (
    <span
      className={styles.solutionPiece}
      style={{
        height: `${(shape.height / boardSize.rows) * 100}%`,
        left: `${(placement.origin.column / boardSize.columns) * 100}%`,
        top: `${(placement.origin.row / boardSize.rows) * 100}%`,
        width: `${(shape.width / boardSize.columns) * 100}%`,
      }}
      title={`${mineral.name} solution`}
    >
      <PieceShape
        className={styles.solutionShape}
        mineralId={placement.mineralId}
        orientation={orientation}
      />
    </span>
  )
}

function PlacementGhost({
  mineralId,
  orientation,
  origin,
}: Readonly<{
  mineralId: MineralId
  orientation: GuessPlacement['orientation']
  origin: Coordinate
}>) {
  const shape = getMineralShape(mineralId, orientation)

  return (
    <span
      className={styles.placementGhost}
      style={{
        height: `${(shape.height / boardSize.rows) * 100}%`,
        left: `${(origin.column / boardSize.columns) * 100}%`,
        top: `${(origin.row / boardSize.rows) * 100}%`,
        width: `${(shape.width / boardSize.columns) * 100}%`,
      }}
    >
      <PieceShape
        className={styles.placementGhostShape}
        mineralId={mineralId}
        orientation={orientation}
      />
    </span>
  )
}

function PlacedPiece({
  isDragging,
  isSelected,
  onMoveCancel,
  onMoveEnd,
  onMovePreview,
  onMoveStart,
  onRotate,
  onSelect,
  placement,
}: Readonly<{
  isDragging: boolean
  isSelected: boolean
  onMoveCancel: (mineralId: MineralId) => void
  onMoveEnd: (
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) => void
  onMovePreview: (
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) => void
  onMoveStart: (
    event: ReactPointerEvent<HTMLElement>,
    placement: GuessPlacement,
  ) => void
  onRotate: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
  placement: GuessPlacement
}>) {
  if (!placement.origin) {
    return null
  }

  const shape = getMineralShape(placement.mineralId, placement.orientation)
  const mineral = minerals[placement.mineralId]

  return (
    <div
      aria-label={`${mineral.name} at ${formatGridCoordinate(placement.origin)}`}
      className={[
        styles.placedPiece,
        isSelected ? styles.selectedPlacedPiece : '',
        isDragging ? styles.draggingPlacedPiece : '',
      ].join(' ')}
      onClick={() => onSelect(placement.mineralId)}
      onContextMenu={(event) => {
        event.preventDefault()
        onRotate(placement.mineralId)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(placement.mineralId)
        }
      }}
      onPointerCancel={() => onMoveCancel(placement.mineralId)}
      onPointerDown={(event) => onMoveStart(event, placement)}
      onPointerMove={(event) => onMovePreview(event, placement.mineralId)}
      onPointerUp={(event) => onMoveEnd(event, placement.mineralId)}
      role="button"
      style={{
        height: `${(shape.height / boardSize.rows) * 100}%`,
        left: `${(placement.origin.column / boardSize.columns) * 100}%`,
        top: `${(placement.origin.row / boardSize.rows) * 100}%`,
        width: `${(shape.width / boardSize.columns) * 100}%`,
      }}
      tabIndex={0}
    >
      <PieceShape
        className={styles.placedShape}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
      <strong>{mineral.shortName}</strong>
    </div>
  )
}
