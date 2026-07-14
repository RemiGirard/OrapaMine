import { describe, expect, it } from 'vitest'
import { parseEdgePort, parseGridCoordinate } from './coordinates'
import { mixSignalColor } from './colors'
import { answerQuestion } from './questions'
import { compareGuess, createEmptyGuess, moveGuessMineral } from './puzzles'
import type { Puzzle } from './puzzles'

const singleBlackPuzzle: Puzzle = {
  id: 'test-black',
  title: 'Test Black',
  ruleset: 'expansion',
  placements: [{ mineralId: 'black-body', origin: { column: 0, row: 0 } }],
}

describe('Orapa Mine domain', () => {
  it('parses edge launch labels around the 10 by 8 grid', () => {
    expect(parseEdgePort('1')).toEqual({
      direction: 'south',
      label: '1',
      start: { column: 0, row: -1 },
    })
    expect(parseEdgePort('11')).toEqual({
      direction: 'west',
      label: '11',
      start: { column: 10, row: 0 },
    })
    expect(parseEdgePort('A')).toEqual({
      direction: 'east',
      label: 'A',
      start: { column: -1, row: 0 },
    })
    expect(parseEdgePort('R')).toEqual({
      direction: 'north',
      label: 'R',
      start: { column: 9, row: 8 },
    })
  })

  it('parses spoken-style coordinate questions', () => {
    expect(parseGridCoordinate('4,E')).toEqual({ column: 3, row: 4 })
    expect(parseGridCoordinate('E4')).toEqual({ column: 3, row: 4 })
  })

  it('mixes signal colors using first-hit color contacts', () => {
    expect(mixSignalColor(new Set(['red', 'yellow']))).toBe('orange')
    expect(mixSignalColor(new Set(['red', 'blue', 'white']))).toBe(
      'light-purple',
    )
    expect(mixSignalColor(new Set(['red', 'yellow', 'blue', 'white']))).toBe(
      'gray',
    )
  })

  it('absorbs waves and coordinate checks on black gemstones', () => {
    expect(answerQuestion(singleBlackPuzzle, 'edge', '1', 1)).toMatchObject({
      message: 'Signal absorbed',
      signalColor: 'absorbed',
    })
    expect(answerQuestion(singleBlackPuzzle, 'coordinate', 'A1', 2)).toMatchObject({
      message: 'Signal absorbed',
      signalColor: 'absorbed',
    })
  })

  it('compares a family guess against the puzzle solution', () => {
    const puzzle: Puzzle = {
      id: 'test-basic',
      title: 'Test Basic',
      ruleset: 'basic',
      placements: [
        { mineralId: 'red-parallelogram', origin: { column: 1, row: 1 } },
      ],
    }
    const guess = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 1, row: 1 },
    )

    expect(compareGuess(puzzle, guess)).toEqual({
      exactPlacements: 1,
      solved: true,
      totalPlacements: 1,
    })
  })
})
