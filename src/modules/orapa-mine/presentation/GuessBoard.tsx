import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Mic, MousePointer2, RotateCcw, RotateCw, Trash2 } from 'lucide-react'
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
import type { GuessPlacement, MineralId, MineralPlacement } from '../domain/minerals'
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
  result: { solved: boolean; exactPlacements: number; totalPlacements: number } | null
  selectedMineralId: MineralId
  showLightPath: boolean
  showSolution: boolean
  solutionPlacements: ReadonlyArray<MineralPlacement>
}>

export function GuessBoard({
  answers,
  currentAnswer,
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
  const selectedPlacement = guess.find(
    (placement) => placement.mineralId === selectedMineralId,
  )

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
                  answer={edgeAnswers.get(label)}
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
                  answer={edgeAnswers.get(label)}
                  key={label}
                  label={label}
                  onAskEdge={onAskEdge}
                />
              ))}
            </div>

            <div className={styles.boardSurface}>
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

              {currentAnswer?.mode === 'edge' && showLightPath ? (
                <RayOverlay answer={currentAnswer} />
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
                      key={placement.mineralId}
                      onRotate={onRotate}
                      placement={placement}
                    />
                  ) : null,
                )}
              </div>
            </div>

            <div className={styles.rightLabels}>
              {rightLabels.map((label) => (
                <EdgeButton
                  answer={edgeAnswers.get(label)}
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
                  answer={edgeAnswers.get(label)}
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
                  {currentAnswer.mode === 'edge' ? 'Current ray' : 'Current cell'}
                </strong>
                <span>
                  {currentAnswer.query} - {currentAnswer.message}
                </span>
              </div>
              <label>
                <input
                  checked={showLightPath}
                  onChange={(event) => onToggleLightPath(event.target.checked)}
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
                    {answer.mode === 'edge' ? answer.query : `Cell ${answer.query}`}
                  </span>
                  <strong>{answer.message}</strong>
                </li>
              ))}
            </ol>
          ) : null}

          <div className={styles.toolbarHeader}>Available gems</div>
          <div className={styles.rack}>
            {guess.map((placement) => {
              const mineral = minerals[placement.mineralId]
              const isSelected = placement.mineralId === selectedMineralId

              return (
                <div
                  className={[
                    styles.rackPiece,
                    isSelected ? styles.selectedRackPiece : '',
                  ].join(' ')}
                  draggable
                  key={placement.mineralId}
                  onDragStart={(event) =>
                    event.dataTransfer.setData('text/plain', placement.mineralId)
                  }
                >
                  <button
                    aria-label={`Select ${mineral.name}`}
                    className={styles.rackSelect}
                    onClick={() => onSelect(placement.mineralId)}
                    type="button"
                  >
                    <PieceShape
                      className={styles.rackShape}
                      mineralId={placement.mineralId}
                      orientation={placement.orientation}
                    />
                    <span>
                      {mineral.name}
                      {' '}
                      <small>
                        {placement.origin
                          ? formatGridCoordinate(placement.origin)
                          : 'Not placed'}{' '}
                        - {placement.orientation}
                      </small>
                    </span>
                  </button>

                  <button
                    aria-label={`Rotate ${mineral.name}`}
                    onClick={() => onRotate(placement.mineralId)}
                    type="button"
                  >
                    <RotateCw size={15} />
                  </button>

                  {placement.origin ? (
                    <button
                      aria-label={`Remove ${mineral.name}`}
                      onClick={() => onRemove(placement.mineralId)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>

          <button className={styles.submitButton} onClick={onSubmit} type="button">
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
    </aside>
  )
}

function EdgeButton({
  answer,
  label,
  onAskEdge,
}: Readonly<{
  answer: Answer | undefined
  label: string
  onAskEdge: (edgeLabel: string) => void
}>) {
  return (
    <button
      aria-label={`Send ray ${label}`}
      className={answer ? styles.answeredEdge : ''}
      onClick={() => onAskEdge(label)}
      style={
        answer
          ? ({
              '--edge-answer-color': colorValue(answer.signalColor),
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

function RayOverlay({ answer }: Readonly<{ answer: Answer & { mode: 'edge' } }>) {
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
      <circle className={styles.raySpark} cx={points[0].x} cy={points[0].y} r="1.1" />
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
  const exitLabel = answer.message.match(/^Exit ([TBLR](?:10|[1-9]))/)?.[1]
  const exitPoint = exitLabel ? edgePoint(exitLabel) : null

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
      style={
        {
          height: `${(shape.height / boardSize.rows) * 100}%`,
          left: `${(placement.origin.column / boardSize.columns) * 100}%`,
          top: `${(placement.origin.row / boardSize.rows) * 100}%`,
          width: `${(shape.width / boardSize.columns) * 100}%`,
        }
      }
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
  isSelected,
  onRotate,
  placement,
}: Readonly<{
  isSelected: boolean
  onRotate: (mineralId: MineralId) => void
  placement: GuessPlacement
}>) {
  if (!placement.origin) {
    return null
  }

  const shape = getMineralShape(placement.mineralId, placement.orientation)
  const mineral = minerals[placement.mineralId]

  return (
    <button
      aria-label={`Rotate ${mineral.name} at ${formatGridCoordinate(placement.origin)}`}
      className={[
        styles.placedPiece,
        isSelected ? styles.selectedPlacedPiece : '',
      ].join(' ')}
      draggable
      onClick={() => onRotate(placement.mineralId)}
      onDragStart={(event) =>
        event.dataTransfer.setData('text/plain', placement.mineralId)
      }
      style={
        {
          height: `${(shape.height / boardSize.rows) * 100}%`,
          left: `${(placement.origin.column / boardSize.columns) * 100}%`,
          top: `${(placement.origin.row / boardSize.rows) * 100}%`,
          width: `${(shape.width / boardSize.columns) * 100}%`,
        }
      }
      type="button"
    >
      <PieceShape
        className={styles.placedShape}
        mineralId={placement.mineralId}
        orientation={placement.orientation}
      />
      <strong>{mineral.shortName}</strong>
    </button>
  )
}
