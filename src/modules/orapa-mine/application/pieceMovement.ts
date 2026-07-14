import type { Coordinate } from '../domain/coordinates'
import type { MineralId } from '../domain/minerals'

export type PieceMovementPointer = Readonly<{
  x: number
  y: number
}>

export type PieceMovementAnchor = Readonly<{
  column: number
  row: number
}>

export type PieceMovementTarget =
  | Readonly<{
      kind: 'board'
      origin: Coordinate
    }>
  | Readonly<{
      kind: 'stack'
    }>
  | null

export type PieceMovementSession = Readonly<{
  anchor: PieceMovementAnchor
  hasMoved: boolean
  mineralId: MineralId
  pointer: PieceMovementPointer
  startPointer: PieceMovementPointer
  target: PieceMovementTarget
}>

export type PieceMovementCommand =
  | Readonly<{
      kind: 'place'
      mineralId: MineralId
      origin: Coordinate
    }>
  | Readonly<{
      kind: 'return'
      mineralId: MineralId
    }>

const movementThreshold = 6

export function startPieceMovement({
  anchor,
  mineralId,
  pointer,
  target,
}: Readonly<{
  anchor: PieceMovementAnchor
  mineralId: MineralId
  pointer: PieceMovementPointer
  target: PieceMovementTarget
}>): PieceMovementSession {
  return {
    anchor,
    hasMoved: false,
    mineralId,
    pointer,
    startPointer: pointer,
    target,
  }
}

export function movePieceMovement(
  session: PieceMovementSession,
  pointer: PieceMovementPointer,
  target: PieceMovementTarget,
): PieceMovementSession {
  const movementDistance = Math.hypot(
    pointer.x - session.startPointer.x,
    pointer.y - session.startPointer.y,
  )

  return {
    ...session,
    hasMoved: session.hasMoved || movementDistance > movementThreshold,
    pointer,
    target,
  }
}

export function finishPieceMovement(
  session: PieceMovementSession,
  target: PieceMovementTarget,
): PieceMovementCommand | null {
  if (target?.kind === 'board') {
    return {
      kind: 'place',
      mineralId: session.mineralId,
      origin: target.origin,
    }
  }

  if (target?.kind === 'stack') {
    return {
      kind: 'return',
      mineralId: session.mineralId,
    }
  }

  return null
}
