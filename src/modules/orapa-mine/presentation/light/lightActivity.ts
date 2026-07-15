import type { EdgeAnswer } from '../../domain/questions'
import type { RayShot } from './useRayShot'
import { isVisibleRay } from './lightVisibility'

export type LightActivityState = 'clue' | 'diagnostic' | 'verified'

export type ActiveLight = Readonly<{
  answer: EdgeAnswer
  state: LightActivityState
}>

export function resolveActiveLight({
  inspectedClue,
  rayShot,
  showVerifiedRay,
  verifiedRay,
}: Readonly<{
  inspectedClue: EdgeAnswer | null
  rayShot: RayShot | null
  showVerifiedRay: boolean
  verifiedRay: EdgeAnswer | null
}>): ActiveLight | null {
  if (rayShot) {
    return { answer: rayShot.answer, state: 'diagnostic' }
  }

  if (showVerifiedRay && isVisibleRay(verifiedRay)) {
    return { answer: verifiedRay, state: 'verified' }
  }

  return inspectedClue ? { answer: inspectedClue, state: 'clue' } : null
}
