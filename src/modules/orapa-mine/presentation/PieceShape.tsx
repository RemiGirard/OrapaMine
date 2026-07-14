import type { CSSProperties } from 'react'
import { useId } from 'react'
import type {
  MineralId,
  MineralShape,
  OpticalCell,
  Orientation,
  ShapeCell,
  ShapePoint,
} from '../domain/minerals'
import { getMineralShape, minerals } from '../domain/minerals'
import { colorValue } from './colorPalette'

type PieceShapeProps = Readonly<{
  className?: string
  mineralId: MineralId
  orientation: Orientation
}>

export function PieceShape({
  className,
  mineralId,
  orientation,
}: PieceShapeProps) {
  const gradientId = useId().replace(/:/g, '')
  const mineral = minerals[mineralId]
  const shape = getMineralShape(mineralId, orientation)
  const isDiamond = mineral.color === 'white'
  const gradientStart = isDiamond ? '#ffffff' : colorValue(mineral.color)
  const gradientEnd =
    mineral.color === 'black' ? '#0b1115' : colorValue(mineral.color)
  const outlinePoints = shape.polygon
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
  const diamondShardFacets = isDiamond ? createDiamondShardFacets(shape) : []
  const diamondFacetLines = isDiamond ? createDiamondFacetLines(shape) : []

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
          <stop
            offset="0%"
            stopColor="#ffffff"
            stopOpacity={isDiamond ? 0.95 : 0.5}
          />
          <stop offset="42%" stopColor={gradientStart} stopOpacity={0.92} />
          <stop offset="100%" stopColor={gradientEnd} stopOpacity={0.72} />
        </linearGradient>
        <linearGradient id={`${gradientId}-shine`} x1="0" x2="1" y1="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
          <stop
            offset="48%"
            stopColor="#ffffff"
            stopOpacity={isDiamond ? 0.72 : 0.28}
          />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-diamond-glass`}
          x1="0"
          x2="1"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
          <stop offset="32%" stopColor="#eaffff" stopOpacity="0.9" />
          <stop offset="62%" stopColor="#bfeeff" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.84" />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-diamond-edge`}
          x1="0"
          x2="1"
          y1="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#bff7ff" stopOpacity="0.12" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#79dbff" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-diamond-caustic`}
          x1="0"
          x2="1"
          y1="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#7bd7ff" stopOpacity="0" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.56" />
          <stop offset="100%" stopColor="#9fffe8" stopOpacity="0" />
        </linearGradient>
        <pattern
          height="0.42"
          id={`${gradientId}-diamond-grain`}
          patternTransform="rotate(32)"
          patternUnits="userSpaceOnUse"
          width="0.42"
        >
          <path
            d="M 0 0.08 H 0.42"
            stroke="#ffffff"
            strokeOpacity="0.26"
            strokeWidth="0.018"
          />
          <path
            d="M 0.06 0.29 H 0.36"
            stroke="#58d8f2"
            strokeOpacity="0.22"
            strokeWidth="0.014"
          />
        </pattern>
        <radialGradient
          id={`${gradientId}-diamond-core`}
          cx="42%"
          cy="36%"
          r="68%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="48%" stopColor="#eefdff" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#b8efff" stopOpacity="0.62" />
        </radialGradient>
        <linearGradient
          id={`${gradientId}-diamond-shard-bright`}
          x1="0"
          x2="1"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="58%" stopColor="#dcfbff" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#6bdfff" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-diamond-shard-cold`}
          x1="1"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#79e8ff" stopOpacity="0.48" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#ecffff" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-diamond-shard-shadow`}
          x1="0"
          x2="1"
          y1="1"
          y2="0"
        >
          <stop offset="0%" stopColor="#92ebff" stopOpacity="0.08" />
          <stop offset="52%" stopColor="#d8fbff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.72" />
        </linearGradient>
        <filter
          id={`${gradientId}-diamond-roughness`}
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
        >
          <feTurbulence
            baseFrequency="1.15"
            numOctaves="2"
            result="texture"
            seed="7"
            type="fractalNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="texture"
            scale="0.028"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id={`${gradientId}-piece-clip`}>
          <polygon points={outlinePoints} />
        </clipPath>
      </defs>

      {isDiamond ? (
        <g
          className="piece-caustics"
          clipPath={`url(#${gradientId}-piece-clip)`}
        >
          <path
            d={`M ${-shape.width * 0.15} ${shape.height * 0.25} L ${shape.width * 1.1} ${shape.height * 0.04}`}
            stroke={`url(#${gradientId}-diamond-caustic)`}
          />
          <path
            d={`M ${-shape.width * 0.08} ${shape.height * 0.82} L ${shape.width * 1.08} ${shape.height * 0.34}`}
            stroke={`url(#${gradientId}-diamond-caustic)`}
          />
          <path
            d={`M ${shape.width * 0.08} ${-shape.height * 0.08} L ${shape.width * 0.88} ${shape.height * 1.12}`}
            stroke={`url(#${gradientId}-diamond-caustic)`}
          />
        </g>
      ) : null}

      <polygon
        className="piece-body"
        fill={
          isDiamond
            ? `url(#${gradientId}-diamond-glass)`
            : `url(#${gradientId}-glass)`
        }
        filter={isDiamond ? `url(#${gradientId}-diamond-roughness)` : undefined}
        points={outlinePoints}
        vectorEffect="non-scaling-stroke"
      />

      {isDiamond ? (
        <polygon
          className="piece-crystal-grain"
          fill={`url(#${gradientId}-diamond-grain)`}
          points={outlinePoints}
        />
      ) : null}

      {shape.cells.map((cell, index) => (
        <polygon
          className={`piece-facet piece-facet-${cell.opticalCell}`}
          fill={
            isDiamond
              ? `url(#${gradientId}-diamond-core)`
              : `url(#${gradientId}-glass)`
          }
          key={`${cell.column}:${cell.row}:${cell.opticalCell}`}
          points={pointsForCell(cell)}
          vectorEffect="non-scaling-stroke"
          data-facet-index={index}
        />
      ))}

      {isDiamond ? (
        <g
          className="piece-crystal-shards"
          clipPath={`url(#${gradientId}-piece-clip)`}
        >
          {diamondShardFacets.map((facet, index) => (
            <polygon
              className="piece-crystal-shard"
              fill={diamondShardFill(gradientId, facet.tone)}
              key={`${facet.points}:${index}`}
              opacity={facet.opacity}
              points={facet.points}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ) : null}

      {shape.cells.map((cell) => (
        <polygon
          className="piece-highlight"
          fill={`url(#${gradientId}-shine)`}
          key={`shine-${cell.column}:${cell.row}:${cell.opticalCell}`}
          points={pointsForCell(cell)}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {isDiamond ? (
        <g
          className="piece-raw-facets"
          clipPath={`url(#${gradientId}-piece-clip)`}
        >
          {diamondFacetLines.map((line, index) => (
            <line
              key={`${line.x1}:${line.y1}:${line.x2}:${line.y2}:${index}`}
              stroke={`url(#${gradientId}-diamond-edge)`}
              vectorEffect="non-scaling-stroke"
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
            />
          ))}
        </g>
      ) : null}
    </svg>
  )
}

type DiamondShardFacet = Readonly<{
  opacity: number
  points: string
  tone: 'bright' | 'cold' | 'shadow'
}>

function createDiamondShardFacets(
  shape: MineralShape,
): ReadonlyArray<DiamondShardFacet> {
  const center = { x: shape.width / 2, y: shape.height / 2 }
  const innerFocus = {
    x: center.x + shape.width * 0.05,
    y: center.y - shape.height * 0.08,
  }
  const vertexFacets = shape.polygon.map((point, index) => {
    const next = shape.polygon[(index + 1) % shape.polygon.length]
    const previous =
      shape.polygon[(index + shape.polygon.length - 1) % shape.polygon.length]
    const firstEdge = interpolatePoint(point, next, 0.52)
    const secondEdge = interpolatePoint(point, previous, 0.42)
    const core = interpolatePoint(innerFocus, point, 0.08)

    return {
      opacity: index % 2 === 0 ? 0.72 : 0.56,
      points: formatPoints([point, firstEdge, core, secondEdge]),
      tone: diamondShardTone(index),
    }
  })
  const crossingFacets = shape.polygon.map((point, index) => {
    const next = shape.polygon[(index + 1) % shape.polygon.length]
    const opposite = shape.polygon[(index + 2) % shape.polygon.length] ?? point
    const edgeMid = interpolatePoint(point, next, 0.5)
    const oppositePull = interpolatePoint(center, opposite, 0.38)
    const core = {
      x:
        center.x + (index % 2 === 0 ? shape.width * 0.07 : -shape.width * 0.05),
      y:
        center.y +
        (index % 2 === 0 ? shape.height * 0.04 : -shape.height * 0.04),
    }

    return {
      opacity: index % 2 === 0 ? 0.5 : 0.4,
      points: formatPoints([edgeMid, core, oppositePull]),
      tone: diamondShardTone(index + 1),
    }
  })

  return [...vertexFacets, ...crossingFacets]
}

function createDiamondFacetLines(shape: MineralShape) {
  const width = shape.width
  const height = shape.height
  const centerX = width / 2
  const centerY = height / 2
  const polygonLines = shape.polygon.map((point, index) => {
    const nextPoint = shape.polygon[(index + 1) % shape.polygon.length]

    return {
      x1: point.x,
      x2: centerX + (nextPoint.x - centerX) * 0.36,
      y1: point.y,
      y2: centerY + (nextPoint.y - centerY) * 0.36,
    }
  })
  const fractureLines = [
    {
      x1: width * 0.16,
      x2: width * 0.82,
      y1: height * 0.24,
      y2: height * 0.72,
    },
    {
      x1: width * 0.28,
      x2: width * 0.92,
      y1: height * 0.88,
      y2: height * 0.32,
    },
    {
      x1: width * 0.04,
      x2: width * 0.58,
      y1: height * 0.54,
      y2: height * 0.18,
    },
  ]

  return [...polygonLines, ...fractureLines]
}

function diamondShardTone(index: number): DiamondShardFacet['tone'] {
  const tones: ReadonlyArray<DiamondShardFacet['tone']> = [
    'bright',
    'cold',
    'shadow',
  ]

  return tones[index % tones.length]
}

function diamondShardFill(gradientId: string, tone: DiamondShardFacet['tone']) {
  return `url(#${gradientId}-diamond-shard-${tone})`
}

function interpolatePoint(
  start: ShapePoint,
  end: ShapePoint,
  ratio: number,
): ShapePoint {
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
  }
}

function formatPoints(points: ReadonlyArray<ShapePoint>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
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
