import { describe, expect, it } from 'vitest'
import type {
  GuessPlacement,
  MineralFace,
  MineralId,
  Orientation,
} from '../../domain/minerals'
import {
  GLASS_CASE_GRID_SIZE,
  glassCaseCavityLayout,
  glassCasePieceLayout,
  glassCaseSlotLayout,
} from './glassCaseLayout'

const mineralIds: ReadonlyArray<MineralId> = [
  'red-parallelogram',
  'yellow-triangle',
  'blue-big-triangle',
  'white-diamond',
  'white-big-triangle',
  'transparent-prism',
  'black-absorber',
]

const orientations: ReadonlyArray<Orientation> = [
  'north',
  'east',
  'south',
  'west',
]

const faces: ReadonlyArray<MineralFace> = ['front', 'back']

function placement(
  mineralId: MineralId,
  orientation: Orientation = 'north',
  face: MineralFace = 'front',
): GuessPlacement {
  return {
    face,
    mineralId,
    orientation,
    origin: null,
  }
}

describe('glass case layout', () => {
  it('packs stable rotation envelopes into two aligned rows', () => {
    expect(glassCaseSlotLayout('red-parallelogram')).toEqual({
      column: 0,
      height: 3,
      row: 1,
      width: 3,
    })
    expect(glassCaseSlotLayout('yellow-triangle')).toEqual({
      column: 4,
      height: 2,
      row: 1,
      width: 2,
    })
    expect(glassCaseSlotLayout('blue-big-triangle')).toEqual({
      column: 8,
      height: 4,
      row: 0,
      width: 4,
    })
    expect(glassCaseSlotLayout('white-diamond')).toEqual({
      column: 1,
      height: 2,
      row: 7,
      width: 2,
    })
    expect(glassCaseSlotLayout('white-big-triangle')).toEqual({
      column: 5,
      height: 4,
      row: 6,
      width: 4,
    })
  })

  it('centers exact-size foam cutouts inside their envelopes', () => {
    const rubyCavity = glassCaseCavityLayout('red-parallelogram')
    const sapphireCavity = glassCaseCavityLayout('blue-big-triangle')

    expect(rubyCavity.heightPercent).toBeCloseTo(100 / 3)
    expect(rubyCavity.leftPercent).toBe(0)
    expect(rubyCavity.topPercent).toBeCloseTo(100 / 3)
    expect(rubyCavity.widthPercent).toBe(100)
    expect(sapphireCavity).toEqual({
      heightPercent: 50,
      leftPercent: 0,
      topPercent: 25,
      widthPercent: 100,
    })
  })

  it('rotates glass at one shared scale without leaving its envelope', () => {
    expect(
      glassCasePieceLayout(placement('red-parallelogram', 'north')),
    ).toEqual(glassCaseCavityLayout('red-parallelogram'))

    const eastLayout = glassCasePieceLayout(
      placement('red-parallelogram', 'east'),
    )

    expect(eastLayout.heightPercent).toBe(100)
    expect(eastLayout.leftPercent).toBeCloseTo(100 / 3)
    expect(eastLayout.topPercent).toBe(0)
    expect(eastLayout.widthPercent).toBeCloseTo(100 / 3)
  })

  it('keeps every orientation and face inside its reserved envelope', () => {
    for (const mineralId of mineralIds) {
      for (const orientation of orientations) {
        for (const face of faces) {
          const layout = glassCasePieceLayout(
            placement(mineralId, orientation, face),
          )

          expect(layout.leftPercent).toBeGreaterThanOrEqual(0)
          expect(layout.topPercent).toBeGreaterThanOrEqual(0)
          expect(layout.leftPercent + layout.widthPercent).toBeLessThanOrEqual(
            100,
          )
          expect(layout.topPercent + layout.heightPercent).toBeLessThanOrEqual(
            100,
          )
        }
      }
    }
  })

  it('keeps every envelope inside the case without overlap', () => {
    for (const [index, mineralId] of mineralIds.entries()) {
      const layout = glassCaseSlotLayout(mineralId)

      expect(layout.column + layout.width).toBeLessThanOrEqual(
        GLASS_CASE_GRID_SIZE,
      )
      expect(layout.row + layout.height).toBeLessThanOrEqual(
        GLASS_CASE_GRID_SIZE,
      )

      for (const otherMineralId of mineralIds.slice(index + 1)) {
        expect(slotsOverlap(layout, glassCaseSlotLayout(otherMineralId))).toBe(
          false,
        )
      }
    }
  })
})

function slotsOverlap(
  first: ReturnType<typeof glassCaseSlotLayout>,
  second: ReturnType<typeof glassCaseSlotLayout>,
) {
  return (
    first.column < second.column + second.width &&
    first.column + first.width > second.column &&
    first.row < second.row + second.height &&
    first.row + first.height > second.row
  )
}
