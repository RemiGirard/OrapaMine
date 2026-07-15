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

const glassCasePositions: Record<MineralId, GlassCasePosition> = {
  'red-parallelogram': { column: 1, row: 2 },
  'yellow-triangle': { column: 4, row: 1 },
  'blue-big-triangle': { column: 7, row: 1 },
  'white-diamond': { column: 1, row: 7 },
  'white-big-triangle': { column: 4, row: 7 },
  'transparent-prism': { column: 9, row: 6 },
  'black-absorber': { column: 9, row: 9 },
}

export function glassCaseSlotLayout(mineralId: MineralId): GlassCaseSlotLayout {
  const mineral = minerals[mineralId]
  const position = glassCasePositions[mineralId]
  const shape = getMineralShape(mineralId, mineral.defaultOrientation, 'front')

  return {
    ...position,
    height: shape.height,
    width: shape.width,
  }
}

export function glassCasePieceLayout(
  placement: GuessPlacement,
): GlassCasePieceLayout {
  const slot = glassCaseSlotLayout(placement.mineralId)
  const piece = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  const widthPercent = (piece.width / slot.width) * 100
  const heightPercent = (piece.height / slot.height) * 100

  return {
    heightPercent,
    leftPercent: (100 - widthPercent) / 2,
    topPercent: (100 - heightPercent) / 2,
    widthPercent,
  }
}
