import { useCallback, useState } from 'react'
import type { Answer } from '../../domain/questions'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export type RayShot = Readonly<{
  answer: RayAnswer
  sequence: number
}>

export function useRayShot(answersByPort: ReadonlyMap<string, RayAnswer>) {
  const [rayShot, setRayShot] = useState<RayShot | null>(null)

  const shootRay = useCallback(
    (edgeLabel: string) => {
      const answer = answersByPort.get(edgeLabel)

      setRayShot((currentShot) =>
        answer
          ? {
              answer,
              sequence: (currentShot?.sequence ?? 0) + 1,
            }
          : null,
      )
    },
    [answersByPort],
  )

  const completeRayShot = useCallback((sequence: number) => {
    setRayShot((currentShot) =>
      currentShot?.sequence === sequence ? null : currentShot,
    )
  }, [])

  return { completeRayShot, rayShot, shootRay }
}
