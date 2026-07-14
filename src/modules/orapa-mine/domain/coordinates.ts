export type Coordinate = Readonly<{
  column: number
  row: number
}>

export type Direction = 'north' | 'east' | 'south' | 'west'

export type EdgePort = Readonly<{
  label: string
  start: Coordinate
  direction: Direction
}>

export const boardSize = {
  columns: 10,
  rows: 8,
} as const

export const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export const bottomLabels = [
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
] as const

export function coordinateKey(coordinate: Coordinate) {
  return `${coordinate.column}:${coordinate.row}`
}

export function isInsideBoard(coordinate: Coordinate) {
  return (
    coordinate.column >= 0 &&
    coordinate.column < boardSize.columns &&
    coordinate.row >= 0 &&
    coordinate.row < boardSize.rows
  )
}

export function move(coordinate: Coordinate, direction: Direction): Coordinate {
  if (direction === 'north') {
    return { column: coordinate.column, row: coordinate.row - 1 }
  }

  if (direction === 'east') {
    return { column: coordinate.column + 1, row: coordinate.row }
  }

  if (direction === 'south') {
    return { column: coordinate.column, row: coordinate.row + 1 }
  }

  return { column: coordinate.column - 1, row: coordinate.row }
}

export function parseEdgePort(rawInput: string): EdgePort | null {
  const input = rawInput.trim().toUpperCase()
  const numericLabel = Number(input)

  if (Number.isInteger(numericLabel) && numericLabel >= 1 && numericLabel <= 10) {
    return {
      label: String(numericLabel),
      start: { column: numericLabel - 1, row: -1 },
      direction: 'south',
    }
  }

  if (
    Number.isInteger(numericLabel) &&
    numericLabel >= 11 &&
    numericLabel <= 18
  ) {
    return {
      label: String(numericLabel),
      start: { column: boardSize.columns, row: numericLabel - 11 },
      direction: 'west',
    }
  }

  const leftRow = rowLabels.indexOf(input as (typeof rowLabels)[number])
  if (leftRow >= 0) {
    return {
      label: input,
      start: { column: -1, row: leftRow },
      direction: 'east',
    }
  }

  const bottomColumn = bottomLabels.indexOf(input as (typeof bottomLabels)[number])
  if (bottomColumn >= 0) {
    return {
      label: input,
      start: { column: bottomColumn, row: boardSize.rows },
      direction: 'north',
    }
  }

  return null
}

export function parseGridCoordinate(rawInput: string): Coordinate | null {
  const input = rawInput.trim().toUpperCase().replace(/[(),\s]/g, '')
  const letterFirst = input.match(/^([A-H])(10|[1-9])$/)
  const numberFirst = input.match(/^(10|[1-9])([A-H])$/)

  if (letterFirst) {
    return {
      column: Number(letterFirst[2]) - 1,
      row: rowLabels.indexOf(letterFirst[1] as (typeof rowLabels)[number]),
    }
  }

  if (numberFirst) {
    return {
      column: Number(numberFirst[1]) - 1,
      row: rowLabels.indexOf(numberFirst[2] as (typeof rowLabels)[number]),
    }
  }

  return null
}

export function exitLabelFrom(lastInside: Coordinate, direction: Direction) {
  const outside = move(lastInside, direction)

  if (outside.row < 0) {
    return String(lastInside.column + 1)
  }

  if (outside.column >= boardSize.columns) {
    return String(lastInside.row + 11)
  }

  if (outside.row >= boardSize.rows) {
    return bottomLabels[lastInside.column]
  }

  return rowLabels[lastInside.row]
}

export function formatGridCoordinate(coordinate: Coordinate) {
  return `${coordinate.column + 1}, ${rowLabels[coordinate.row]}`
}
