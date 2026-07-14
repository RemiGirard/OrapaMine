import { describe, expect, it } from 'vitest'
import { toPlacedMinerals, createEmptyGuess } from '../domain/familySolution'
import { preparedPuzzles } from '../domain/puzzles'
import { askForClue, createClueNotebook } from './clueNotebook'
import { evaluateClueConsistency } from './clueConsistency'

describe('clue consistency', () => {
  it('compares the current family map with each recorded edge clue', () => {
    const puzzle = preparedPuzzles[0]
    const withTopClue = askForClue(createClueNotebook(), puzzle, {
      id: 1,
      mode: 'edge',
      query: 'T1',
    })
    const notebook = askForClue(withTopClue, puzzle, {
      id: 2,
      mode: 'edge',
      query: 'L1',
    })
    const emptyPlacements = toPlacedMinerals(createEmptyGuess(puzzle))

    expect(evaluateClueConsistency(notebook, emptyPlacements)).toMatchObject({
      matchedClues: 0,
      totalClues: 2,
    })
    expect(evaluateClueConsistency(notebook, puzzle.placements)).toMatchObject({
      matchedClues: 2,
      totalClues: 2,
    })
  })

  it('counts repeated questions once while retaining each notebook comparison', () => {
    const puzzle = preparedPuzzles[0]
    const firstQuestion = askForClue(createClueNotebook(), puzzle, {
      id: 1,
      mode: 'edge',
      query: 'T1',
    })
    const repeatedQuestion = askForClue(firstQuestion, puzzle, {
      id: 2,
      mode: 'edge',
      query: 'T1',
    })
    const consistency = evaluateClueConsistency(
      repeatedQuestion,
      puzzle.placements,
    )

    expect(consistency.totalClues).toBe(1)
    expect(consistency.matchedClues).toBe(1)
    expect(consistency.byAnswerId.size).toBe(2)
  })
})
