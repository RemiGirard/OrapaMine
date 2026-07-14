import { describe, expect, it } from 'vitest'
import { toPlacedMinerals } from '../domain/familySolution'
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
  })

  it('ignores a clue that is already recorded', () => {
    const withClue = reduceCooperativeGame(createCooperativeGame(), {
      id: 1,
      mode: 'edge',
      query: 'T3',
      type: 'ask-clue',
    })
    const repeatedClue = reduceCooperativeGame(withClue, {
      id: 2,
      mode: 'edge',
      query: 't3',
      type: 'ask-clue',
    })

    expect(repeatedClue.clueNotebook).toBe(withClue.clueNotebook)
    expect(repeatedClue.clueNotebook.answers).toHaveLength(1)
    expect(repeatedClue.clueNotebook.answers[0].id).toBe(1)
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
