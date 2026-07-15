import type { Coordinate } from '../domain/coordinates'
import {
  compareGuess,
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  returnGuessMineralToCase,
  rotateGuessMineral,
} from '../domain/familySolution'
import type { GuessResult } from '../domain/familySolution'
import type { GuessPlacement, MineralId } from '../domain/minerals'
import type { Puzzle } from '../domain/puzzles'

export type FamilySolution = Readonly<{
  guess: ReadonlyArray<GuessPlacement>
  selectedMineralId: MineralId
  submittedResult: GuessResult | null
}>

export function startFamilySolution(puzzle: Puzzle): FamilySolution {
  return {
    guess: createEmptyGuess(puzzle),
    selectedMineralId: puzzle.placements[0].mineralId,
    submittedResult: null,
  }
}

export function placeFamilyMineral(
  solution: FamilySolution,
  mineralId: MineralId,
  origin: Coordinate,
): FamilySolution {
  return {
    guess: moveGuessMineral(solution.guess, mineralId, origin),
    selectedMineralId: mineralId,
    submittedResult: null,
  }
}

export function selectFamilyMineral(
  solution: FamilySolution,
  mineralId: MineralId,
): FamilySolution {
  return { ...solution, selectedMineralId: mineralId }
}

export function rotateFamilyMineral(
  solution: FamilySolution,
  mineralId: MineralId,
): FamilySolution {
  return {
    guess: rotateGuessMineral(solution.guess, mineralId),
    selectedMineralId: mineralId,
    submittedResult: null,
  }
}

export function flipFamilyMineral(
  solution: FamilySolution,
  mineralId: MineralId,
): FamilySolution {
  return {
    guess: flipGuessMineral(solution.guess, mineralId),
    selectedMineralId: mineralId,
    submittedResult: null,
  }
}

export function returnFamilyMineral(
  solution: FamilySolution,
  mineralId: MineralId,
): FamilySolution {
  return {
    guess: returnGuessMineralToCase(solution.guess, mineralId),
    selectedMineralId: mineralId,
    submittedResult: null,
  }
}

export function submitFamilySolution(
  solution: FamilySolution,
  puzzle: Puzzle,
): FamilySolution {
  return {
    ...solution,
    submittedResult: compareGuess(puzzle, solution.guess),
  }
}
