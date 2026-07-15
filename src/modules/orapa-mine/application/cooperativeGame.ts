import type { Coordinate } from '../domain/coordinates'
import {
  difficultyForPuzzleIndex,
  puzzleIndexForDifficulty,
} from '../domain/gameConfiguration'
import type { GameDifficulty } from '../domain/gameConfiguration'
import type { MineralId } from '../domain/minerals'
import { preparedPuzzles } from '../domain/puzzles'
import type { QuestionMode } from '../domain/questions'
import { toValidPlacedMinerals } from '../domain/familySolution'
import { askForClue, createClueNotebook } from './clueNotebook'
import type { ClueNotebook } from './clueNotebook'
import { evaluateClueConsistency } from './clueConsistency'
import {
  flipFamilyMineral,
  placeFamilyMineral,
  returnFamilyMineral,
  rotateFamilyMineral,
  selectFamilyMineral,
  startFamilySolution,
  submitFamilySolution,
} from './familySolution'
import type { FamilySolution } from './familySolution'
import { evaluateSolutionSubmissionReadiness } from './solutionSubmission'

export type LightDisplay = Readonly<{
  showAllRays: boolean
  showCurrentRay: boolean
}>

export type CooperativeGame = Readonly<{
  clueNotebook: ClueNotebook
  difficulty: GameDifficulty
  familySolution: FamilySolution
  lightDisplay: LightDisplay
  puzzleIndex: number
  showSolution: boolean
}>

export type CooperativeGameEvent =
  | Readonly<{ type: 'next-puzzle' }>
  | Readonly<{ difficulty: GameDifficulty; type: 'start-game' }>
  | Readonly<{
      type: 'ask-clue'
      id: number
      mode: QuestionMode
      query: string
    }>
  | Readonly<{
      type: 'place-family-mineral'
      mineralId: MineralId
      origin: Coordinate
    }>
  | Readonly<{ type: 'select-family-mineral'; mineralId: MineralId }>
  | Readonly<{ type: 'rotate-family-mineral'; mineralId: MineralId }>
  | Readonly<{ type: 'flip-family-mineral'; mineralId: MineralId }>
  | Readonly<{ type: 'return-family-mineral'; mineralId: MineralId }>
  | Readonly<{ type: 'reset-family-solution' }>
  | Readonly<{ type: 'submit-family-solution' }>
  | Readonly<{ type: 'set-solution-visible'; visible: boolean }>
  | Readonly<{ type: 'set-all-rays-visible'; visible: boolean }>
  | Readonly<{ type: 'set-current-ray-visible'; visible: boolean }>

export function createCooperativeGame(
  difficulty: GameDifficulty = 'easy',
): CooperativeGame {
  const puzzleIndex = puzzleIndexForDifficulty(difficulty)
  const puzzle = preparedPuzzles[puzzleIndex]

  return {
    clueNotebook: createClueNotebook(),
    difficulty,
    familySolution: startFamilySolution(puzzle),
    lightDisplay: {
      showAllRays: true,
      showCurrentRay: true,
    },
    puzzleIndex,
    showSolution: false,
  }
}

export function reduceCooperativeGame(
  game: CooperativeGame,
  event: CooperativeGameEvent,
): CooperativeGame {
  const puzzle = preparedPuzzles[game.puzzleIndex]

  switch (event.type) {
    case 'start-game':
      return createCooperativeGame(event.difficulty)
    case 'next-puzzle':
      return createCooperativeGame(
        difficultyForPuzzleIndex(
          (game.puzzleIndex + 1) % preparedPuzzles.length,
        ),
      )
    case 'ask-clue':
      return {
        ...game,
        clueNotebook: askForClue(game.clueNotebook, puzzle, event),
      }
    case 'place-family-mineral':
      return {
        ...game,
        familySolution: placeFamilyMineral(
          game.familySolution,
          event.mineralId,
          event.origin,
        ),
      }
    case 'select-family-mineral':
      return {
        ...game,
        familySolution: selectFamilyMineral(
          game.familySolution,
          event.mineralId,
        ),
      }
    case 'rotate-family-mineral':
      return {
        ...game,
        familySolution: rotateFamilyMineral(
          game.familySolution,
          event.mineralId,
        ),
      }
    case 'flip-family-mineral':
      return {
        ...game,
        familySolution: flipFamilyMineral(game.familySolution, event.mineralId),
      }
    case 'return-family-mineral':
      return {
        ...game,
        familySolution: returnFamilyMineral(
          game.familySolution,
          event.mineralId,
        ),
      }
    case 'reset-family-solution':
      return {
        ...game,
        familySolution: startFamilySolution(puzzle),
        showSolution: false,
      }
    case 'submit-family-solution':
      if (
        evaluateSolutionSubmissionReadiness(
          game.familySolution.guess,
          evaluateClueConsistency(
            game.clueNotebook,
            toValidPlacedMinerals(game.familySolution.guess),
          ),
        ).status !== 'ready'
      ) {
        return game
      }

      return {
        ...game,
        familySolution: submitFamilySolution(game.familySolution, puzzle),
      }
    case 'set-solution-visible':
      return { ...game, showSolution: event.visible }
    case 'set-all-rays-visible':
      return {
        ...game,
        lightDisplay: { ...game.lightDisplay, showAllRays: event.visible },
      }
    case 'set-current-ray-visible':
      return {
        ...game,
        lightDisplay: { ...game.lightDisplay, showCurrentRay: event.visible },
      }
  }
}
