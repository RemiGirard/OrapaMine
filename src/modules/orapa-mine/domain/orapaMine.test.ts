import { describe, expect, it } from 'vitest'
import { parseEdgePort, parseGridCoordinate } from './coordinates'
import { mixSignalColor } from './colors'
import { answerQuestion } from './questions'
import {
  compareGuess,
  createEmptyGuess,
  moveGuessMineral,
  preparedPuzzles,
  rotateGuessMineral,
} from './puzzles'
import type { Puzzle } from './puzzles'
import { canPlaceMineralWithOrientation, placementsOverlap } from './minerals'
import { parseVoiceQuestion } from './voiceCommands'

const singleBlackPuzzle: Puzzle = {
  id: 'test-black',
  title: 'Test Black',
  ruleset: 'expansion',
  placements: [{ mineralId: 'black-absorber', origin: { column: 0, row: 0 } }],
}

describe('Orapa Mine domain', () => {
  it('parses edge launch labels around the 8 by 10 grid', () => {
    expect(parseEdgePort('T1')).toEqual({
      direction: 'south',
      label: 'T1',
      start: { column: 0, row: -1 },
    })
    expect(parseEdgePort('R1')).toEqual({
      direction: 'west',
      label: 'R1',
      start: { column: 8, row: 0 },
    })
    expect(parseEdgePort('L1')).toEqual({
      direction: 'east',
      label: 'L1',
      start: { column: -1, row: 0 },
    })
    expect(parseEdgePort('B8')).toEqual({
      direction: 'north',
      label: 'B8',
      start: { column: 7, row: 10 },
    })
  })

  it('parses spoken-style coordinate questions', () => {
    expect(parseGridCoordinate('C4,R5')).toEqual({ column: 3, row: 4 })
    expect(parseGridCoordinate('R5C4')).toEqual({ column: 3, row: 4 })
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
    expect(answerQuestion(singleBlackPuzzle, 'edge', 'T1', 1)).toMatchObject({
      message: 'Signal absorbed',
      signalColor: 'absorbed',
    })
    expect(answerQuestion(singleBlackPuzzle, 'coordinate', 'C1,R1', 2)).toMatchObject({
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

  it('treats gemstone orientation as part of the family solution', () => {
    const puzzle: Puzzle = {
      id: 'test-oriented',
      title: 'Test Oriented',
      ruleset: 'basic',
      placements: [
        {
          mineralId: 'red-parallelogram',
          orientation: 'south',
          origin: { column: 1, row: 1 },
        },
      ],
    }
    const wrongOrientationGuess = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 1, row: 1 },
      'east',
    )
    const correctGuess = rotateGuessMineral(
      wrongOrientationGuess,
      'red-parallelogram',
    )

    expect(compareGuess(puzzle, wrongOrientationGuess).solved).toBe(false)
    expect(compareGuess(puzzle, correctGuess).solved).toBe(true)
  })

  it('keeps prepared puzzle pieces inside the board without overlap', () => {
    for (const puzzle of preparedPuzzles) {
      expect(placementsOverlap(puzzle.placements)).toBe(false)

      for (const placement of puzzle.placements) {
        expect(
          canPlaceMineralWithOrientation(
            placement.mineralId,
            placement.origin,
            placement.orientation ?? 'north',
          ),
        ).toBe(true)
      }
    }
  })

  it('parses spoken ray and cell questions', () => {
    expect(parseVoiceQuestion('send ray right six')).toEqual({
      mode: 'edge',
      query: 'R6',
    })
    expect(parseVoiceQuestion('query cell column four row five')).toEqual({
      mode: 'coordinate',
      query: '45',
    })
  })
})
