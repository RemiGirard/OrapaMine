import type { Coordinate, Direction } from './coordinates'
import { coordinateKey, isInsideBoard } from './coordinates'
import type { GemColor } from './colors'

export type OpticalCell =
  | 'block'
  | 'triangle-tl'
  | 'triangle-tr'
  | 'triangle-br'
  | 'triangle-bl'
  | 'absorb'

export type Orientation = 'north' | 'east' | 'south' | 'west'

export type MineralFace = 'front' | 'back'

export type MineralId =
  | 'red-parallelogram'
  | 'yellow-triangle'
  | 'blue-big-triangle'
  | 'white-big-triangle'
  | 'white-diamond'
  | 'transparent-prism'
  | 'black-absorber'

export type ShapeCell = Readonly<Coordinate & { opticalCell: OpticalCell }>
export type ShapePoint = Readonly<{ x: number; y: number }>

export type MineralShape = Readonly<{
  cells: ReadonlyArray<ShapeCell>
  height: number
  polygon: ReadonlyArray<ShapePoint>
  width: number
}>

export type Mineral = Readonly<{
  id: MineralId
  name: string
  shortName: string
  color: GemColor
  defaultOrientation: Orientation
  shapes: Readonly<
    Record<MineralFace, Readonly<Record<Orientation, MineralShape>>>
  >
}>

export type MineralPlacement = Readonly<{
  face?: MineralFace
  mineralId: MineralId
  origin: Coordinate
  orientation?: Orientation
}>

export type GuessPlacement = Readonly<{
  face: MineralFace
  mineralId: MineralId
  origin: Coordinate | null
  orientation: Orientation
}>

export type OccupiedCell = Readonly<{
  coordinate: Coordinate
  face: MineralFace
  mineral: Mineral
  orientation: Orientation
  opticalCell: OpticalCell
}>

const orientationOrder: ReadonlyArray<Orientation> = [
  'north',
  'east',
  'south',
  'west',
]
const faceOrder: ReadonlyArray<MineralFace> = ['front', 'back']

const occupiedSides: Record<OpticalCell, ReadonlySet<Direction>> = {
  absorb: new Set(['north', 'east', 'south', 'west']),
  block: new Set(['north', 'east', 'south', 'west']),
  'triangle-bl': new Set(['south', 'west']),
  'triangle-br': new Set(['east', 'south']),
  'triangle-tl': new Set(['north', 'west']),
  'triangle-tr': new Set(['north', 'east']),
}

const rotatedOpticalCell: Record<OpticalCell, OpticalCell> = {
  absorb: 'absorb',
  block: 'block',
  'triangle-bl': 'triangle-tl',
  'triangle-br': 'triangle-bl',
  'triangle-tl': 'triangle-tr',
  'triangle-tr': 'triangle-br',
}

const mirroredOpticalCell: Record<OpticalCell, OpticalCell> = {
  absorb: 'absorb',
  block: 'block',
  'triangle-bl': 'triangle-br',
  'triangle-br': 'triangle-bl',
  'triangle-tl': 'triangle-tr',
  'triangle-tr': 'triangle-tl',
}

function rotateCell(cell: ShapeCell, width: number, height: number): ShapeCell {
  void width

  return {
    column: height - 1 - cell.row,
    opticalCell: rotatedOpticalCell[cell.opticalCell],
    row: cell.column,
  }
}

function mirrorCell(cell: ShapeCell, width: number): ShapeCell {
  return {
    column: width - 1 - cell.column,
    opticalCell: mirroredOpticalCell[cell.opticalCell],
    row: cell.row,
  }
}

function mirrorPoint(point: ShapePoint, width: number): ShapePoint {
  return {
    x: width - point.x,
    y: point.y,
  }
}

function mirrorShape(shape: MineralShape): MineralShape {
  return {
    cells: shape.cells.map((cell) => mirrorCell(cell, shape.width)),
    height: shape.height,
    polygon: shape.polygon.map((point) => mirrorPoint(point, shape.width)),
    width: shape.width,
  }
}

function rotatePoint(point: ShapePoint, height: number): ShapePoint {
  return {
    x: height - point.y,
    y: point.x,
  }
}

function rotateShape(shape: MineralShape): MineralShape {
  return {
    cells: shape.cells.map((cell) =>
      rotateCell(cell, shape.width, shape.height),
    ),
    height: shape.width,
    polygon: shape.polygon.map((point) => rotatePoint(point, shape.height)),
    width: shape.height,
  }
}

function createOrientedShapes(
  baseShape: MineralShape,
): Record<Orientation, MineralShape> {
  const east = rotateShape(baseShape)
  const south = rotateShape(east)
  const west = rotateShape(south)

  return {
    east,
    north: baseShape,
    south,
    west,
  }
}

function defineMineral({
  baseShape,
  color,
  id,
  name,
  shortName,
}: Readonly<{
  baseShape: MineralShape
  color: GemColor
  id: MineralId
  name: string
  shortName: string
}>): Mineral {
  return {
    color,
    defaultOrientation: 'north',
    id,
    name,
    shapes: {
      back: createOrientedShapes(mirrorShape(baseShape)),
      front: createOrientedShapes(baseShape),
    },
    shortName,
  }
}

export const minerals: Record<MineralId, Mineral> = {
  'red-parallelogram': defineMineral({
    baseShape: {
      cells: [
        { column: 0, opticalCell: 'triangle-br', row: 0 },
        { column: 1, opticalCell: 'block', row: 0 },
        { column: 2, opticalCell: 'triangle-tl', row: 0 },
      ],
      height: 1,
      polygon: [
        { x: 1, y: 0 },
        { x: 3, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 1 },
      ],
      width: 3,
    },
    color: 'red',
    id: 'red-parallelogram',
    name: 'Ruby parallelogram',
    shortName: 'R',
  }),
  'yellow-triangle': defineMineral({
    baseShape: {
      cells: [
        { column: 0, opticalCell: 'triangle-bl', row: 0 },
        { column: 0, opticalCell: 'block', row: 1 },
        { column: 1, opticalCell: 'triangle-bl', row: 1 },
      ],
      height: 2,
      polygon: [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 2 },
      ],
      width: 2,
    },
    color: 'yellow',
    id: 'yellow-triangle',
    name: 'Topaz triangle',
    shortName: 'Y',
  }),
  'blue-big-triangle': defineMineral({
    baseShape: {
      cells: [
        { column: 1, opticalCell: 'triangle-br', row: 0 },
        { column: 2, opticalCell: 'triangle-bl', row: 0 },
        { column: 0, opticalCell: 'triangle-br', row: 1 },
        { column: 1, opticalCell: 'block', row: 1 },
        { column: 2, opticalCell: 'block', row: 1 },
        { column: 3, opticalCell: 'triangle-bl', row: 1 },
      ],
      height: 2,
      polygon: [
        { x: 2, y: 0 },
        { x: 4, y: 2 },
        { x: 0, y: 2 },
      ],
      width: 4,
    },
    color: 'blue',
    id: 'blue-big-triangle',
    name: 'Sapphire big triangle',
    shortName: 'B',
  }),
  'white-big-triangle': defineMineral({
    baseShape: {
      cells: [
        { column: 1, opticalCell: 'triangle-br', row: 0 },
        { column: 2, opticalCell: 'triangle-bl', row: 0 },
        { column: 0, opticalCell: 'triangle-br', row: 1 },
        { column: 1, opticalCell: 'block', row: 1 },
        { column: 2, opticalCell: 'block', row: 1 },
        { column: 3, opticalCell: 'triangle-bl', row: 1 },
      ],
      height: 2,
      polygon: [
        { x: 2, y: 0 },
        { x: 4, y: 2 },
        { x: 0, y: 2 },
      ],
      width: 4,
    },
    color: 'white',
    id: 'white-big-triangle',
    name: 'Diamond big triangle',
    shortName: 'W',
  }),
  'white-diamond': defineMineral({
    baseShape: {
      cells: [
        { column: 0, opticalCell: 'triangle-br', row: 0 },
        { column: 1, opticalCell: 'triangle-bl', row: 0 },
        { column: 0, opticalCell: 'triangle-tr', row: 1 },
        { column: 1, opticalCell: 'triangle-tl', row: 1 },
      ],
      height: 2,
      polygon: [
        { x: 1, y: 0 },
        { x: 2, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 1 },
      ],
      width: 2,
    },
    color: 'white',
    id: 'white-diamond',
    name: 'Diamond',
    shortName: 'D',
  }),
  'transparent-prism': defineMineral({
    baseShape: {
      cells: [
        { column: 0, opticalCell: 'triangle-br', row: 0 },
        { column: 1, opticalCell: 'triangle-bl', row: 0 },
      ],
      height: 1,
      polygon: [
        { x: 1, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 1 },
      ],
      width: 2,
    },
    color: 'transparent',
    id: 'transparent-prism',
    name: 'Transparent prism',
    shortName: 'T',
  }),
  'black-absorber': defineMineral({
    baseShape: {
      cells: [
        { column: 0, opticalCell: 'absorb', row: 0 },
        { column: 1, opticalCell: 'absorb', row: 0 },
      ],
      height: 1,
      polygon: [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 1 },
      ],
      width: 2,
    },
    color: 'black',
    id: 'black-absorber',
    name: 'Black absorber',
    shortName: 'K',
  }),
}

export function mineralIdsForBasicGame(): Array<MineralId> {
  return [
    'red-parallelogram',
    'yellow-triangle',
    'blue-big-triangle',
    'white-diamond',
    'white-big-triangle',
  ]
}

export function getOccupiedCells(
  placements: ReadonlyArray<MineralPlacement>,
): Array<OccupiedCell> {
  return placements.flatMap((placement) => {
    const mineral = minerals[placement.mineralId]
    const face = placement.face ?? 'front'
    const orientation = placement.orientation ?? mineral.defaultOrientation
    const shape = getMineralShape(placement.mineralId, orientation, face)

    return shape.cells.map((cell) => ({
      coordinate: {
        column: placement.origin.column + cell.column,
        row: placement.origin.row + cell.row,
      },
      mineral,
      face,
      opticalCell: cell.opticalCell,
      orientation,
    }))
  })
}

export function findOccupant(
  placements: ReadonlyArray<MineralPlacement>,
  coordinate: Coordinate,
) {
  return getOccupiedCells(placements).find(
    (occupiedCell) =>
      coordinateKey(occupiedCell.coordinate) === coordinateKey(coordinate),
  )
}

export function canPlaceMineral(mineralId: MineralId, origin: Coordinate) {
  return canPlaceMineralWithOrientation(
    mineralId,
    origin,
    minerals[mineralId].defaultOrientation,
  )
}

export function canPlaceMineralWithOrientation(
  mineralId: MineralId,
  origin: Coordinate,
  orientation: Orientation,
  face: MineralFace = 'front',
) {
  return getMineralShape(mineralId, orientation, face).cells.every((cell) =>
    isInsideBoard({
      column: origin.column + cell.column,
      row: origin.row + cell.row,
    }),
  )
}

export function getMineralShape(
  mineralId: MineralId,
  orientation: Orientation = minerals[mineralId].defaultOrientation,
  face: MineralFace = 'front',
) {
  return minerals[mineralId].shapes[face][orientation]
}

export function rotateOrientation(orientation: Orientation): Orientation {
  const currentIndex = orientationOrder.indexOf(orientation)

  return orientationOrder[(currentIndex + 1) % orientationOrder.length]
}

export function flipFace(face: MineralFace): MineralFace {
  const currentIndex = faceOrder.indexOf(face)

  return faceOrder[(currentIndex + 1) % faceOrder.length]
}

export function reflectsFrom(opticalCell: OpticalCell, direction: Direction) {
  const reflections: Record<OpticalCell, Record<Direction, Direction>> = {
    absorb: {
      east: 'west',
      north: 'south',
      south: 'north',
      west: 'east',
    },
    block: {
      east: 'west',
      north: 'south',
      south: 'north',
      west: 'east',
    },
    'triangle-bl': {
      east: 'west',
      north: 'south',
      south: 'east',
      west: 'north',
    },
    'triangle-br': {
      east: 'north',
      north: 'south',
      south: 'west',
      west: 'east',
    },
    'triangle-tl': {
      east: 'west',
      north: 'east',
      south: 'north',
      west: 'south',
    },
    'triangle-tr': {
      east: 'south',
      north: 'west',
      south: 'north',
      west: 'east',
    },
  }

  return reflections[opticalCell][direction]
}

export function placementsOverlap(placements: ReadonlyArray<MineralPlacement>) {
  for (let firstIndex = 0; firstIndex < placements.length; firstIndex += 1) {
    const firstPlacement = placements[firstIndex]
    const firstCells = getOccupiedCells([firstPlacement])

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < placements.length;
      secondIndex += 1
    ) {
      const secondPlacement = placements[secondIndex]
      const secondCells = getOccupiedCells([secondPlacement])

      if (placementCellsCollide(firstCells, secondCells)) {
        return true
      }
    }
  }

  return false
}

function placementCellsCollide(
  firstCells: ReadonlyArray<OccupiedCell>,
  secondCells: ReadonlyArray<OccupiedCell>,
) {
  for (const first of firstCells) {
    for (const second of secondCells) {
      const columnDistance = Math.abs(
        first.coordinate.column - second.coordinate.column,
      )
      const rowDistance = Math.abs(first.coordinate.row - second.coordinate.row)

      if (columnDistance === 0 && rowDistance === 0) {
        return true
      }

      if (
        (first.mineral.color === 'black' || second.mineral.color === 'black') &&
        columnDistance <= 1 &&
        rowDistance <= 1
      ) {
        return true
      }

      if (columnDistance + rowDistance !== 1) {
        continue
      }

      if (
        first.coordinate.column < second.coordinate.column &&
        occupiedSides[first.opticalCell].has('east') &&
        occupiedSides[second.opticalCell].has('west')
      ) {
        return true
      }

      if (
        first.coordinate.column > second.coordinate.column &&
        occupiedSides[first.opticalCell].has('west') &&
        occupiedSides[second.opticalCell].has('east')
      ) {
        return true
      }

      if (
        first.coordinate.row < second.coordinate.row &&
        occupiedSides[first.opticalCell].has('south') &&
        occupiedSides[second.opticalCell].has('north')
      ) {
        return true
      }

      if (
        first.coordinate.row > second.coordinate.row &&
        occupiedSides[first.opticalCell].has('north') &&
        occupiedSides[second.opticalCell].has('south')
      ) {
        return true
      }
    }
  }

  return false
}
