import type { GuessResult } from '../../domain/familySolution'
import styles from './SolutionSubmission.module.css'

export function SolutionSubmission({
  onSubmit,
  result,
}: Readonly<{
  onSubmit: () => void
  result: GuessResult | null
}>) {
  return (
    <>
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
    </>
  )
}
