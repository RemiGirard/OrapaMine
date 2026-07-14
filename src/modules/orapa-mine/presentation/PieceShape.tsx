import type { CSSProperties } from 'react'
import { useId } from 'react'
import type { MineralId, OpticalCell, Orientation, ShapeCell } from '../domain/minerals'
import { getMineralShape, minerals } from '../domain/minerals'
import { colorValue } from './colorPalette'

type PieceShapeProps = Readonly<{
  className?: string
  mineralId: MineralId
  orientation: Orientation
}>

export function PieceShape({ className, mineralId, orientation }: PieceShapeProps) {
  const gradientId = useId().replace(/:/g, '')
  const mineral = minerals[mineralId]
  const shape = getMineralShape(mineralId, orientation)
  const isDiamond = mineralId === 'white-diamond'
  const gradientStart = isDiamond ? '#ffffff' : colorValue(mineral.color)
  const gradientEnd = mineral.color === 'black' ? '#0b1115' : colorValue(mineral.color)
  const outlinePoints = shape.polygon.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      aria-hidden="true"
      className={className}
      data-mineral-color={mineral.color}
      data-mineral-id={mineralId}
      preserveAspectRatio="none"
      shapeRendering="geometricPrecision"
      style={
        {
          '--piece-color': colorValue(mineral.color),
          '--piece-stroke':
            mineral.color === 'black' ? '#4f5966' : colorValue(mineral.color),
        } as CSSProperties
      }
      viewBox={`0 0 ${shape.width} ${shape.height}`}
    >
      <defs>
        <linearGradient id={`${gradientId}-glass`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isDiamond ? 0.95 : 0.5} />
          <stop offset="42%" stopColor={gradientStart} stopOpacity={0.92} />
          <stop offset="100%" stopColor={gradientEnd} stopOpacity={0.72} />
        </linearGradient>
        <linearGradient id={`${gradientId}-shine`} x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="48%" stopColor="#ffffff" stopOpacity={isDiamond ? 0.72 : 0.28} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${gradientId}-diamond-core`} cx="42%" cy="36%" r="68%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="48%" stopColor="#eefdff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#b8efff" stopOpacity="0.62" />
        </radialGradient>
      </defs>

      <polygon
        className="piece-body"
        fill={
          isDiamond
            ? `url(#${gradientId}-diamond-core)`
            : `url(#${gradientId}-glass)`
        }
        points={outlinePoints}
        vectorEffect="non-scaling-stroke"
      />

      {shape.cells.map((cell, index) => (
        <polygon
          className={`piece-facet piece-facet-${cell.opticalCell}`}
          fill={`url(#${gradientId}-glass)`}
          key={`${cell.column}:${cell.row}:${cell.opticalCell}`}
          points={pointsForCell(cell)}
          vectorEffect="non-scaling-stroke"
          data-facet-index={index}
        />
      ))}

      {shape.cells.map((cell) => (
        <polygon
          className="piece-highlight"
          fill={`url(#${gradientId}-shine)`}
          key={`shine-${cell.column}:${cell.row}:${cell.opticalCell}`}
          points={pointsForCell(cell)}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}

function pointsForCell(cell: ShapeCell) {
  const left = cell.column
  const right = cell.column + 1
  const top = cell.row
  const bottom = cell.row + 1
  const pointsByCell: Record<OpticalCell, string> = {
    absorb: `${left},${top} ${right},${top} ${right},${bottom} ${left},${bottom}`,
    block: `${left},${top} ${right},${top} ${right},${bottom} ${left},${bottom}`,
    'triangle-bl': `${left},${top} ${left},${bottom} ${right},${bottom}`,
    'triangle-br': `${right},${top} ${right},${bottom} ${left},${bottom}`,
    'triangle-tl': `${left},${top} ${right},${top} ${left},${bottom}`,
    'triangle-tr': `${left},${top} ${right},${top} ${right},${bottom}`,
  }

  return pointsByCell[cell.opticalCell]
}
