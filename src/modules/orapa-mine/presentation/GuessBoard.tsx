import type { CSSProperties } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { boardSize, coordinateKey } from '../domain/coordinates'
import type { Coordinate } from '../domain/coordinates'
import { minerals } from '../domain/minerals'
import type { GuessPlacement, MineralId, OccupiedCell } from '../domain/minerals'
import { colorValue } from './colorPalette'
import styles from './GuessBoard.module.css'

type GuessBoardProps = Readonly<{
  guess: ReadonlyArray<GuessPlacement>
  occupiedCells: ReadonlyArray<OccupiedCell>
  onPlace: (mineralId: MineralId, origin: Coordinate) => void
  onRemove: (mineralId: MineralId) => void
  onReset: () => void
  onSubmit: () => void
  result: { solved: boolean; exactPlacements: number; totalPlacements: number } | null
}>

export function GuessBoard({
  guess,
  occupiedCells,
  onPlace,
  onRemove,
  onReset,
  onSubmit,
  result,
}: GuessBoardProps) {
  const occupiedByCell = new Map(
    occupiedCells.map((occupiedCell) => [
      coordinateKey(occupiedCell.coordinate),
      occupiedCell,
    ]),
  )

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Family map</p>
          <h2>Solution</h2>
        </div>
        <button aria-label="Reset solution" onClick={onReset} type="button">
          <RotateCcw size={17} />
        </button>
      </div>

      <div className={styles.grid} aria-label="Family solution board">
        {Array.from({ length: boardSize.rows }, (rowValue, row) =>
          Array.from({ length: boardSize.columns }, (columnValue, column) => {
            void rowValue
            void columnValue
            const key = `${column}:${row}`
            const occupiedCell = occupiedByCell.get(key)
            const anchor = guess.find(
              (placement) =>
                placement.origin !== null &&
                placement.origin.column === column &&
                placement.origin.row === row,
            )

            return (
              <div
                className={styles.cell}
                draggable={Boolean(occupiedCell)}
                key={key}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  if (occupiedCell) {
                    event.dataTransfer.setData('text/plain', occupiedCell.mineral.id)
                  }
                }}
                onDrop={(event) => {
                  const transferValue = event.dataTransfer.getData('text/plain')
                  if (transferValue) {
                    onPlace(transferValue as MineralId, { column, row })
                  }
                }}
              >
                {occupiedCell ? (
                  <span
                    className={styles.fill}
                    style={
                      {
                        '--guess-color': colorValue(occupiedCell.mineral.color),
                      } as CSSProperties
                    }
                  />
                ) : null}
                {anchor ? <strong>{minerals[anchor.mineralId].shortName}</strong> : null}
              </div>
            )
          }),
        )}
      </div>

      <div className={styles.rack}>
        {guess.map((placement) => {
          const mineral = minerals[placement.mineralId]

          return (
            <div
              className={styles.rackPiece}
              draggable
              key={placement.mineralId}
              onDragStart={(event) =>
                event.dataTransfer.setData('text/plain', placement.mineralId)
              }
              style={{ '--rack-color': colorValue(mineral.color) } as CSSProperties}
            >
              <span>{mineral.name}</span>
              {placement.origin ? (
                <button
                  aria-label={`Remove ${mineral.name}`}
                  onClick={() => onRemove(placement.mineralId)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <button className={styles.submitButton} onClick={onSubmit} type="button">
        Submit
      </button>

      {result ? (
        <p className={result.solved ? styles.solved : styles.notSolved}>
          {result.solved
            ? 'Solved'
            : `${result.exactPlacements}/${result.totalPlacements} exact`}
        </p>
      ) : null}
    </aside>
  )
}
