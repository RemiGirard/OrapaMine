import { PieceShape } from '../PieceShape'
import styles from './OpticalSpectrum.module.css'

export function OpticalSpectrum({
  compact = false,
}: Readonly<{ compact?: boolean }>) {
  return (
    <div
      aria-hidden="true"
      className={`${styles.apparatus} ${compact ? styles.compact : ''}`}
    >
      <span className={styles.source} />
      <span className={styles.whiteBeam} />
      <span className={styles.prismGlow} />
      <PieceShape
        className={styles.prism}
        face="front"
        mineralId="white-big-triangle"
        orientation="north"
      />
      <span className={styles.spectrum}>
        <span className={styles.redRay} />
        <span className={styles.goldRay} />
        <span className={styles.greenRay} />
        <span className={styles.blueRay} />
        <span className={styles.violetRay} />
      </span>
      <span className={styles.axis} />
    </div>
  )
}
