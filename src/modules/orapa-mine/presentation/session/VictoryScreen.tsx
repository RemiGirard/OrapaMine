import { RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { GameDifficulty } from '../../domain/gameConfiguration'
import { OpticalSpectrum } from './OpticalSpectrum'
import styles from './VictoryScreen.module.css'

const difficultyLabel: Record<GameDifficulty, string> = {
  easy: 'Easy calibration',
  classic: 'Classic protocol',
  'nearly-impossible': 'Nearly impossible',
}

export function VictoryScreen({
  clueCount,
  difficulty,
  onConfigure,
  onRunAgain,
  specimenCount,
}: Readonly<{
  clueCount: number
  difficulty: GameDifficulty
  onConfigure: () => void
  onRunAgain: () => void
  specimenCount: number
}>) {
  return (
    <section
      aria-labelledby="victory-title"
      aria-live="polite"
      className={styles.victory}
      data-testid="victory-screen"
    >
      <p className={styles.brand}>Orapa Mine · Newtonian optics laboratory</p>
      <div className={styles.resultMark}>
        <Sparkles aria-hidden="true" size={22} strokeWidth={1.8} />
        <span>Pattern verified</span>
      </div>
      <h1 id="victory-title">Spectrum resolved</h1>
      <p className={styles.resultCopy}>
        Every specimen is aligned. The observed wavelengths now reproduce the
        hidden mineral field.
      </p>

      <OpticalSpectrum compact />

      <dl className={styles.metrics}>
        <div>
          <dt>Protocol</dt>
          <dd>{difficultyLabel[difficulty]}</dd>
        </div>
        <div>
          <dt>Clues observed</dt>
          <dd>{clueCount}</dd>
        </div>
        <div>
          <dt>Specimens aligned</dt>
          <dd>{specimenCount}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <button
          className={styles.primaryAction}
          onClick={onRunAgain}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={17} />
          Run again
        </button>
        <button onClick={onConfigure} type="button">
          <SlidersHorizontal aria-hidden="true" size={17} />
          Change difficulty
        </button>
      </div>
    </section>
  )
}
