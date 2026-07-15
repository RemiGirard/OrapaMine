import { describe, expect, it } from 'vitest'
import { toPlacedMinerals } from '../domain/familySolution'
import type { Answer, EdgeAnswer } from '../domain/questions'
import { createCooperativeGame, reduceCooperativeGame } from './cooperativeGame'
import { createCooperativeGameView } from './gameView'

describe('cooperative game use cases', () => {
  it('starts a puzzle with an empty family solution and live rays visible', () => {
    const game = createCooperativeGame()
    const view = createCooperativeGameView(game)

    expect(game.clueNotebook.answers).toEqual([])
    expect(toPlacedMinerals(game.familySolution.guess)).toEqual([])
    expect(game.lightDisplay).toEqual({
      showAllRays: true,
      showCurrentRay: true,
    })
    expect(view.allRayPreviews).toHaveLength(36)
    expect(view.submissionReadiness).toEqual({
      placedPlacements: 0,
      status: 'incomplete',
      totalPlacements: 5,
    })
  })

  it('ignores submission until the family map is ready', () => {
    const game = createCooperativeGame()

    expect(
      reduceCooperativeGame(game, { type: 'submit-family-solution' }),
    ).toBe(game)
  })

  it('records a clue and previews that ray through the family placement', () => {
    const withMineral = reduceCooperativeGame(createCooperativeGame(), {
      mineralId: 'red-parallelogram',
      origin: { column: 2, row: 2 },
      type: 'place-family-mineral',
    })
    const withClue = reduceCooperativeGame(withMineral, {
      id: 42,
      mode: 'edge',
      query: 'T3',
      type: 'ask-clue',
    })
    const view = createCooperativeGameView(withClue)

    expect(withClue.clueNotebook.answers[0]).toMatchObject({
      id: 42,
      mode: 'edge',
      query: 'T3',
    })
    expect(view.currentRayPreview).toMatchObject({
      id: -42,
      mode: 'edge',
      query: 'T3',
    })
    const recordedClue = withClue.clueNotebook.answers[0]

    assertTraversingEdge(recordedClue)
    expect(view.edgeAnswers.get(recordedClue.query)).toBe(recordedClue)
    expect(view.edgeAnswers.get(recordedClue.exitLabel)).toMatchObject({
      exitLabel: recordedClue.query,
      query: recordedClue.exitLabel,
      signalColor: recordedClue.signalColor,
    })
  })

  it('keeps invalid overlapping glass out of the optical preview', () => {
    const withRuby = reduceCooperativeGame(createCooperativeGame(), {
      mineralId: 'red-parallelogram',
      origin: { column: 2, row: 3 },
      type: 'place-family-mineral',
    })
    const withOverlap = reduceCooperativeGame(withRuby, {
      mineralId: 'yellow-triangle',
      origin: { column: 2, row: 3 },
      type: 'place-family-mineral',
    })
    const view = createCooperativeGameView(withOverlap)

    expect(
      view.allRayPreviews.every(
        (preview) => preview.signalColor === 'transparent',
      ),
    ).toBe(true)
  })

  it('ignores a clue that is already recorded in either direction', () => {
    const withClue = reduceCooperativeGame(createCooperativeGame(), {
      id: 1,
      mode: 'edge',
      query: 'T1',
      type: 'ask-clue',
    })
    const recordedClue = withClue.clueNotebook.answers[0]

    assertTraversingEdge(recordedClue)

    const repeatedClue = reduceCooperativeGame(withClue, {
      id: 2,
      mode: 'edge',
      query: 't1',
      type: 'ask-clue',
    })
    const reversedClue = reduceCooperativeGame(withClue, {
      id: 3,
      mode: 'edge',
      query: recordedClue.exitLabel,
      type: 'ask-clue',
    })

    expect(repeatedClue.clueNotebook).toBe(withClue.clueNotebook)
    expect(reversedClue.clueNotebook).toBe(withClue.clueNotebook)
    expect(withClue.clueNotebook.answers).toHaveLength(1)
    expect(withClue.clueNotebook.answers[0].id).toBe(1)
  })

  it('resets puzzle-scoped features when starting the next puzzle', () => {
    const withClue = reduceCooperativeGame(createCooperativeGame(), {
      id: 1,
      mode: 'edge',
      query: 'L1',
      type: 'ask-clue',
    })
    const hiddenRays = reduceCooperativeGame(withClue, {
      type: 'set-all-rays-visible',
      visible: false,
    })
    const nextGame = reduceCooperativeGame(hiddenRays, { type: 'next-puzzle' })

    expect(nextGame.puzzleIndex).toBe(1)
    expect(nextGame.clueNotebook.answers).toEqual([])
    expect(nextGame.lightDisplay.showAllRays).toBe(true)
    expect(toPlacedMinerals(nextGame.familySolution.guess)).toEqual([])
  })
})

function assertTraversingEdge(
  answer: Answer,
): asserts answer is EdgeAnswer & { exitLabel: string } {
  if (answer.mode !== 'edge' || !answer.exitLabel) {
    throw new Error('Expected a traversing edge clue')
  }
}
