import { describe, expect, it } from 'vitest'
import { createEmptyGuess } from '../domain/familySolution'
import type { GuessPlacement } from '../domain/minerals'
import { preparedPuzzles } from '../domain/puzzles'
import type { ClueConsistency } from './clueConsistency'
import { evaluateSolutionSubmissionReadiness } from './solutionSubmission'

const noClues: ClueConsistency = {
  byAnswerId: new Map(),
  matchedClues: 0,
  totalClues: 0,
}

describe('solution submission readiness', () => {
  it('requires every glass piece to be placed', () => {
    const guess = createEmptyGuess(preparedPuzzles[0])

    expect(evaluateSolutionSubmissionReadiness(guess, noClues)).toEqual({
      placedPlacements: 0,
      status: 'incomplete',
      totalPlacements: 5,
    })
  })

  it('reports invalid glass before evaluating clues', () => {
    const guess = solvedGuess().map((placement, index) =>
      index < 2 ? { ...placement, origin: { column: 0, row: 0 } } : placement,
    )

    expect(evaluateSolutionSubmissionReadiness(guess, noClues)).toEqual({
      invalidPlacements: 2,
      status: 'invalid',
      totalPlacements: 5,
    })
  })

  it('reports clues that disagree with a complete valid map', () => {
    const clueConsistency: ClueConsistency = {
      byAnswerId: new Map(),
      matchedClues: 2,
      totalClues: 3,
    }

    expect(
      evaluateSolutionSubmissionReadiness(solvedGuess(), clueConsistency),
    ).toEqual({
      matchedClues: 2,
      status: 'conflicting-clues',
      totalClues: 3,
    })
  })

  it('is ready when every placement is valid and every clue matches', () => {
    const clueConsistency: ClueConsistency = {
      byAnswerId: new Map(),
      matchedClues: 3,
      totalClues: 3,
    }

    expect(
      evaluateSolutionSubmissionReadiness(solvedGuess(), clueConsistency),
    ).toEqual({ status: 'ready' })
  })
})

function solvedGuess(): Array<GuessPlacement> {
  const puzzle = preparedPuzzles[0]

  return createEmptyGuess(puzzle).map((placement) => {
    const solutionPlacement = puzzle.placements.find(
      (candidate) => candidate.mineralId === placement.mineralId,
    )

    if (!solutionPlacement) {
      throw new Error(`Missing solution placement for ${placement.mineralId}`)
    }

    return {
      ...placement,
      face: solutionPlacement.face ?? placement.face,
      orientation: solutionPlacement.orientation ?? placement.orientation,
      origin: solutionPlacement.origin,
    }
  })
}
