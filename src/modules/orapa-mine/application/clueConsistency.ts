import type { MineralPlacement } from '../domain/minerals'
import { answerEdgeForPlacements, edgeAnswersMatch } from '../domain/questions'
import type { EdgeAnswer } from '../domain/questions'
import type { ClueNotebook } from './clueNotebook'

export type EdgeClueComparison = Readonly<{
  answer: EdgeAnswer
  matches: boolean
  preview: EdgeAnswer
}>

export type ClueConsistency = Readonly<{
  byAnswerId: ReadonlyMap<number, EdgeClueComparison>
  matchedClues: number
  totalClues: number
}>

export function evaluateClueConsistency(
  notebook: ClueNotebook,
  placements: ReadonlyArray<MineralPlacement>,
): ClueConsistency {
  const byAnswerId = new Map<number, EdgeClueComparison>()
  const countedQueries = new Set<string>()
  let matchedClues = 0

  for (const answer of notebook.answers) {
    if (answer.mode !== 'edge') {
      continue
    }

    const preview = answerEdgeForPlacements(
      placements,
      answer.query,
      -answer.id,
    )
    const matches = edgeAnswersMatch(answer, preview)

    byAnswerId.set(answer.id, { answer, matches, preview })

    if (!countedQueries.has(answer.query)) {
      countedQueries.add(answer.query)
      matchedClues += matches ? 1 : 0
    }
  }

  return {
    byAnswerId,
    matchedClues,
    totalClues: countedQueries.size,
  }
}
