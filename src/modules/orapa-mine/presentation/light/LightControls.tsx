import styles from './LightControls.module.css'

export function LightControls({
  hasCurrentRay,
  onShowAllRaysChange,
  onShowCurrentRayChange,
  showAllRays,
  showCurrentRay,
}: Readonly<{
  hasCurrentRay: boolean
  onShowAllRaysChange: (visible: boolean) => void
  onShowCurrentRayChange: (visible: boolean) => void
  showAllRays: boolean
  showCurrentRay: boolean
}>) {
  return (
    <div className={styles.lightControls} aria-label="Light display">
      <strong>Rays</strong>
      <label>
        <input
          aria-keyshortcuts="A"
          checked={showAllRays}
          onChange={(event) => onShowAllRaysChange(event.target.checked)}
          type="checkbox"
        />
        All rays
      </label>
      {hasCurrentRay ? (
        <label>
          <input
            aria-keyshortcuts="C"
            checked={showCurrentRay}
            onChange={(event) => onShowCurrentRayChange(event.target.checked)}
            type="checkbox"
          />
          Current ray
        </label>
      ) : null}
    </div>
  )
}
