import { PieceShape } from '../PieceShape'
import styles from './OpticalSpectrum.module.css'

export function OpticalSpectrum({
  compact = false,
}: Readonly<{ compact?: boolean }>) {
  return (
    <div
      aria-hidden="true"
      className={`${styles.apparatus} ${compact ? styles.compact : ''}`}
      data-optical-apparatus={compact ? 'compact' : 'full'}
    >
      <span className={styles.source} data-optical-source="true" />
      <span className={styles.whiteBeam} data-optical-beam="true" />
      <span className={styles.prismGlow} />
      <PieceShape
        className={styles.prism}
        data-optical-prism="true"
        face="front"
        mineralId="white-big-triangle"
        orientation="north"
      />
      <span className={styles.spectrum}>
        <span className={styles.redRay} data-spectrum-ray="red" />
        <span className={styles.orangeRay} data-spectrum-ray="orange" />
        <span className={styles.goldRay} data-spectrum-ray="yellow" />
        <span className={styles.greenRay} data-spectrum-ray="green" />
        <span className={styles.cyanRay} data-spectrum-ray="cyan" />
        <span className={styles.blueRay} data-spectrum-ray="blue" />
        <span className={styles.violetRay} data-spectrum-ray="violet" />
      </span>
      <span className={styles.axis} />
    </div>
  )
}
