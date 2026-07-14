import { toPlacedMinerals } from '../domain/familySolution'
import { preparedPuzzles } from '../domain/puzzles'
import {
  answerAllEdgesForPlacements,
  answerEdgeForPlacements,
} from '../domain/questions'
import type { Answer } from '../domain/questions'
import { knownEdgeClues, latestClue } from './clueNotebook'
import type { CooperativeGame } from './cooperativeGame'

export type CooperativeGameView = Readonly<{
  allRayPreviews: ReadonlyArray<Extract<Answer, { mode: 'edge' }>>
  currentAnswer: Answer | null
  currentRayPreview: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers: ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>>
  puzzle: (typeof preparedPuzzles)[number]
}>

export function createCooperativeGameView(
  game: CooperativeGame,
): CooperativeGameView {
  const puzzle = preparedPuzzles[game.puzzleIndex]
  const currentAnswer = latestClue(game.clueNotebook)
  const placements = toPlacedMinerals(game.familySolution.guess)

  return {
    allRayPreviews: answerAllEdgesForPlacements(placements),
    currentAnswer,
    currentRayPreview:
      currentAnswer?.mode === 'edge'
        ? answerEdgeForPlacements(
            placements,
            currentAnswer.query,
            -currentAnswer.id,
          )
        : null,
    edgeAnswers: knownEdgeClues(game.clueNotebook),
    puzzle,
  }
}
