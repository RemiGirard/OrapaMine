import type { CSSProperties } from 'react'
import { boardSize, bottomLabels, coordinateKey, rowLabels } from '../domain/coordinates'
import type { OccupiedCell } from '../domain/minerals'
import { colorValue } from './colorPalette'
import styles from './BoardView.module.css'

type BoardViewProps = Readonly<{
  title: string
  occupiedCells: ReadonlyArray<OccupiedCell>
  highlightedPath: ReadonlySet<string>
  hidden?: boolean
}>

export function BoardView({
  title,
  occupiedCells,
  highlightedPath,
  hidden = false,
}: BoardViewProps) {
  const occupiedByCell = new Map(
    occupiedCells.map((occupiedCell) => [
      coordinateKey(occupiedCell.coordinate),
      occupiedCell,
    ]),
  )

  return (
    <section className={styles.boardPanel}>
      <h2>{title}</h2>
      <div className={styles.gridShell}>
        <span className={styles.corner} />
        {Array.from({ length: boardSize.columns }, (_, column) => (
          <span className={styles.edgeLabel} key={`top-${column}`}>
            {column + 1}
          </span>
        ))}
        <span className={styles.corner} />

        {Array.from({ length: boardSize.rows }, (_, row) => (
          <BoardRow
            hidden={hidden}
            highlightedPath={highlightedPath}
            key={rowLabels[row]}
            occupiedByCell={occupiedByCell}
            row={row}
          />
        ))}

        <span className={styles.corner} />
        {bottomLabels.map((label) => (
          <span className={styles.edgeLabel} key={`bottom-${label}`}>
            {label}
          </span>
        ))}
        <span className={styles.corner} />
      </div>
    </section>
  )
}

function BoardRow({
  hidden,
  highlightedPath,
  occupiedByCell,
  row,
}: Readonly<{
  hidden: boolean
  highlightedPath: ReadonlySet<string>
  occupiedByCell: ReadonlyMap<string, OccupiedCell>
  row: number
}>) {
  return (
    <>
      <span className={styles.edgeLabel}>{rowLabels[row]}</span>
      {Array.from({ length: boardSize.columns }, (_, column) => {
        const key = `${column}:${row}`
        const occupiedCell = occupiedByCell.get(key)
        const classes = [
          styles.cell,
          highlightedPath.has(key) ? styles.pathCell : '',
          hidden ? styles.hiddenCell : '',
        ].join(' ')

        return (
          <span
            className={classes}
            key={key}
            style={
              occupiedCell && !hidden
                ? ({ '--cell-color': colorValue(occupiedCell.mineral.color) } as CSSProperties)
                : undefined
            }
          >
            {occupiedCell && !hidden ? occupiedCell.mineral.shortName : null}
          </span>
        )
      })}
      <span className={styles.edgeLabel}>{row + 11}</span>
    </>
  )
}
