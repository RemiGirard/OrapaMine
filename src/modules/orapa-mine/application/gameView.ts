import { toValidPlacedMinerals } from '../domain/familySolution'
import { preparedPuzzles } from '../domain/puzzles'
import { answerAllEdgesForPlacements } from '../domain/questions'
import type { Answer } from '../domain/questions'
import { evaluateClueConsistency } from './clueConsistency'
import type { ClueConsistency } from './clueConsistency'
import { knownEdgeClues, latestClue } from './clueNotebook'
import type { CooperativeGame } from './cooperativeGame'
import { evaluateSolutionSubmissionReadiness } from './solutionSubmission'
import type { SolutionSubmissionReadiness } from './solutionSubmission'

export type CooperativeGameView = Readonly<{
  allRayPreviews: ReadonlyArray<Extract<Answer, { mode: 'edge' }>>
  clueConsistency: ClueConsistency
  currentAnswer: Answer | null
  currentRayPreview: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers: ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>>
  puzzle: (typeof preparedPuzzles)[number]
  submissionReadiness: SolutionSubmissionReadiness
}>

export function createCooperativeGameView(
  game: CooperativeGame,
): CooperativeGameView {
  const puzzle = preparedPuzzles[game.puzzleIndex]
  const currentAnswer = latestClue(game.clueNotebook)
  const placements = toValidPlacedMinerals(game.familySolution.guess)
  const clueConsistency = evaluateClueConsistency(game.clueNotebook, placements)

  return {
    allRayPreviews: answerAllEdgesForPlacements(placements),
    clueConsistency,
    currentAnswer,
    currentRayPreview:
      currentAnswer?.mode === 'edge'
        ? (clueConsistency.byAnswerId.get(currentAnswer.id)?.preview ?? null)
        : null,
    edgeAnswers: knownEdgeClues(game.clueNotebook),
    puzzle,
    submissionReadiness: evaluateSolutionSubmissionReadiness(
      game.familySolution.guess,
      clueConsistency,
    ),
  }
}
