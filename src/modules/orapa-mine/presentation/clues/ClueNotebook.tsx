import { Check, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import type {
  ClueConsistency,
  EdgeClueComparison,
} from '../../application/clueConsistency'
import type { Answer } from '../../domain/questions'
import { ColorDot } from '../ColorDot'
import { colorValue } from '../colorPalette'
import styles from './ClueNotebook.module.css'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function ClueNotebook({
  answers,
  consistency,
  currentAnswer,
  currentRayPreview,
  onClearPreview,
  onPreview,
  previewedAnswerId,
}: Readonly<{
  answers: ReadonlyArray<Answer>
  consistency: ClueConsistency
  currentAnswer: Answer | null
  currentRayPreview: RayAnswer | null
  onClearPreview: () => void
  onPreview: (answer: Answer) => void
  previewedAnswerId: number | null
}>) {
  const currentComparison = currentAnswer
    ? consistency.byAnswerId.get(currentAnswer.id)
    : undefined

  return (
    <>
      {currentAnswer ? (
        <div className={styles.currentLight}>
          <ColorDot color={currentAnswer.signalColor} />
          <div>
            <strong>
              {currentAnswer.mode === 'edge' ? 'Current ray' : 'Current cell'}
            </strong>
            <span>
              {currentAnswer.query} - {currentAnswer.message}
            </span>
            {currentRayPreview ? (
              <small className={styles.previewLine}>
                <span>Family map - {currentRayPreview.message}</span>
                {currentComparison ? (
                  <ConsistencyMark comparison={currentComparison} compact />
                ) : null}
              </small>
            ) : null}
          </div>
        </div>
      ) : null}

      {answers.length > 0 ? (
        <>
          {consistency.totalClues > 0 ? (
            <div
              aria-label={`${consistency.matchedClues} of ${consistency.totalClues} clues match the family map`}
              className={styles.consistencySummary}
            >
              <span>Clues matched</span>
              <span className={styles.consistencyTrack}>
                <span
                  className={styles.consistencyFill}
                  style={{
                    width: `${(consistency.matchedClues / consistency.totalClues) * 100}%`,
                  }}
                />
              </span>
              <strong>
                {consistency.matchedClues}/{consistency.totalClues}
              </strong>
            </div>
          ) : null}

          <ol className={styles.logbook} aria-label="Logbook">
            {answers.slice(0, 6).map((answer) => {
              const comparison = consistency.byAnswerId.get(answer.id)

              return (
                <li
                  className={[
                    answer.mode === 'edge' ? styles.edgeLogEntry : '',
                    answer.id === previewedAnswerId
                      ? styles.activeLogEntry
                      : '',
                    comparison
                      ? comparison.matches
                        ? styles.matchingLogEntry
                        : styles.differentLogEntry
                      : '',
                  ].join(' ')}
                  key={answer.id}
                  onBlur={onClearPreview}
                  onFocus={() => onPreview(answer)}
                  onPointerEnter={() => onPreview(answer)}
                  onPointerLeave={onClearPreview}
                  style={
                    answer.mode === 'edge'
                      ? ({
                          '--logbook-active-color': colorValue(
                            answer.signalColor,
                          ),
                        } as CSSProperties)
                      : undefined
                  }
                  tabIndex={answer.mode === 'edge' ? 0 : undefined}
                >
                  <ColorDot color={answer.signalColor} />
                  <span>
                    {answer.mode === 'edge'
                      ? answer.query
                      : `Cell ${answer.query}`}
                  </span>
                  <strong>{answer.message}</strong>
                  {comparison ? (
                    <ConsistencyMark comparison={comparison} />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </>
      ) : null}
    </>
  )
}

function ConsistencyMark({
  comparison,
  compact = false,
}: Readonly<{
  comparison: EdgeClueComparison
  compact?: boolean
}>) {
  const label = comparison.matches
    ? 'Matches family map'
    : 'Different from family map'
  const Icon = comparison.matches ? Check : X

  return (
    <span
      aria-label={label}
      className={[
        styles.consistencyMark,
        comparison.matches ? styles.matchMark : styles.differentMark,
        compact ? styles.compactMark : '',
      ].join(' ')}
      title={label}
    >
      <Icon aria-hidden="true" size={13} strokeWidth={3} />
      {compact ? (comparison.matches ? 'Match' : 'Different') : null}
    </span>
  )
}
