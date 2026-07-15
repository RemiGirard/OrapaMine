import { describe, expect, it } from 'vitest'
import type { GuessPlacement, MineralId } from '../../domain/minerals'
import {
  GLASS_CASE_GRID_SIZE,
  glassCasePieceLayout,
  glassCaseSlotLayout,
} from './glassCaseLayout'

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
    expect(glassCaseSlotLayout('red-parallelogram')).toMatchObject({
      height: 1,
      width: 3,
    })
    expect(glassCaseSlotLayout('yellow-triangle')).toMatchObject({
      height: 2,
      width: 2,
    })
    expect(glassCaseSlotLayout('blue-big-triangle')).toMatchObject({
      height: 2,
      width: 4,
    })
  })

  it('keeps the foam slot fixed while its glass rotates at one shared scale', () => {
    expect(
      glassCasePieceLayout(placement('red-parallelogram', 'north')),
    ).toEqual({
      heightPercent: 100,
      leftPercent: 0,
      topPercent: 0,
      widthPercent: 100,
    })
    const eastLayout = glassCasePieceLayout(
      placement('red-parallelogram', 'east'),
    )

    expect(eastLayout).toMatchObject({
      heightPercent: 300,
      topPercent: -100,
    })
    expect(eastLayout.leftPercent).toBeCloseTo(100 / 3)
    expect(eastLayout.widthPercent).toBeCloseTo(100 / 3)
  })

  it('keeps every fixed foam slot inside the case', () => {
    const mineralIds: ReadonlyArray<MineralId> = [
      'red-parallelogram',
      'yellow-triangle',
      'blue-big-triangle',
      'white-diamond',
      'white-big-triangle',
      'transparent-prism',
      'black-absorber',
    ]
    for (const mineralId of mineralIds) {
      const layout = glassCaseSlotLayout(mineralId)

      expect(layout.column + layout.width).toBeLessThanOrEqual(
        GLASS_CASE_GRID_SIZE,
      )
      expect(layout.row + layout.height).toBeLessThanOrEqual(
        GLASS_CASE_GRID_SIZE,
      )
    }
  })
})
