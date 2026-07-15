import type { Coordinate, EdgePort } from './coordinates'
import { exitLabelFrom, isInsideBoard, move } from './coordinates'
import type { ColorContact, SignalColor } from './colors'
import { mixSignalColor } from './colors'
import type { MineralPlacement } from './minerals'
import { findOccupant, reflectsFrom } from './minerals'

export type WaveColorContact = Readonly<{
  color: ColorContact
  pathIndex: number
}>

type WaveTraceBase = Readonly<{
  colorContacts: ReadonlyArray<WaveColorContact>
  entryLabel: string
  path: ReadonlyArray<Coordinate>
}>

export type WaveTrace =
  | (WaveTraceBase &
      Readonly<{
        kind: 'exit'
        exitLabel: string
        signalColor: SignalColor
      }>)
  | (WaveTraceBase &
      Readonly<{
        kind: 'absorbed'
        absorbedAt: Coordinate
      }>)
  | (WaveTraceBase &
      Readonly<{
        kind: 'loop'
        signalColor: SignalColor
      }>)

export function traceWave(
  placements: ReadonlyArray<MineralPlacement>,
  edgePort: EdgePort,
): WaveTrace {
  let cursor = edgePort.start
  let direction = edgePort.direction
  const path: Array<Coordinate> = []
  const contacts = new Set<ColorContact>()
  const colorContacts: Array<WaveColorContact> = []
  const seen = new Set<string>()

  for (let steps = 0; steps < 80; steps += 1) {
    cursor = move(cursor, direction)

    if (!isInsideBoard(cursor)) {
      const lastInside = path.at(-1)
      return {
        kind: 'exit',
        colorContacts,
        entryLabel: edgePort.label,
        exitLabel: lastInside
          ? exitLabelFrom(lastInside, direction)
          : edgePort.label,
        signalColor: mixSignalColor(contacts),
        path,
      }
    }

    path.push(cursor)

    const loopKey = `${cursor.column}:${cursor.row}:${direction}`
    if (seen.has(loopKey)) {
      return {
        kind: 'loop',
        colorContacts,
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

    if (
      occupant.opticalCell === 'absorb' ||
      occupant.mineral.color === 'black'
    ) {
      return {
        kind: 'absorbed',
        colorContacts,
        entryLabel: edgePort.label,
        absorbedAt: cursor,
        path,
      }
    }

    const contactColor = occupant.mineral.color

    if (contactColor !== 'transparent' && !contacts.has(contactColor)) {
      contacts.add(contactColor)
      colorContacts.push({
        color: contactColor,
        pathIndex: path.length - 1,
      })
    }

    direction = reflectsFrom(occupant.opticalCell, direction)
  }

  return {
    kind: 'loop',
    colorContacts,
    entryLabel: edgePort.label,
    signalColor: mixSignalColor(contacts),
    path,
  }
}
