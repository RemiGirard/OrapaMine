import type { CSSProperties } from 'react'
import type { Answer } from '../../domain/questions'
import { ColorDot } from '../ColorDot'
import { colorValue } from '../colorPalette'
import styles from './ClueNotebook.module.css'

type RayAnswer = Extract<Answer, { mode: 'edge' }>

export function ClueNotebook({
  answers,
  currentAnswer,
  currentRayPreview,
  onClearPreview,
  onPreview,
  previewedAnswerId,
}: Readonly<{
  answers: ReadonlyArray<Answer>
  currentAnswer: Answer | null
  currentRayPreview: RayAnswer | null
  onClearPreview: () => void
  onPreview: (answer: Answer) => void
  previewedAnswerId: number | null
}>) {
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
              <small>Preview - {currentRayPreview.message}</small>
            ) : null}
          </div>
        </div>
      ) : null}

      {answers.length > 0 ? (
        <ol className={styles.logbook} aria-label="Logbook">
          {answers.slice(0, 6).map((answer) => (
            <li
              className={[
                answer.mode === 'edge' ? styles.edgeLogEntry : '',
                answer.id === previewedAnswerId ? styles.activeLogEntry : '',
              ].join(' ')}
              key={answer.id}
              onBlur={onClearPreview}
              onFocus={() => onPreview(answer)}
              onPointerEnter={() => onPreview(answer)}
              onPointerLeave={onClearPreview}
              style={
                answer.mode === 'edge'
                  ? ({
                      '--logbook-active-color': colorValue(answer.signalColor),
                    } as CSSProperties)
                  : undefined
              }
              tabIndex={answer.mode === 'edge' ? 0 : undefined}
            >
              <ColorDot color={answer.signalColor} />
              <span>
                {answer.mode === 'edge' ? answer.query : `Cell ${answer.query}`}
              </span>
              <strong>{answer.message}</strong>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  )
}
