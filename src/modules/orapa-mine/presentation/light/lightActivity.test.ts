import { describe, expect, it } from 'vitest'
import type { EdgeAnswer } from '../../domain/questions'
import { resolveActiveLight } from './lightActivity'

const clue: EdgeAnswer = {
  colorContacts: [],
  exitLabel: 'B2',
  id: 1,
  message: 'Exit B2 - Red',
  mode: 'edge',
  path: [{ column: 1, row: 4 }],
  query: 'T2',
  signalColor: 'red',
}

describe('light activity display model', () => {
  it('gives a diagnostic shot priority over a verified link', () => {
    const diagnostic = { ...clue, id: -1, query: 'T3' }

    expect(
      resolveActiveLight({
        inspectedClue: clue,
        rayShot: { answer: diagnostic, sequence: 2 },
        showVerifiedRay: true,
        verifiedRay: clue,
      }),
    ).toEqual({ answer: diagnostic, state: 'diagnostic' })
  })

  it('shows passing light only for a visible verified ray', () => {
    expect(
      resolveActiveLight({
        inspectedClue: clue,
        rayShot: null,
        showVerifiedRay: true,
        verifiedRay: clue,
      }),
    ).toEqual({ answer: clue, state: 'verified' })
  })

  it('falls back to subdued clue inspection', () => {
    expect(
      resolveActiveLight({
        inspectedClue: clue,
        rayShot: null,
        showVerifiedRay: true,
        verifiedRay: null,
      }),
    ).toEqual({ answer: clue, state: 'clue' })
  })
})
