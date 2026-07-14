import type { Coordinate } from './coordinates'
import { coordinateKey, isInsideBoard } from './coordinates'
import type { GemColor } from './colors'

export type Reflector = 'slash' | 'backslash' | 'vertical' | 'horizontal'

export type MineralId =
  | 'red-parallelogram'
  | 'yellow-triangle'
  | 'blue-diamond'
  | 'white-large-triangle'
  | 'white-small-square'
  | 'transparent-prism'
  | 'black-body'

export type ShapeCell = Readonly<Coordinate & { reflector: Reflector }>

export type Mineral = Readonly<{
  id: MineralId
  name: string
  shortName: string
  color: GemColor
  cells: ReadonlyArray<ShapeCell>
}>

export type MineralPlacement = Readonly<{
  mineralId: MineralId
  origin: Coordinate
}>

export type GuessPlacement = Readonly<{
  mineralId: MineralId
  origin: Coordinate | null
}>

export type OccupiedCell = Readonly<{
  coordinate: Coordinate
  mineral: Mineral
  reflector: Reflector
}>

export const minerals: Record<MineralId, Mineral> = {
  'red-parallelogram': {
    id: 'red-parallelogram',
    name: 'Ruby',
    shortName: 'R',
    color: 'red',
    cells: [
      { column: 0, row: 0, reflector: 'backslash' },
      { column: 1, row: 0, reflector: 'backslash' },
    ],
  },
  'yellow-triangle': {
    id: 'yellow-triangle',
    name: 'Topaz',
    shortName: 'Y',
    color: 'yellow',
    cells: [
      { column: 0, row: 0, reflector: 'slash' },
      { column: 0, row: 1, reflector: 'slash' },
      { column: 1, row: 1, reflector: 'horizontal' },
    ],
  },
  'blue-diamond': {
    id: 'blue-diamond',
    name: 'Sapphire',
    shortName: 'B',
    color: 'blue',
    cells: [
      { column: 0, row: 0, reflector: 'vertical' },
      { column: 1, row: 0, reflector: 'slash' },
      { column: 0, row: 1, reflector: 'backslash' },
      { column: 1, row: 1, reflector: 'vertical' },
    ],
  },
  'white-large-triangle': {
    id: 'white-large-triangle',
    name: 'Diamond',
    shortName: 'W',
    color: 'white',
    cells: [
      { column: 0, row: 0, reflector: 'slash' },
      { column: 1, row: 0, reflector: 'horizontal' },
      { column: 2, row: 0, reflector: 'backslash' },
      { column: 1, row: 1, reflector: 'slash' },
    ],
  },
  'white-small-square': {
    id: 'white-small-square',
    name: 'Quartz',
    shortName: 'Q',
    color: 'white',
    cells: [{ column: 0, row: 0, reflector: 'vertical' }],
  },
  'transparent-prism': {
    id: 'transparent-prism',
    name: 'Prism',
    shortName: 'T',
    color: 'transparent',
    cells: [{ column: 0, row: 0, reflector: 'slash' }],
  },
  'black-body': {
    id: 'black-body',
    name: 'Blackbody',
    shortName: 'K',
    color: 'black',
    cells: [{ column: 0, row: 0, reflector: 'horizontal' }],
  },
}

export function mineralIdsForBasicGame(): Array<MineralId> {
  return [
    'red-parallelogram',
    'yellow-triangle',
    'blue-diamond',
    'white-large-triangle',
    'white-small-square',
  ]
}

export function getOccupiedCells(
  placements: ReadonlyArray<MineralPlacement>,
): Array<OccupiedCell> {
  return placements.flatMap((placement) => {
    const mineral = minerals[placement.mineralId]

    return mineral.cells.map((cell) => ({
      coordinate: {
        column: placement.origin.column + cell.column,
        row: placement.origin.row + cell.row,
      },
      mineral,
      reflector: cell.reflector,
    }))
  })
}

export function findOccupant(
  placements: ReadonlyArray<MineralPlacement>,
  coordinate: Coordinate,
) {
  return getOccupiedCells(placements).find(
    (occupiedCell) => coordinateKey(occupiedCell.coordinate) === coordinateKey(coordinate),
  )
}

export function canPlaceMineral(mineralId: MineralId, origin: Coordinate) {
  return minerals[mineralId].cells.every((cell) =>
    isInsideBoard({
      column: origin.column + cell.column,
      row: origin.row + cell.row,
    }),
  )
}
