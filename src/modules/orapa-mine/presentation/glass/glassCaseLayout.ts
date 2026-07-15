import { getMineralShape, minerals } from '../../domain/minerals'
import type { GuessPlacement, MineralId } from '../../domain/minerals'

export const GLASS_CASE_GRID_SIZE = 12

type GlassCasePosition = Readonly<{
  column: number
  row: number
}>

export type GlassCaseSlotLayout = GlassCasePosition &
  Readonly<{
    height: number
    width: number
  }>

export type GlassCasePieceLayout = Readonly<{
  heightPercent: number
  leftPercent: number
  topPercent: number
  widthPercent: number
}>

const glassCaseSlots: Record<MineralId, GlassCaseSlotLayout> = {
  'red-parallelogram': { column: 0, height: 3, row: 1, width: 3 },
  'yellow-triangle': { column: 4, height: 2, row: 1, width: 2 },
  'blue-big-triangle': { column: 8, height: 4, row: 0, width: 4 },
  'white-diamond': { column: 1, height: 2, row: 7, width: 2 },
  'white-big-triangle': { column: 5, height: 4, row: 6, width: 4 },
  'transparent-prism': { column: 10, height: 2, row: 6, width: 2 },
  'black-absorber': { column: 10, height: 2, row: 9, width: 2 },
}

export function glassCaseSlotLayout(mineralId: MineralId): GlassCaseSlotLayout {
  return glassCaseSlots[mineralId]
}

export function glassCaseCavityLayout(
  mineralId: MineralId,
): GlassCasePieceLayout {
  const mineral = minerals[mineralId]
  const cavity = getMineralShape(mineralId, mineral.defaultOrientation, 'front')

  return layoutInsideSlot(glassCaseSlotLayout(mineralId), cavity)
}

export function glassCasePieceLayout(
  placement: GuessPlacement,
): GlassCasePieceLayout {
  const piece = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return layoutInsideSlot(glassCaseSlotLayout(placement.mineralId), piece)
}

function layoutInsideSlot(
  slot: GlassCaseSlotLayout,
  item: Readonly<{ height: number; width: number }>,
): GlassCasePieceLayout {
  const widthPercent = (item.width / slot.width) * 100
  const heightPercent = (item.height / slot.height) * 100

  return {
    heightPercent,
    leftPercent: (100 - widthPercent) / 2,
    topPercent: (100 - heightPercent) / 2,
    widthPercent,
  }
}
