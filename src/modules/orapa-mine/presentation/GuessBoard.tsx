import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { useRef, useState } from 'react'
import { Mic, MousePointer2, RotateCcw } from 'lucide-react'
import {
  boardSize,
  bottomLabels,
  coordinateKey,
  formatGridCoordinate,
  leftLabels,
  parseEdgePort,
  rightLabels,
  topLabels,
} from '../domain/coordinates'
import type { Coordinate } from '../domain/coordinates'
import { getMineralShape, minerals } from '../domain/minerals'
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
  highlightedPath: ReadonlySet<string>
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

export function GuessBoard({
  answers,
  currentAnswer,
  currentRayPreview,
  edgeAnswers,
  guess,
  highlightedPath,
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
  const [draggingMineralId, setDraggingMineralId] = useState<MineralId | null>(
    null,
  )
  const boardRef = useRef<HTMLDivElement>(null)
  const selectedPlacement = guess.find(
    (placement) => placement.mineralId === selectedMineralId,
  )
  const activeRayLabels = new Set(
    currentRayPreview
      ? [currentRayPreview.query, currentRayPreview.exitLabel].filter(
          (label): label is string => Boolean(label),
        )
      : [],
  )
  const activeRayColor = currentRayPreview
    ? colorValue(currentRayPreview.signalColor)
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

  function coordinateFromPointer(event: ReactPointerEvent) {
    const boardRect = boardRef.current?.getBoundingClientRect()

    if (!boardRect) {
      return null
    }

    const column = Math.floor(
      ((event.clientX - boardRect.left) / boardRect.width) * boardSize.columns,
    )
    const row = Math.floor(
      ((event.clientY - boardRect.top) / boardRect.height) * boardSize.rows,
    )

    if (
      column < 0 ||
      column >= boardSize.columns ||
      row < 0 ||
      row >= boardSize.rows
    ) {
      return null
    }

    return { column, row }
  }

  function startMovingPlacedPiece(
    event: ReactPointerEvent<HTMLDivElement>,
    mineralId: MineralId,
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraggingMineralId(mineralId)
    onSelect(mineralId)
  }

  function finishMovingPlacedPiece(
    event: ReactPointerEvent<HTMLDivElement>,
    mineralId: MineralId,
  ) {
    if (draggingMineralId !== mineralId) {
      return
    }

    const coordinate = coordinateFromPointer(event)
    setDraggingMineralId(null)

    if (coordinate) {
      onPlace(mineralId, coordinate)
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Family map</p>
          <h2>Solution</h2>
        </div>
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
          <div className={styles.selectedStrip}>
            <MousePointer2 size={15} />
            <span>
              {selectedPlacement
                ? `${minerals[selectedPlacement.mineralId].name} - ${selectedPlacement.orientation}`
                : 'Select a piece'}
            </span>
          </div>

          <div className={styles.gridShell} aria-label="Family solution board">
            <span className={styles.corner} />
            <div className={styles.columnLabels}>
              {topLabels.map((label) => (
                <EdgeButton
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
                  activeColor={activeRayColor}
                  answer={edgeAnswers.get(label)}
                  isActive={activeRayLabels.has(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>

            <div className={styles.boardSurface} ref={boardRef}>
              <div className={styles.cellLayer}>
                {Array.from({ length: boardSize.rows }, (_rowValue, row) =>
                  Array.from(
                    { length: boardSize.columns },
                    (_columnValue, column) => {
                      const coordinate = { column, row }
                      const key = coordinateKey(coordinate)

                      return (
                        <button
                          aria-label={`Place ${minerals[selectedMineralId].name} at ${formatGridCoordinate(coordinate)}`}
                          className={[
                            styles.cell,
                            highlightedPath.has(key) ? styles.pathCell : '',
                          ].join(' ')}
                          key={key}
                          onClick={() => onPlaceSelected(coordinate)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            const transferValue =
                              event.dataTransfer.getData('text/plain')

                            if (transferValue) {
                              onPlace(transferValue as MineralId, coordinate)
                            }
                          }}
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
                      isDragging={draggingMineralId === placement.mineralId}
                      key={placement.mineralId}
                      onMoveEnd={finishMovingPlacedPiece}
                      onMoveStart={startMovingPlacedPiece}
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
                        onDragStart={(event) =>
                          event.dataTransfer.setData(
                            'text/plain',
                            placement.mineralId,
                          )
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
                  <li key={answer.id}>
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
    </aside>
  )
}

function EdgeButton({
  activeColor,
  answer,
  isActive,
  label,
  onAskEdge,
}: Readonly<{
  activeColor: string | undefined
  answer: Answer | undefined
  isActive: boolean
  label: string
  onAskEdge: (edgeLabel: string) => void
}>) {
  return (
    <button
      aria-label={`Send ray ${label}`}
      className={[
        answer ? styles.answeredEdge : '',
        isActive ? styles.activeRayEdge : '',
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
      viewBox="0 0 100 100"
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
      y: edgePort.label.startsWith('T') ? 0 : 100,
    }
  }

  const row = Number(edgePort.label.slice(1)) - 0.5

  return {
    x: edgePort.label.startsWith('L') ? 0 : 100,
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

function PlacedPiece({
  isDragging,
  isSelected,
  onMoveEnd,
  onMoveStart,
  onRotate,
  onSelect,
  placement,
}: Readonly<{
  isDragging: boolean
  isSelected: boolean
  onMoveEnd: (
    event: ReactPointerEvent<HTMLDivElement>,
    mineralId: MineralId,
  ) => void
  onMoveStart: (
    event: ReactPointerEvent<HTMLDivElement>,
    mineralId: MineralId,
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
      onPointerDown={(event) => onMoveStart(event, placement.mineralId)}
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
