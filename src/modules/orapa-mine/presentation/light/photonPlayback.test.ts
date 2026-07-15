import { describe, expect, it } from 'vitest'
import type { EdgeAnswer } from '../../domain/questions'
import { createPhotonPlayback } from './photonPlayback'

describe('photon playback', () => {
  it('paces one motion path and changes colors at traveled distances', () => {
    const answer: EdgeAnswer = {
      colorContacts: [
        { color: 'red', pathIndex: 0 },
        { color: 'yellow', pathIndex: 1 },
      ],
      exitLabel: 'R1',
      id: -1,
      message: 'Exit R1 - Orange',
      mode: 'edge',
      path: [
        { column: 0, row: 0 },
        { column: 1, row: 0 },
      ],
      query: 'L1',
      signalColor: 'orange',
    }

    expect(
      createPhotonPlayback(answer, [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
      ]),
    ).toEqual({
      colorStops: [
        { color: 'transparent', offset: 0 },
        { color: 'red', offset: 0.25 },
        { color: 'orange', offset: 0.5 },
        { color: 'orange', offset: 1 },
      ],
      durationMs: 900,
      motionPath: 'M 0 0 L 25 0 L 50 0 L 100 0',
    })
  })
})
