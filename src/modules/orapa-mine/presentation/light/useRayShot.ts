import { useCallback, useState } from 'react'
import type { Answer } from '../../domain/questions'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export type RayShot = Readonly<{
  answer: RayAnswer
  sequence: number
}>

export function useRayShot(answers: ReadonlyArray<RayAnswer>) {
  const [rayShot, setRayShot] = useState<RayShot | null>(null)

  const shootRay = useCallback(
    (edgeLabel: string) => {
      const answer = answers.find((candidate) => candidate.query === edgeLabel)

      setRayShot((currentShot) =>
        answer?.signalColor === 'transparent'
          ? {
              answer,
              sequence: (currentShot?.sequence ?? 0) + 1,
            }
          : null,
      )
    },
    [answers],
  )

  return { rayShot, shootRay }
}
