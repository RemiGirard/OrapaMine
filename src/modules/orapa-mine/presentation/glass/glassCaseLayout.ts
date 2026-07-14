import { getMineralShape } from '../../domain/minerals'
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

const glassCasePositions: Record<MineralId, GlassCasePosition> = {
  'red-parallelogram': { column: 1, row: 2 },
  'yellow-triangle': { column: 4, row: 1 },
  'blue-big-triangle': { column: 7, row: 1 },
  'white-diamond': { column: 1, row: 7 },
  'white-big-triangle': { column: 4, row: 7 },
  'transparent-prism': { column: 9, row: 6 },
  'black-absorber': { column: 9, row: 9 },
}

export function glassCaseSlotLayout(
  placement: GuessPlacement,
): GlassCaseSlotLayout {
  const position = glassCasePositions[placement.mineralId]
  const shape = getMineralShape(
    placement.mineralId,
    placement.orientation,
    placement.face,
  )

  return {
    ...position,
    height: shape.height,
    width: shape.width,
  }
}
