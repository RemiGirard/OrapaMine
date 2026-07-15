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
  clueConsistency: ClueConsistency
  currentAnswer: Answer | null
  currentRayPreview: Extract<Answer, { mode: 'edge' }> | null
  edgeAnswers: ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>>
  puzzle: (typeof preparedPuzzles)[number]
  rayPreviewsByPort: ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>>
  submissionReadiness: SolutionSubmissionReadiness
}>

export function createCooperativeGameView(
  game: CooperativeGame,
): CooperativeGameView {
  const puzzle = preparedPuzzles[game.puzzleIndex]
  const currentAnswer = latestClue(game.clueNotebook)
  const placements = toValidPlacedMinerals(game.familySolution.guess)
  const clueConsistency = evaluateClueConsistency(game.clueNotebook, placements)
  const rayPreviews = answerAllEdgesForPlacements(placements)

  return {
    clueConsistency,
    currentAnswer,
    currentRayPreview:
      currentAnswer?.mode === 'edge'
        ? (clueConsistency.byAnswerId.get(currentAnswer.id)?.preview ?? null)
        : null,
    edgeAnswers: knownEdgeClues(game.clueNotebook),
    puzzle,
    rayPreviewsByPort: new Map(
      rayPreviews.map((preview) => [preview.query, preview]),
    ),
    submissionReadiness: evaluateSolutionSubmissionReadiness(
      game.familySolution.guess,
      clueConsistency,
    ),
  }
}
