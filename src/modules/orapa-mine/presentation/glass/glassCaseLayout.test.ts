import { describe, expect, it } from 'vitest'
import type { GuessPlacement, MineralId } from '../../domain/minerals'
import { GLASS_CASE_GRID_SIZE, glassCaseSlotLayout } from './glassCaseLayout'

function placement(
  mineralId: MineralId,
  orientation: GuessPlacement['orientation'] = 'north',
): GuessPlacement {
  return {
    face: 'front',
    mineralId,
    orientation,
    origin: null,
  }
}

describe('glass case layout', () => {
  it('uses the real mineral dimensions on one shared scale', () => {
    expect(glassCaseSlotLayout(placement('red-parallelogram'))).toMatchObject({
      height: 1,
      width: 3,
    })
    expect(glassCaseSlotLayout(placement('yellow-triangle'))).toMatchObject({
      height: 2,
      width: 2,
    })
    expect(glassCaseSlotLayout(placement('blue-big-triangle'))).toMatchObject({
      height: 2,
      width: 4,
    })
  })

  it('keeps every orientation inside the case', () => {
    const mineralIds: ReadonlyArray<MineralId> = [
      'red-parallelogram',
      'yellow-triangle',
      'blue-big-triangle',
      'white-diamond',
      'white-big-triangle',
      'transparent-prism',
      'black-absorber',
    ]
    const orientations: ReadonlyArray<GuessPlacement['orientation']> = [
      'north',
      'east',
      'south',
      'west',
    ]

    for (const mineralId of mineralIds) {
      for (const orientation of orientations) {
        const layout = glassCaseSlotLayout(placement(mineralId, orientation))

        expect(layout.column + layout.width).toBeLessThanOrEqual(
          GLASS_CASE_GRID_SIZE,
        )
        expect(layout.row + layout.height).toBeLessThanOrEqual(
          GLASS_CASE_GRID_SIZE,
        )
      }
    }
  })
})
