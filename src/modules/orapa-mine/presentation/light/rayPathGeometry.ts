import { boardSize, parseEdgePort } from '../../domain/coordinates'
import type { EdgeAnswer } from '../../domain/questions'

export type RayPoint = Readonly<{ x: number; y: number }>

const rayEdgeInset = 1.1

export function rayPoints(answer: EdgeAnswer): ReadonlyArray<RayPoint> {
  const entryPoint = edgePoint(answer.query)
  const pathPoints = answer.path.map((coordinate) => ({
    x: ((coordinate.column + 0.5) / boardSize.columns) * 100,
    y: ((coordinate.row + 0.5) / boardSize.rows) * 100,
  }))
  const exitPoint = answer.exitLabel ? edgePoint(answer.exitLabel) : null

  return [entryPoint, ...pathPoints, exitPoint].filter(
    (point): point is RayPoint => point !== null,
  )
}

export function toSvgPoints(points: ReadonlyArray<RayPoint>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function toMotionPath(points: ReadonlyArray<RayPoint>) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

export function measureRayPath(points: ReadonlyArray<RayPoint>) {
  const cumulativeDistances = [0]

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]
    const point = points[index]
    const segmentDistance = Math.hypot(
      point.x - previousPoint.x,
      point.y - previousPoint.y,
    )

    cumulativeDistances.push(
      cumulativeDistances[cumulativeDistances.length - 1] + segmentDistance,
    )
  }

  return {
    cumulativeDistances,
    totalDistance: cumulativeDistances[cumulativeDistances.length - 1],
  }
}

function edgePoint(label: string): RayPoint | null {
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
