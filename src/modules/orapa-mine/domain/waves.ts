import type { Coordinate, EdgePort } from './coordinates'
import { exitLabelFrom, isInsideBoard, move } from './coordinates'
import type { ColorContact, SignalColor } from './colors'
import { mixSignalColor } from './colors'
import type { MineralPlacement } from './minerals'
import { findOccupant, reflectsFrom } from './minerals'

export type WaveTrace =
  | Readonly<{
      kind: 'exit'
      entryLabel: string
      exitLabel: string
      signalColor: SignalColor
      path: ReadonlyArray<Coordinate>
    }>
  | Readonly<{
      kind: 'absorbed'
      entryLabel: string
      absorbedAt: Coordinate
      path: ReadonlyArray<Coordinate>
    }>
  | Readonly<{
      kind: 'loop'
      entryLabel: string
      signalColor: SignalColor
      path: ReadonlyArray<Coordinate>
    }>

export function traceWave(
  placements: ReadonlyArray<MineralPlacement>,
  edgePort: EdgePort,
): WaveTrace {
  let cursor = edgePort.start
  let direction = edgePort.direction
  const path: Array<Coordinate> = []
  const contacts = new Set<ColorContact>()
  const seen = new Set<string>()

  for (let steps = 0; steps < 80; steps += 1) {
    cursor = move(cursor, direction)

    if (!isInsideBoard(cursor)) {
      const lastInside = path.at(-1)
      return {
        kind: 'exit',
        entryLabel: edgePort.label,
        exitLabel: lastInside ? exitLabelFrom(lastInside, direction) : edgePort.label,
        signalColor: mixSignalColor(contacts),
        path,
      }
    }

    path.push(cursor)

    const loopKey = `${cursor.column}:${cursor.row}:${direction}`
    if (seen.has(loopKey)) {
      return {
        kind: 'loop',
        entryLabel: edgePort.label,
        signalColor: mixSignalColor(contacts),
        path,
      }
    }
    seen.add(loopKey)

    const occupant = findOccupant(placements, cursor)
    if (!occupant) {
      continue
    }

    if (occupant.opticalCell === 'absorb' || occupant.mineral.color === 'black') {
      return {
        kind: 'absorbed',
        entryLabel: edgePort.label,
        absorbedAt: cursor,
        path,
      }
    }

    if (occupant.mineral.color !== 'transparent') {
      contacts.add(occupant.mineral.color)
    }

    direction = reflectsFrom(occupant.opticalCell, direction)
  }

  return {
    kind: 'loop',
    entryLabel: edgePort.label,
    signalColor: mixSignalColor(contacts),
    path,
  }
}
