import { describe, expect, it } from 'vitest'
import { parseEdgePort, parseGridCoordinate } from './coordinates'
import { mixSignalColor } from './colors'
import {
  assessGuessPlacements,
  compareGuess,
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  rotateGuessMineral,
} from './familySolution'
import { canPlaceMineralWithOrientation, placementsOverlap } from './minerals'
import { preparedPuzzles } from './puzzles'
import type { Puzzle } from './puzzles'
import { answerAllEdgesForPlacements, answerQuestion } from './questions'
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
    expect(
      answerQuestion(singleBlackPuzzle, 'coordinate', 'C1,R1', 2),
    ).toMatchObject({
      message: 'Signal absorbed',
      signalColor: 'absorbed',
    })
  })

  it('derives every edge ray from the current placements', () => {
    const answers = answerAllEdgesForPlacements(singleBlackPuzzle.placements)

    expect(answers).toHaveLength(36)
    expect(answers.find((answer) => answer.query === 'T1')).toMatchObject({
      message: 'Signal absorbed',
      signalColor: 'absorbed',
    })
    expect(answers.find((answer) => answer.query === 'T8')).toMatchObject({
      exitLabel: 'B8',
      signalColor: 'transparent',
    })
  })

  it('keeps every traversing edge answer reciprocal', () => {
    for (const puzzle of preparedPuzzles) {
      const answers = answerAllEdgesForPlacements(puzzle.placements)
      const answersByQuery = new Map(
        answers.map((answer) => [answer.query, answer]),
      )

      for (const answer of answers) {
        if (!answer.exitLabel) {
          continue
        }

        expect(answersByQuery.get(answer.exitLabel)).toMatchObject({
          exitLabel: answer.query,
          signalColor: answer.signalColor,
        })
      }
    }
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
          origin: { column: 0, row: 2 },
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

  it('rotates placed glass around its center even across the board edge', () => {
    const puzzle: Puzzle = {
      id: 'test-centered-rotation',
      placements: [
        { mineralId: 'red-parallelogram', origin: { column: 0, row: 0 } },
      ],
      ruleset: 'basic',
      title: 'Test Centered Rotation',
    }
    const placed = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 0, row: 0 },
    )
    const rotated = rotateGuessMineral(placed, 'red-parallelogram')

    expect(rotated[0]).toMatchObject({
      orientation: 'east',
      origin: { column: 1, row: -1 },
    })
    expect(assessGuessPlacements(rotated).get('red-parallelogram')).toEqual({
      issues: ['outside-board'],
      valid: false,
    })
  })

  it('keeps overlapping placements and marks every conflicting piece', () => {
    const puzzle: Puzzle = {
      id: 'test-invalid-overlap',
      placements: [
        { mineralId: 'red-parallelogram', origin: { column: 0, row: 0 } },
        { mineralId: 'yellow-triangle', origin: { column: 4, row: 4 } },
      ],
      ruleset: 'basic',
      title: 'Test Invalid Overlap',
    }
    const redPlaced = moveGuessMineral(
      createEmptyGuess(puzzle),
      'red-parallelogram',
      { column: 2, row: 3 },
    )
    const overlapping = moveGuessMineral(redPlaced, 'yellow-triangle', {
      column: 2,
      row: 3,
    })
    const assessments = assessGuessPlacements(overlapping)

    expect(overlapping[1]?.origin).toEqual({ column: 2, row: 3 })
    expect(assessments.get('red-parallelogram')).toEqual({
      issues: ['overlap'],
      valid: false,
    })
    expect(assessments.get('yellow-triangle')).toEqual({
      issues: ['overlap'],
      valid: false,
    })
  })

  it('rotates gemstone orientations clockwise through a complete turn', () => {
    const puzzle: Puzzle = {
      id: 'test-rotation-cycle',
      placements: [
        { mineralId: 'red-parallelogram', origin: { column: 1, row: 1 } },
      ],
      ruleset: 'basic',
      title: 'Test Rotation Cycle',
    }
    let guess = createEmptyGuess(puzzle)
    const orientations = []

    for (let turn = 0; turn < 4; turn += 1) {
      guess = rotateGuessMineral(guess, 'red-parallelogram')
      orientations.push(guess[0]?.orientation)
    }

    expect(orientations).toEqual(['east', 'south', 'west', 'north'])
  })

  it('treats gemstone face as part of the family solution', () => {
    const puzzle: Puzzle = {
      id: 'test-flipped',
      title: 'Test Flipped',
      ruleset: 'basic',
      placements: [
        {
          face: 'back',
          mineralId: 'red-parallelogram',
          orientation: 'north',
          origin: { column: 1, row: 1 },
        },
      ],
    }
    const frontGuess = moveGuessMineral(
      createEmptyGuess(puzzle).map((placement) => ({
        ...placement,
        face: 'front',
      })),
      'red-parallelogram',
      { column: 1, row: 1 },
    )
    const flippedGuess = flipGuessMineral(frontGuess, 'red-parallelogram')

    expect(compareGuess(puzzle, frontGuess).solved).toBe(false)
    expect(compareGuess(puzzle, flippedGuess).solved).toBe(true)
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
