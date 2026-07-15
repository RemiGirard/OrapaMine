import { CircleAlert, Gem, Send, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SolutionSubmissionReadiness } from '../../application/solutionSubmission'
import type { GuessResult } from '../../domain/familySolution'
import styles from './SolutionSubmission.module.css'

type SubmissionDisplay = Readonly<{
  detail: string
  Icon: LucideIcon
  label: string
}>

export function SolutionSubmission({
  onSubmit,
  readiness,
  result,
}: Readonly<{
  onSubmit: () => void
  readiness: SolutionSubmissionReadiness
  result: GuessResult | null
}>) {
  const display = submissionDisplay(readiness)
  const isReady = readiness.status === 'ready'
  const Icon = display.Icon

  return (
    <section aria-label="Solution submission" className={styles.submission}>
      <button
        aria-label={`${display.label}. ${display.detail}`}
        className={styles.submitButton}
        data-submission-state={readiness.status}
        disabled={!isReady}
        onClick={onSubmit}
        title={display.detail}
        type="button"
      >
        <Icon aria-hidden="true" size={19} strokeWidth={2.25} />
        <span className={styles.buttonCopy}>
          <span className={styles.buttonLabel}>{display.label}</span>
          <span className={styles.buttonDetail}>{display.detail}</span>
        </span>
      </button>
      {result ? (
        <p
          aria-live="polite"
          className={result.solved ? styles.solved : styles.notSolved}
        >
          {result.solved
            ? 'Solved'
            : `${result.exactPlacements}/${result.totalPlacements} exact`}
        </p>
      ) : null}
    </section>
  )
}

function submissionDisplay(
  readiness: SolutionSubmissionReadiness,
): SubmissionDisplay {
  switch (readiness.status) {
    case 'incomplete':
      return {
        detail: `${readiness.placedPlacements}/${readiness.totalPlacements} placed`,
        Icon: Gem,
        label: 'Place all glass',
      }
    case 'invalid':
      return {
        detail: `${readiness.invalidPlacements} invalid ${readiness.invalidPlacements === 1 ? 'placement' : 'placements'}`,
        Icon: CircleAlert,
        label: 'Adjust glass',
      }
    case 'conflicting-clues':
      return {
        detail: `${readiness.matchedClues}/${readiness.totalClues} clues match`,
        Icon: TriangleAlert,
        label: 'Clues conflict',
      }
    case 'ready':
      return {
        detail: 'Map is consistent',
        Icon: Send,
        label: 'Submit solution',
      }
  }
}
