import { preparedPuzzles } from './puzzles'
import type { Puzzle } from './puzzles'

export type GameDifficulty = 'easy' | 'classic' | 'nearly-impossible'

const puzzleIdByDifficulty: Record<GameDifficulty, Puzzle['id']> = {
  easy: 'resting-place',
  classic: 'deep-vein',
  'nearly-impossible': 'expert-shaft',
}

export const gameDifficulties: ReadonlyArray<GameDifficulty> = [
  'easy',
  'classic',
  'nearly-impossible',
]

export function puzzleForDifficulty(difficulty: GameDifficulty): Puzzle {
  const puzzleId = puzzleIdByDifficulty[difficulty]
  const puzzle = preparedPuzzles.find((candidate) => candidate.id === puzzleId)

  if (!puzzle) {
    throw new Error(`Missing prepared puzzle for ${difficulty}`)
  }

  return puzzle
}

export function puzzleIndexForDifficulty(difficulty: GameDifficulty): number {
  const puzzle = puzzleForDifficulty(difficulty)

  return preparedPuzzles.indexOf(puzzle)
}

export function difficultyForPuzzleIndex(puzzleIndex: number): GameDifficulty {
  const puzzle = preparedPuzzles[puzzleIndex]
  const difficulty = gameDifficulties.find(
    (candidate) => puzzleIdByDifficulty[candidate] === puzzle.id,
  )

  if (!difficulty) {
    throw new Error(`Puzzle ${puzzle.id} has no difficulty`)
  }

  return difficulty
}
