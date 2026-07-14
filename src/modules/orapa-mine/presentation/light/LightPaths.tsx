import type { CSSProperties } from 'react'
import { boardSize, parseEdgePort } from '../../domain/coordinates'
import type { Answer } from '../../domain/questions'
import { colorValue } from '../colorPalette'
import styles from './LightPaths.module.css'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function LightPaths({
  allRays,
  currentRay,
  showAllRays,
  showCurrentRay,
}: Readonly<{
  allRays: ReadonlyArray<RayAnswer>
  currentRay: RayAnswer | null
  showAllRays: boolean
  showCurrentRay: boolean
}>) {
  return (
    <>
      {showAllRays ? (
        <AllRaysOverlay
          answers={allRays}
          excludedQuery={showCurrentRay ? currentRay?.query : undefined}
        />
      ) : null}
      {currentRay && showCurrentRay ? <RayOverlay answer={currentRay} /> : null}
    </>
  )
}

function RayOverlay({ answer }: Readonly<{ answer: RayAnswer }>) {
  const points = rayPoints(answer)

  if (points.length < 2) {
    return null
  }

  return (
    <svg
      aria-hidden="true"
      className={styles.rayLayer}
      preserveAspectRatio="none"
      style={{ '--ray-color': colorValue(answer.signalColor) } as CSSProperties}
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

function AllRaysOverlay({
  answers,
  excludedQuery,
}: Readonly<{
  answers: ReadonlyArray<RayAnswer>
  excludedQuery?: string
}>) {
  return (
    <svg
      aria-hidden="true"
      className={`${styles.rayLayer} ${styles.allRaysLayer}`}
      data-ray-layer="all"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {answers.map((answer) => {
        if (answer.query === excludedQuery) {
          return null
        }

        const points = rayPoints(answer)

        if (points.length < 2) {
          return null
        }

        return (
          <g
            key={answer.query}
            style={
              { '--ray-color': colorValue(answer.signalColor) } as CSSProperties
            }
          >
            <polyline
              className={styles.allRayGlow}
              points={toSvgPoints(points)}
            />
            <polyline
              className={styles.allRayCore}
              points={toSvgPoints(points)}
            />
          </g>
        )
      })}
    </svg>
  )
}

const rayEdgeInset = 1.1

function rayPoints(answer: RayAnswer) {
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
      y: edgePort.label.startsWith('T') ? rayEdgeInset : 100 - rayEdgeInset,
    }
  }

  const row = Number(edgePort.label.slice(1)) - 0.5

  return {
    x: edgePort.label.startsWith('L') ? rayEdgeInset : 100 - rayEdgeInset,
    y: (row / boardSize.rows) * 100,
  }
}

function toSvgPoints(points: ReadonlyArray<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}
