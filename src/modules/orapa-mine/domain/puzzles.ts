import type { Coordinate } from './coordinates'
import type {
  GuessPlacement,
  MineralId,
  MineralPlacement,
  Orientation,
} from './minerals'
import {
  canPlaceMineralWithOrientation,
  minerals,
  placementsOverlap,
  rotateOrientation,
} from './minerals'

export type Puzzle = Readonly<{
  id: string
  title: string
  ruleset: 'basic' | 'expansion'
  placements: ReadonlyArray<MineralPlacement>
}>

export type GuessResult = Readonly<{
  solved: boolean
  exactPlacements: number
  totalPlacements: number
}>

export const preparedPuzzles: ReadonlyArray<Puzzle> = [
  {
    id: 'resting-place',
    title: 'Resting Place',
    ruleset: 'basic',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'north',
        origin: { column: 4, row: 0 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'north',
        origin: { column: 0, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'north',
        origin: { column: 2, row: 4 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 6, row: 3 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'north',
        origin: { column: 1, row: 7 },
      },
    ],
  },
  {
    id: 'deep-vein',
    title: 'Deep Vein',
    ruleset: 'basic',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'east',
        origin: { column: 0, row: 2 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'west',
        origin: { column: 6, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'south',
        origin: { column: 2, row: 0 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 5, row: 4 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'east',
        origin: { column: 1, row: 6 },
      },
    ],
  },
  {
    id: 'expert-shaft',
    title: 'Expert Shaft',
    ruleset: 'expansion',
    placements: [
      {
        mineralId: 'red-parallelogram',
        orientation: 'south',
        origin: { column: 0, row: 1 },
      },
      {
        mineralId: 'yellow-triangle',
        orientation: 'south',
        origin: { column: 6, row: 0 },
      },
      {
        mineralId: 'blue-big-triangle',
        orientation: 'west',
        origin: { column: 4, row: 3 },
      },
      {
        mineralId: 'white-diamond',
        orientation: 'north',
        origin: { column: 2, row: 4 },
      },
      {
        mineralId: 'white-big-triangle',
        orientation: 'east',
        origin: { column: 0, row: 6 },
      },
      {
        mineralId: 'transparent-prism',
        orientation: 'north',
        origin: { column: 3, row: 0 },
      },
      {
        mineralId: 'black-absorber',
        orientation: 'north',
        origin: { column: 6, row: 8 },
      },
    ],
  },
]

export function createEmptyGuess(puzzle: Puzzle): Array<GuessPlacement> {
  return puzzle.placements.map((placement) => ({
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
): Array<GuessPlacement> {
  const currentPlacement = guess.find((placement) => placement.mineralId === mineralId)
  const nextOrientation =
    orientation ?? currentPlacement?.orientation ?? minerals[mineralId].defaultOrientation

  if (!canPlaceMineralWithOrientation(mineralId, origin, nextOrientation)) {
    return [...guess]
  }

  const nextGuess = guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, orientation: nextOrientation, origin }
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
    placement.mineralId === mineralId ? { ...placement, origin: null } : placement,
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
    return moveGuessMineral(guess, mineralId, target.origin, nextOrientation)
  }

  return guess.map((placement) =>
    placement.mineralId === mineralId
      ? { ...placement, orientation: nextOrientation }
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
            mineralId: placement.mineralId,
            orientation: placement.orientation,
            origin: placement.origin,
          },
        ]
      : [],
  )
}

export function compareGuess(puzzle: Puzzle, guess: ReadonlyArray<GuessPlacement>): GuessResult {
  const exactPlacements = puzzle.placements.filter((solutionPlacement) =>
    guess.some(
      (guessPlacement) =>
        guessPlacement.mineralId === solutionPlacement.mineralId &&
        guessPlacement.origin !== null &&
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
