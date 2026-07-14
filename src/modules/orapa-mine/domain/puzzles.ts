import type { Coordinate } from './coordinates'
import type { GuessPlacement, MineralId, MineralPlacement } from './minerals'
import { canPlaceMineral } from './minerals'

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
      { mineralId: 'red-parallelogram', origin: { column: 6, row: 0 } },
      { mineralId: 'yellow-triangle', origin: { column: 1, row: 1 } },
      { mineralId: 'blue-diamond', origin: { column: 3, row: 4 } },
      { mineralId: 'white-large-triangle', origin: { column: 6, row: 3 } },
      { mineralId: 'white-small-square', origin: { column: 8, row: 6 } },
    ],
  },
  {
    id: 'deep-vein',
    title: 'Deep Vein',
    ruleset: 'basic',
    placements: [
      { mineralId: 'red-parallelogram', origin: { column: 2, row: 0 } },
      { mineralId: 'yellow-triangle', origin: { column: 7, row: 1 } },
      { mineralId: 'blue-diamond', origin: { column: 0, row: 5 } },
      { mineralId: 'white-large-triangle', origin: { column: 5, row: 4 } },
      { mineralId: 'white-small-square', origin: { column: 4, row: 2 } },
    ],
  },
  {
    id: 'expert-shaft',
    title: 'Expert Shaft',
    ruleset: 'expansion',
    placements: [
      { mineralId: 'red-parallelogram', origin: { column: 0, row: 2 } },
      { mineralId: 'yellow-triangle', origin: { column: 8, row: 1 } },
      { mineralId: 'blue-diamond', origin: { column: 5, row: 0 } },
      { mineralId: 'white-large-triangle', origin: { column: 2, row: 5 } },
      { mineralId: 'white-small-square', origin: { column: 7, row: 6 } },
      { mineralId: 'transparent-prism', origin: { column: 2, row: 1 } },
      { mineralId: 'black-body', origin: { column: 5, row: 4 } },
    ],
  },
]

export function createEmptyGuess(puzzle: Puzzle): Array<GuessPlacement> {
  return puzzle.placements.map((placement) => ({
    mineralId: placement.mineralId,
    origin: null,
  }))
}

export function moveGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
  origin: Coordinate,
): Array<GuessPlacement> {
  if (!canPlaceMineral(mineralId, origin)) {
    return [...guess]
  }

  return guess.map((placement) =>
    placement.mineralId === mineralId ? { ...placement, origin } : placement,
  )
}

export function removeGuessMineral(
  guess: ReadonlyArray<GuessPlacement>,
  mineralId: MineralId,
): Array<GuessPlacement> {
  return guess.map((placement) =>
    placement.mineralId === mineralId ? { ...placement, origin: null } : placement,
  )
}

export function toPlacedMinerals(
  guess: ReadonlyArray<GuessPlacement>,
): Array<MineralPlacement> {
  return guess.flatMap((placement) =>
    placement.origin ? [{ mineralId: placement.mineralId, origin: placement.origin }] : [],
  )
}

export function compareGuess(puzzle: Puzzle, guess: ReadonlyArray<GuessPlacement>): GuessResult {
  const exactPlacements = puzzle.placements.filter((solutionPlacement) =>
    guess.some(
      (guessPlacement) =>
        guessPlacement.mineralId === solutionPlacement.mineralId &&
        guessPlacement.origin !== null &&
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
