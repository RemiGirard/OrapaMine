import type { Answer } from '../../domain/questions'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function isVisibleRay(answer: RayAnswer | null): answer is RayAnswer {
  return answer !== null && answer.signalColor !== 'transparent'
}
