import {
  CircleAlert,
  Eye,
  EyeOff,
  Gem,
  Send,
  TriangleAlert,
} from 'lucide-react'
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
  onToggleSolution,
  readiness,
  result,
  showSolution,
}: Readonly<{
  onSubmit: () => void
  onToggleSolution: () => void
  readiness: SolutionSubmissionReadiness
  result: GuessResult | null
  showSolution: boolean
}>) {
  if (result) {
    return (
      <SubmissionResult
        onToggleSolution={onToggleSolution}
        result={result}
        showSolution={showSolution}
      />
    )
  }

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
    </section>
  )
}

function SubmissionResult({
  onToggleSolution,
  result,
  showSolution,
}: Readonly<{
  onToggleSolution: () => void
  result: GuessResult
  showSolution: boolean
}>) {
  if (result.solved) {
    return (
      <section
        aria-label="Solution submission"
        aria-live="polite"
        className={`${styles.submissionResult} ${styles.solvedResult}`}
        data-submission-state="solved"
      >
        <Gem aria-hidden="true" size={20} strokeWidth={2.25} />
        <strong>Solved</strong>
      </section>
    )
  }

  return (
    <section
      aria-label="Solution submission"
      aria-live="polite"
      className={`${styles.submissionResult} ${styles.incorrectResult}`}
      data-submission-state="incorrect"
    >
      <TriangleAlert aria-hidden="true" size={20} strokeWidth={2.25} />
      <strong>
        {result.exactPlacements}/{result.totalPlacements} pieces correct
      </strong>
      <button
        aria-label={showSolution ? 'Hide solution' : 'See solution'}
        aria-pressed={showSolution}
        className={styles.solutionToggle}
        onClick={onToggleSolution}
        type="button"
      >
        {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>{showSolution ? 'Hide solution' : 'See solution'}</span>
      </button>
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
