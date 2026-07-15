import type { Coordinate } from './coordinates'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
  Orientation,
} from './minerals'
import {
  canPlaceMineralWithOrientation,
  flipFace,
  getMineralShape,
  minerals,
  placementsOverlap,
  rotateOrientation,
} from './minerals'
import type { Puzzle } from './puzzles'

export type GuessResult = Readonly<{
  solved: boolean
  exactPlacements: number
  totalPlacements: number
}>

export type PlacementIssue = 'outside-board' | 'overlap'

export type PlacementAssessment = Readonly<{
  issues: ReadonlyArray<PlacementIssue>
  valid: boolean
}>

export function createEmptyGuess(puzzle: Puzzle): Array<GuessPlacement> {
  return puzzle.placements.map((placement) =>
    createCasedMineral(placement.mineralId),
  )
}

export function moveGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
  origin: Coordinate,
  orientation?: Orientation,
  face?: GuessPlacement['face'],
): Array<GuessPlacement> {
  const currentPlacement = guess.find(
    (placement) => placement.mineralId === mineralId,
  )
  const nextOrientation =
    orientation ??
    currentPlacement?.orientation ??
    minerals[mineralId].defaultOrientation
  const nextFace = face ?? currentPlacement?.face ?? 'front'

  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, face: nextFace, orientation: nextOrientation, origin }
      : placement,
  )
}

export function returnGuessMineralToCase(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
): Array<GuessPlacement> {
  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? createCasedMineral(mineralId)
      : placement,
  )
}

function createCasedMineral(mineralId: MineralId): GuessPlacement {
  return {
    face: 'front',
    mineralId,
    origin: null,
    orientation: minerals[mineralId].defaultOrientation,
  }
}

export function rotateGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
): Array<GuessPlacement> {
  const target = guess.find((placement) => placement.mineralId === mineralId)

  if (!target) {
    return [...guess]
  }

  const nextOrientation = rotateOrientation(target.orientation)

  if (target.origin) {
    const currentShape = getMineralShape(
      mineralId,
      target.orientation,
      target.face,
    )
    const nextShape = getMineralShape(mineralId, nextOrientation, target.face)
    const centeredOrigin = {
      column:
        target.origin.column +
        Math.trunc((currentShape.width - nextShape.width) / 2),
      row:
        target.origin.row +
        Math.trunc((currentShape.height - nextShape.height) / 2),
    }

    return moveGuessMineral(
      guess,
      mineralId,
      centeredOrigin,
      nextOrientation,
      target.face,
    )
  }

  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, orientation: nextOrientation }
      : placement,
  )
}

export function flipGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
): Array<GuessPlacement> {
  const target = guess.find((placement) => placement.mineralId === mineralId)

  if (!target) {
    return [...guess]
  }

  const nextFace = flipFace(target.face)

  if (target.origin) {
    return moveGuessMineral(
      guess,
      mineralId,
      target.origin,
      target.orientation,
      nextFace,
    )
  }

  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, face: nextFace }
      : placement,
  )
}

export function toPlacedMinerals(
  guess: ReadonlyArray<GuessPlacement>,
): Array<MineralPlacement> {
  return guess.flatMap((placement) =>
    placement.origin
      ? [
          {
            face: placement.face,
            mineralId: placement.mineralId,
            orientation: placement.orientation,
            origin: placement.origin,
          },
        ]
      : [],
  )
}

export function assessGuessPlacements(
  guess: ReadonlyArray<GuessPlacement>,
): ReadonlyMap<MineralId, PlacementAssessment> {
  const placements = toPlacedMinerals(guess)

  return new Map(
    placements.map((placement) => {
      const issues: Array<PlacementIssue> = []

      if (
        !canPlaceMineralWithOrientation(
          placement.mineralId,
          placement.origin,
          placement.orientation ??
            minerals[placement.mineralId].defaultOrientation,
          placement.face,
        )
      ) {
        issues.push('outside-board')
      }

      if (
        placements.some(
          (otherPlacement) =>
            otherPlacement.mineralId !== placement.mineralId &&
            placementsOverlap([placement, otherPlacement]),
        )
      ) {
        issues.push('overlap')
      }

      return [
        placement.mineralId,
        { issues, valid: issues.length === 0 },
      ] as const
    }),
  )
}

export function toValidPlacedMinerals(
  guess: ReadonlyArray<GuessPlacement>,
): Array<MineralPlacement> {
  const assessments = assessGuessPlacements(guess)

  return toPlacedMinerals(guess).filter(
    (placement) => assessments.get(placement.mineralId)?.valid,
  )
}

export function compareGuess(
  puzzle: Puzzle,
  guess: ReadonlyArray<GuessPlacement>,
): GuessResult {
  const exactPlacements = puzzle.placements.filter((solutionPlacement) =>
    guess.some(
      (guessPlacement) =>
        guessPlacement.mineralId === solutionPlacement.mineralId &&
        guessPlacement.origin !== null &&
        guessPlacement.face === (solutionPlacement.face ?? 'front') &&
        guessPlacement.orientation ===
          (solutionPlacement.orientation ??
            minerals[solutionPlacement.mineralId].defaultOrientation) &&
        guessPlacement.origin.column === solutionPlacement.origin.column &&
        guessPlacement.origin.row === solutionPlacement.origin.row,
    ),
  ).length

  return {
    solved: exactPlacements === puzzle.placements.length,
    exactPlacements,
    totalPlacements: puzzle.placements.length,
  }
}
