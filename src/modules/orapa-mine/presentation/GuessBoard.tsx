import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { useRef, useState } from 'react'
import { Mic, RotateCcw } from 'lucide-react'
import {
  finishPieceMovement,
  movePieceMovement,
  startPieceMovement,
} from '../application/pieceMovement'
import type {
  PieceMovementAnchor,
  PieceMovementSession,
  PieceMovementTarget,
} from '../application/pieceMovement'
import type { VoiceRecognitionStatus } from '../application/voiceRecognition'
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

type GuessBoardProps = Readonly<{
  answers: ReadonlyArray<Answer>
  currentAnswer: Answer | null
  currentRayPreview: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers: ReadonlyMap<string, Answer>
  guess: ReadonlyArray<GuessPlacement>
  onAskEdge: (edgeLabel: string) => void
  onFlip: (mineralId: MineralId) => void
  onPlace: (mineralId: MineralId, origin: Coordinate) => void
  onRemove: (mineralId: MineralId) => void
  onReset: () => void
  onRotate: (mineralId: MineralId) => void
  onSelect: (mineralId: MineralId) => void
  onStartVoiceCommand: () => void
  onSubmit: () => void
  onToggleLightPath: (showLightPath: boolean) => void
  result: {
    solved: boolean
    exactPlacements: number
    totalPlacements: number
  } | null
  selectedMineralId: MineralId
  showLightPath: boolean
  showSolution: boolean
  solutionPlacements: ReadonlyArray<MineralPlacement>
  voiceStatus: VoiceRecognitionStatus
}>

type DragState = PieceMovementSession

export function GuessBoard({
  answers,
  currentAnswer,
  currentRayPreview,
  edgeAnswers,
  guess,
  onAskEdge,
  onFlip,
  onPlace,
  onRemove,
  onReset,
  onRotate,
  onSelect,
  onStartVoiceCommand,
  onSubmit,
  onToggleLightPath,
  result,
  selectedMineralId,
  showLightPath,
  showSolution,
  solutionPlacements,
  voiceStatus,
}: GuessBoardProps) {
  const [hoveredLogbookAnswerId, setHoveredLogbookAnswerId] = useState<
    number | null
  >(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressedClickMineralIdRef = useRef<MineralId | null>(null)
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

  function targetOriginFromClientPoint(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
    anchor: PieceMovementAnchor,
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

  function targetFromClientPoint(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
    anchor: PieceMovementAnchor,
  ): PieceMovementTarget {
    const boardOrigin = targetOriginFromClientPoint(
      clientX,
      clientY,
      mineralId,
      anchor,
    )

    if (boardOrigin) {
      return {
        kind: 'board',
        origin: boardOrigin,
      }
    }

    const placement = guess.find(
      (guessPlacement) => guessPlacement.mineralId === mineralId,
    )

    if (
      placement?.origin &&
      isPointerOverStackSlot(clientX, clientY, mineralId)
    ) {
      return { kind: 'stack' }
    }

    return null
  }

  function isPointerOverStackSlot(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
  ) {
    let currentElement = document.elementFromPoint(clientX, clientY)

    while (currentElement instanceof HTMLElement) {
      if (currentElement.dataset.stackMineralId === mineralId) {
        return true
      }

      currentElement = currentElement.parentElement
    }

    return false
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
        targetPlacement.face,
      )
    ) {
      return false
    }

    const nextPlacements = guess.flatMap<MineralPlacement>((placement) => {
      if (placement.mineralId === mineralId) {
        return [
          {
            mineralId,
            face: targetPlacement.face,
            orientation: targetPlacement.orientation,
            origin,
          },
        ]
      }

      return placement.origin
        ? [
            {
              mineralId: placement.mineralId,
              face: placement.face,
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
    const shape = getMineralShape(
      placement.mineralId,
      placement.orientation,
      placement.face,
    )

    return {
      height: `${shape.height * cellHeight}px`,
      left: `${dragStateValue.pointer.x - dragStateValue.anchor.column * cellWidth}px`,
      top: `${dragStateValue.pointer.y - dragStateValue.anchor.row * cellHeight}px`,
      width: `${shape.width * cellWidth}px`,
    } satisfies CSSProperties
  }

  function stackDragAnchor(placement: GuessPlacement) {
    const shape = getMineralShape(
      placement.mineralId,
      placement.orientation,
      placement.face,
    )

    return {
      column: shape.width / 2,
      row: shape.height / 2,
    }
  }

  function placedDragAnchorFromClientPoint(
    clientX: number,
    clientY: number,
    placement: GuessPlacement,
  ) {
    const boardPoint = boardPointFromClientPoint(clientX, clientY)

    if (!boardPoint || !placement.origin) {
      return stackDragAnchor(placement)
    }

    return {
      column: boardPoint.column - placement.origin.column,
      row: boardPoint.row - placement.origin.row,
    }
  }

  function placedPointerDragAnchor(
    event: ReactPointerEvent,
    placement: GuessPlacement,
  ) {
    return placedDragAnchorFromClientPoint(
      event.clientX,
      event.clientY,
      placement,
    )
  }

  function placedMouseDragAnchor(
    event: ReactMouseEvent,
    placement: GuessPlacement,
  ) {
    return placedDragAnchorFromClientPoint(
      event.clientX,
      event.clientY,
      placement,
    )
  }

  function startMovingPieceFromClientPoint(
    clientX: number,
    clientY: number,
    placement: GuessPlacement,
    anchor: PieceMovementAnchor,
  ) {
    commitDragState(
      startPieceMovement({
        anchor,
        mineralId: placement.mineralId,
        pointer: {
          x: clientX,
          y: clientY,
        },
        target: targetFromClientPoint(
          clientX,
          clientY,
          placement.mineralId,
          anchor,
        ),
      }),
    )
    onSelect(placement.mineralId)
  }

  function startMovingPiece(
    event: ReactPointerEvent<HTMLElement>,
    placement: GuessPlacement,
    anchor: PieceMovementAnchor,
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    startMovingPieceFromClientPoint(
      event.clientX,
      event.clientY,
      placement,
      anchor,
    )
  }

  function startMovingPieceWithMouse(
    event: ReactMouseEvent<HTMLElement>,
    placement: GuessPlacement,
    anchor: PieceMovementAnchor,
  ) {
    if (event.button !== 0 || dragStateRef.current) {
      return
    }

    event.preventDefault()
    startMovingPieceFromClientPoint(
      event.clientX,
      event.clientY,
      placement,
      anchor,
    )
  }

  function movePiecePreviewFromClientPoint(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
  ) {
    const currentDragState = dragStateRef.current

    if (currentDragState?.mineralId !== mineralId) {
      return
    }

    commitDragState(
      movePieceMovement(
        currentDragState,
        {
          x: clientX,
          y: clientY,
        },
        targetFromClientPoint(
          clientX,
          clientY,
          mineralId,
          currentDragState.anchor,
        ),
      ),
    )
  }

  function movePiecePreview(
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    event.preventDefault()
    movePiecePreviewFromClientPoint(event.clientX, event.clientY, mineralId)
  }

  function movePiecePreviewWithMouse(
    event: ReactMouseEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    if (!dragStateRef.current) {
      return
    }

    event.preventDefault()
    movePiecePreviewFromClientPoint(event.clientX, event.clientY, mineralId)
  }

  function suppressClickAfterDrag(mineralId: MineralId) {
    suppressedClickMineralIdRef.current = mineralId
    window.setTimeout(() => {
      if (suppressedClickMineralIdRef.current === mineralId) {
        suppressedClickMineralIdRef.current = null
      }
    }, 0)
  }

  function shouldIgnoreClickAfterDrag(mineralId: MineralId) {
    if (suppressedClickMineralIdRef.current !== mineralId) {
      return false
    }

    suppressedClickMineralIdRef.current = null
    return true
  }

  function pickPieceFromClick(
    event: ReactMouseEvent<HTMLElement>,
    placement: GuessPlacement,
    anchor: PieceMovementAnchor,
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (shouldIgnoreClickAfterDrag(placement.mineralId)) {
      return
    }

    startMovingPieceFromClientPoint(
      event.clientX,
      event.clientY,
      placement,
      anchor,
    )
  }

  function finishMovingPieceFromClientPoint(
    clientX: number,
    clientY: number,
    mineralId: MineralId,
  ) {
    const currentDragState = dragStateRef.current

    if (currentDragState?.mineralId !== mineralId) {
      return
    }

    const target = targetFromClientPoint(
      clientX,
      clientY,
      mineralId,
      currentDragState.anchor,
    )
    const command = finishPieceMovement(currentDragState, target)
    const wasPointerDrag = currentDragState.hasMoved

    commitDragState(null)

    if (wasPointerDrag) {
      suppressClickAfterDrag(mineralId)
    }

    if (command?.kind === 'place') {
      onPlace(command.mineralId, command.origin)
    }

    if (command?.kind === 'return') {
      onRemove(command.mineralId)
    }
  }

  function finishMovingPiece(
    event: ReactPointerEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    event.preventDefault()
    finishMovingPieceFromClientPoint(event.clientX, event.clientY, mineralId)
  }

  function finishMovingPieceWithMouse(
    event: ReactMouseEvent<HTMLElement>,
    mineralId: MineralId,
  ) {
    if (!dragStateRef.current) {
      return
    }

    event.preventDefault()
    finishMovingPieceFromClientPoint(event.clientX, event.clientY, mineralId)
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

  function moveActivePiecePreviewWithMouse(
    event: ReactMouseEvent<HTMLElement>,
  ) {
    const activeDragState = dragStateRef.current

    if (activeDragState) {
      movePiecePreviewWithMouse(event, activeDragState.mineralId)
    }
  }

  function finishActivePieceMoveWithMouse(event: ReactMouseEvent<HTMLElement>) {
    const activeDragState = dragStateRef.current

    if (activeDragState) {
      finishMovingPieceWithMouse(event, activeDragState.mineralId)
    }
  }

  function dropPickedPiece(event: ReactMouseEvent<HTMLElement>) {
    const activeDragState = dragStateRef.current

    if (!activeDragState) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    finishMovingPieceFromClientPoint(
      event.clientX,
      event.clientY,
      activeDragState.mineralId,
    )
  }

  return (
    <aside
      className={styles.panel}
      onMouseMove={moveActivePiecePreviewWithMouse}
      onMouseUp={finishActivePieceMoveWithMouse}
      onPointerCancel={() => commitDragState(null)}
      onPointerMove={moveActivePiecePreview}
      onPointerUp={finishActivePieceMove}
    >
      <div className={styles.heading}>
        <div className={styles.headingActions}>
          <button
            aria-label="Speak"
            className={voiceStatus === 'listening' ? styles.listening : ''}
            onClick={onStartVoiceCommand}
            title={voiceStatus === 'error' ? 'Voice unavailable' : 'Speak'}
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
              onClick={dropPickedPiece}
              ref={boardRef}
            >
              <div className={styles.cellLayer}>
                {Array.from({ length: boardSize.rows }, (_rowValue, row) =>
                  Array.from(
                    { length: boardSize.columns },
                    (_columnValue, column) => {
                      return (
                        <span
                          aria-hidden="true"
                          className={styles.cell}
                          key={`${column}:${row}`}
                        />
                      )
                    },
                  ),
                )}
              </div>

              {currentRayPreview && showLightPath ? (
                <RayOverlay answer={currentRayPreview} />
              ) : null}

              {dragState?.target?.kind === 'board' && draggedPlacement ? (
                <PlacementGhost
                  face={draggedPlacement.face}
                  mineralId={draggedPlacement.mineralId}
                  orientation={draggedPlacement.orientation}
                  origin={dragState.target.origin}
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
                          placedPointerDragAnchor(event, piecePlacement),
                        )
                      }
                      onMouseMove={movePiecePreviewWithMouse}
                      onMouseStart={(event, piecePlacement) =>
                        startMovingPieceWithMouse(
                          event,
                          piecePlacement,
                          placedMouseDragAnchor(event, piecePlacement),
                        )
                      }
                      onMouseEnd={finishMovingPieceWithMouse}
                      onFlip={onFlip}
                      onPick={(event, piecePlacement) =>
                        pickPieceFromClick(
                          event,
                          piecePlacement,
                          placedDragAnchorFromClientPoint(
                            event.clientX,
                            event.clientY,
                            piecePlacement,
                          ),
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
            <div
              className={styles.pieceStack}
              aria-label="Glass piece stack"
              onClick={dropPickedPiece}
            >
              {guess.map((placement) => {
                const mineral = minerals[placement.mineralId]
                const isSelected = placement.mineralId === selectedMineralId
                const isPlaced = placement.origin !== null
                const isDragged = dragState?.mineralId === placement.mineralId
                const isReturnTarget =
                  isDragged && dragState.target?.kind === 'stack'

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
                    key={placement.mineralId}
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
                          pickPieceFromClick(
                            event,
                            placement,
                            stackDragAnchor(placement),
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
                        onPointerCancel={() =>
                          cancelMovingPiece(placement.mineralId)
                        }
                        onMouseDown={(event) =>
                          startMovingPieceWithMouse(
                            event,
                            placement,
                            stackDragAnchor(placement),
                          )
                        }
                        onMouseMove={(event) =>
                          movePiecePreviewWithMouse(event, placement.mineralId)
                        }
                        onMouseUp={(event) =>
                          finishMovingPieceWithMouse(event, placement.mineralId)
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
            face={draggedPlacement.face}
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
  const face = placement.face ?? 'front'
  const shape = getMineralShape(placement.mineralId, orientation, face)
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
        face={face}
        mineralId={placement.mineralId}
        orientation={orientation}
      />
    </span>
  )
}

function PlacementGhost({
  face,
  mineralId,
  orientation,
  origin,
}: Readonly<{
  face: GuessPlacement['face']
  mineralId: MineralId
  orientation: GuessPlacement['orientation']
  origin: Coordinate
}>) {
  const shape = getMineralShape(mineralId, orientation, face)

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
        face={face}
        mineralId={mineralId}
        orientation={orientation}
      />
    </span>
  )
}

function PlacedPiece({
  isDragging,
  isSelected,
  onMouseEnd,
  onMouseMove,
  onMouseStart,
  onMoveCancel,
  onMoveEnd,
  onMovePreview,
  onMoveStart,
  onFlip,
  onPick,
  onRotate,
  onSelect,
  placement,
}: Readonly<{
  isDragging: boolean
  isSelected: boolean
  onMouseEnd: (
    event: ReactMouseEvent<HTMLElement>,
    mineralId: MineralId,
  ) => void
  onMouseMove: (
    event: ReactMouseEvent<HTMLElement>,
    mineralId: MineralId,
  ) => void
  onMouseStart: (
    event: ReactMouseEvent<HTMLElement>,
    placement: GuessPlacement,
  ) => void
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
  onFlip: (mineralId: MineralId) => void
  onPick: (
    event: ReactMouseEvent<HTMLElement>,
    placement: GuessPlacement,
  ) => void
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
      onClick={(event) => onPick(event, placement)}
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
      onMouseDown={(event) => onMouseStart(event, placement)}
      onMouseMove={(event) => onMouseMove(event, placement.mineralId)}
      onMouseUp={(event) => onMouseEnd(event, placement.mineralId)}
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
      title={`${mineral.name} - ${placement.orientation}, ${placement.face}`}
    >
      <PieceShape
        className={styles.placedShape}
        face={placement.face}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
      <strong>{mineral.shortName}</strong>
    </div>
  )
}
