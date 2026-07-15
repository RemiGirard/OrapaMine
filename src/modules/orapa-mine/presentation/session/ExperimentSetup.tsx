import { Atom, FlaskConical, Orbit, Play } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { GameDifficulty } from '../../domain/gameConfiguration'
import { puzzleForDifficulty } from '../../domain/gameConfiguration'
import { OpticalSpectrum } from './OpticalSpectrum'
import styles from './ExperimentSetup.module.css'

type ProtocolDisplay = Readonly<{
  detail: string
  Icon: LucideIcon
  label: string
  note: string
}>

const protocolDisplay: Record<GameDifficulty, ProtocolDisplay> = {
  easy: {
    detail: '5 specimens · aligned geometry',
    Icon: FlaskConical,
    label: 'Easy',
    note: 'Calibration',
  },
  classic: {
    detail: '5 specimens · rotated optics',
    Icon: Orbit,
    label: 'Classic',
    note: 'Newton protocol',
  },
  'nearly-impossible': {
    detail: '7 specimens · prism + absorber',
    Icon: Atom,
    label: 'Nearly impossible',
    note: 'Full spectrum',
  },
}

export function ExperimentSetup({
  onSelect,
  onStart,
  selectedDifficulty,
}: Readonly<{
  onSelect: (difficulty: GameDifficulty) => void
  onStart: () => void
  selectedDifficulty: GameDifficulty
}>) {
  const selectedProtocol = protocolDisplay[selectedDifficulty]
  const selectedPuzzle = puzzleForDifficulty(selectedDifficulty)

  return (
    <section
      aria-labelledby="setup-title"
      className={styles.setup}
      data-testid="experiment-setup"
    >
      <header className={styles.header}>
        <p className={styles.kicker}>Newtonian optics laboratory</p>
        <h1 id="setup-title">Orapa Mine</h1>
        <p className={styles.intro}>
          Reconstruct the hidden mineral field from refracted light.
        </p>
      </header>

      <OpticalSpectrum />

      <div className={styles.configuration}>
        <div className={styles.configurationHeading}>
          <div>
            <span>Experiment protocol</span>
            <strong>{selectedProtocol.note}</strong>
          </div>
          <span className={styles.sampleId}>{selectedPuzzle.id}</span>
        </div>

        <div
          aria-label="Difficulty"
          className={styles.difficultySelector}
          role="radiogroup"
        >
          {(Object.keys(protocolDisplay) as Array<GameDifficulty>).map(
            (difficulty) => {
              const display = protocolDisplay[difficulty]
              const Icon = display.Icon
              const isSelected = difficulty === selectedDifficulty

              return (
                <button
                  aria-checked={isSelected}
                  className={isSelected ? styles.selectedDifficulty : ''}
                  key={difficulty}
                  onClick={() => onSelect(difficulty)}
                  role="radio"
                  type="button"
                >
                  <Icon aria-hidden="true" size={19} strokeWidth={2} />
                  <span>
                    <strong>{display.label}</strong>
                    <small>{display.detail}</small>
                  </span>
                </button>
              )
            },
          )}
        </div>

        <button className={styles.startButton} onClick={onStart} type="button">
          <Play aria-hidden="true" fill="currentColor" size={18} />
          <span>Start experiment</span>
        </button>
      </div>
    </section>
  )
}
