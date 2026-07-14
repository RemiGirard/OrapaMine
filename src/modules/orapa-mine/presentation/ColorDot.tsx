import type { CSSProperties } from 'react'
import type { DisplayColor } from './colorPalette'
import { colorValue } from './colorPalette'
import styles from './ColorDot.module.css'

export function ColorDot({ color }: { color: DisplayColor }) {
  return (
    <span
      className={styles.dot}
      style={{ '--dot-color': colorValue(color) } as CSSProperties}
    />
  )
}
