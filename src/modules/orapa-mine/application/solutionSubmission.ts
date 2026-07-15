import {
  assessGuessPlacements,
  toPlacedMinerals,
} from '../domain/familySolution'
import type { GuessPlacement } from '../domain/minerals'
import type { ClueConsistency } from './clueConsistency'

export type SolutionSubmissionReadiness =
  | Readonly<{
      placedPlacements: number
      status: 'incomplete'
      totalPlacements: number
    }>
  | Readonly<{
      invalidPlacements: number
      status: 'invalid'
      totalPlacements: number
    }>
  | Readonly<{
      matchedClues: number
      status: 'conflicting-clues'
      totalClues: number
    }>
  | Readonly<{ status: 'ready' }>

export function evaluateSolutionSubmissionReadiness(
  guess: ReadonlyArray<GuessPlacement>,
  clueConsistency: ClueConsistency,
): SolutionSubmissionReadiness {
  const totalPlacements = guess.length
  const placedPlacements = toPlacedMinerals(guess).length

  if (placedPlacements < totalPlacements) {
    return {
      placedPlacements,
      status: 'incomplete',
      totalPlacements,
    }
  }

  const assessments = assessGuessPlacements(guess)
  const invalidPlacements = guess.filter(
    (placement) => assessments.get(placement.mineralId)?.valid === false,
  ).length

  if (invalidPlacements > 0) {
    return {
      invalidPlacements,
      status: 'invalid',
      totalPlacements,
    }
  }

  if (clueConsistency.matchedClues < clueConsistency.totalClues) {
    return {
      matchedClues: clueConsistency.matchedClues,
      status: 'conflicting-clues',
      totalClues: clueConsistency.totalClues,
    }
  }

  return { status: 'ready' }
}
