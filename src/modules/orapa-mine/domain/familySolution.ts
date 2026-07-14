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

export function createEmptyGuess(puzzle: Puzzle): Array<GuessPlacement> {
  return puzzle.placements.map((placement) => ({
    face: placement.face ?? 'front',
    mineralId: placement.mineralId,
    origin: null,
    orientation:
      placement.orientation ?? minerals[placement.mineralId].defaultOrientation,
  }))
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

  if (
    !canPlaceMineralWithOrientation(
      mineralId,
      origin,
      nextOrientation,
      nextFace,
    )
  ) {
    return [...guess]
  }

  const nextGuess = guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, face: nextFace, orientation: nextOrientation, origin }
      : placement,
  )

  if (placementsOverlap(toPlacedMinerals(nextGuess))) {
    return [...guess]
  }

  return nextGuess
}

export function removeGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
): Array<GuessPlacement> {
  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, origin: null }
      : placement,
  )
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
    return moveGuessMineral(
      guess,
      mineralId,
      target.origin,
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
