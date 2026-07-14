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
  columns: 8,
  rows: 10,
} as const

export const topLabels = Array.from(
  { length: boardSize.columns },
  (_, index) => `T${index + 1}`,
)

export const bottomLabels = Array.from(
  { length: boardSize.columns },
  (_, index) => `B${index + 1}`,
)

export const leftLabels = Array.from(
  { length: boardSize.rows },
  (_, index) => `L${index + 1}`,
)

export const rightLabels = Array.from(
  { length: boardSize.rows },
  (_, index) => `R${index + 1}`,
)

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
  const input = rawInput.trim().toUpperCase().replace(/\s+/g, '')
  const compact = input.match(/^([TBLR])([1-9]|10)$/)

  if (compact) {
    return edgePortFromSide(compact[1], Number(compact[2]))
  }

  const numericTopLabel = Number(input)

  if (
    Number.isInteger(numericTopLabel) &&
    numericTopLabel >= 1 &&
    numericTopLabel <= boardSize.columns
  ) {
    return edgePortFromSide('T', numericTopLabel)
  }

  return null
}

function edgePortFromSide(side: string, index: number): EdgePort | null {
  if ((side === 'T' || side === 'B') && index > boardSize.columns) {
    return null
  }

  if ((side === 'L' || side === 'R') && index > boardSize.rows) {
    return null
  }

  if (side === 'T') {
    return {
      direction: 'south',
      label: `T${index}`,
      start: { column: index - 1, row: -1 },
    }
  }

  if (side === 'B') {
    return {
      direction: 'north',
      label: `B${index}`,
      start: { column: index - 1, row: boardSize.rows },
    }
  }

  if (side === 'L') {
    return {
      direction: 'east',
      label: `L${index}`,
      start: { column: -1, row: index - 1 },
    }
  }

  if (side === 'R') {
    return {
      direction: 'west',
      label: `R${index}`,
      start: { column: boardSize.columns, row: index - 1 },
    }
  }

  return null
}

export function parseGridCoordinate(rawInput: string): Coordinate | null {
  const input = rawInput.trim().toUpperCase().replace(/[(),\s]/g, '')
  const columnRow = input.match(/^(?:C)?([1-8])(?:R)?(10|[1-9])$/)
  const rowColumn = input.match(/^R(10|[1-9])C([1-8])$/)

  if (columnRow) {
    return {
      column: Number(columnRow[1]) - 1,
      row: Number(columnRow[2]) - 1,
    }
  }

  if (rowColumn) {
    return {
      column: Number(rowColumn[2]) - 1,
      row: Number(rowColumn[1]) - 1,
    }
  }

  return null
}

export function exitLabelFrom(lastInside: Coordinate, direction: Direction) {
  const outside = move(lastInside, direction)

  if (outside.row < 0) {
    return `T${lastInside.column + 1}`
  }

  if (outside.column >= boardSize.columns) {
    return `R${lastInside.row + 1}`
  }

  if (outside.row >= boardSize.rows) {
    return `B${lastInside.column + 1}`
  }

  return `L${lastInside.row + 1}`
}

export function formatGridCoordinate(coordinate: Coordinate) {
  return `C${coordinate.column + 1}, R${coordinate.row + 1}`
}
