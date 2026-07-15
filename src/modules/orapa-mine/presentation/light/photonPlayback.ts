import type { ColorContact, SignalColor } from '../../domain/colors'
import { mixSignalColor } from '../../domain/colors'
import type { EdgeAnswer } from '../../domain/questions'
import type { RayPoint } from './rayPathGeometry'
import { measureRayPath, toMotionPath } from './rayPathGeometry'

export type PhotonColorStop = Readonly<{
  color: SignalColor
  offset: number
}>

export type PhotonPlayback = Readonly<{
  colorStops: ReadonlyArray<PhotonColorStop>
  durationMs: number
  motionPath: string
}>

export function createPhotonPlayback(
  answer: EdgeAnswer,
  points: ReadonlyArray<RayPoint>,
): PhotonPlayback {
  const measurement = measureRayPath(points)

  return {
    colorStops: createColorStops(answer, points, measurement),
    durationMs: Math.round(
      Math.min(2200, Math.max(650, measurement.totalDistance * 9)),
    ),
    motionPath: toMotionPath(points),
  }
}

export function createBouncingPhotonPlayback(
  answer: EdgeAnswer,
  points: ReadonlyArray<RayPoint>,
): PhotonPlayback {
  const forwardPlayback = createPhotonPlayback(answer, points)

  return {
    ...forwardPlayback,
    colorStops: mirrorColorStops(forwardPlayback.colorStops),
    durationMs: forwardPlayback.durationMs * 2,
  }
}

function mirrorColorStops(
  forwardStops: ReadonlyArray<PhotonColorStop>,
): ReadonlyArray<PhotonColorStop> {
  const outwardStops = forwardStops.map((stop) => ({
    ...stop,
    offset: stop.offset / 2,
  }))
  const returnStops = forwardStops
    .slice(0, -1)
    .reverse()
    .map((stop) => ({
      ...stop,
      offset: 1 - stop.offset / 2,
    }))

  return [...outwardStops, ...returnStops]
}

function createColorStops(
  answer: EdgeAnswer,
  points: ReadonlyArray<RayPoint>,
  measurement: ReturnType<typeof measureRayPath>,
): ReadonlyArray<PhotonColorStop> {
  const contacts = new Set<ColorContact>()
  const stops: Array<PhotonColorStop> = [{ color: 'transparent', offset: 0 }]

  for (const contact of answer.colorContacts) {
    contacts.add(contact.color)
    const pointIndex = Math.min(contact.pathIndex + 1, points.length - 1)
    const offset =
      measurement.totalDistance === 0
        ? 0
        : measurement.cumulativeDistances[pointIndex] /
          measurement.totalDistance
    const nextStop = {
      color: mixSignalColor(contacts),
      offset,
    }
    const previousStop = stops[stops.length - 1]

    if (offset === previousStop.offset) {
      stops[stops.length - 1] = nextStop
    } else {
      stops.push(nextStop)
    }
  }

  const finalStop = stops[stops.length - 1]

  if (finalStop.offset < 1) {
    stops.push({ color: finalStop.color, offset: 1 })
  }

  return stops
}
