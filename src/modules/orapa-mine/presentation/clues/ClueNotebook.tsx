import { ArrowRight, Undo2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { signalColorLabels } from '../../domain/colors'
import type { Answer } from '../../domain/questions'
import { colorValue } from '../colorPalette'
import type { CluePreviewSource } from './useClueInspection'
import styles from './ClueNotebook.module.css'

export function ClueNotebook({
  answers,
  onClearPreview,
  onPreview,
  previewedAnswerId,
}: Readonly<{
  answers: ReadonlyArray<Answer>
  onClearPreview: (source: CluePreviewSource) => void
  onPreview: (answer: Answer, source: CluePreviewSource) => void
  previewedAnswerId: number | null
}>) {
  if (answers.length === 0) {
    return null
  }

  return (
    <section className={styles.clues} aria-label="Clues">
      <h2>Clues</h2>
      <ol className={styles.logbook} aria-label="Logbook">
        {answers.slice(0, 6).map((answer) => (
          <li
            aria-label={clueRouteLabel(answer)}
            className={[
              answer.mode === 'edge' ? styles.edgeLogEntry : '',
              answer.id === previewedAnswerId ? styles.activeLogEntry : '',
            ].join(' ')}
            key={answer.id}
            onBlur={() => onClearPreview('focus')}
            onFocus={() => onPreview(answer, 'focus')}
            onPointerEnter={() => onPreview(answer, 'pointer')}
            onPointerLeave={() => onClearPreview('pointer')}
            style={
              {
                '--clue-color': colorValue(answer.signalColor),
              } as CSSProperties
            }
            tabIndex={answer.mode === 'edge' ? 0 : undefined}
            title={answer.message}
          >
            <ClueRoute answer={answer} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function ClueRoute({ answer }: Readonly<{ answer: Answer }>) {
  if (answer.mode === 'edge' && answer.exitLabel === answer.query) {
    return (
      <span className={styles.route}>
        <span>{answer.query}</span>
        <Undo2
          aria-hidden="true"
          className={styles.returnArrow}
          data-clue-return="true"
          size={17}
          strokeWidth={2.5}
        />
      </span>
    )
  }

  return (
    <span className={styles.route}>
      <span>{answer.query}</span>
      <ArrowRight aria-hidden="true" size={17} strokeWidth={2.5} />
      <span>{clueOutput(answer)}</span>
    </span>
  )
}

function clueOutput(answer: Answer) {
  if (answer.mode === 'coordinate') {
    return answer.signalColor === 'absorbed'
      ? 'Absorbed'
      : signalColorLabels[answer.signalColor]
  }

  if (answer.exitLabel) {
    return answer.exitLabel
  }

  return answer.signalColor === 'absorbed' ? 'Absorbed' : 'Loop'
}

function clueRouteLabel(answer: Answer) {
  const color =
    answer.signalColor === 'absorbed'
      ? 'absorbed'
      : signalColorLabels[answer.signalColor]

  if (answer.mode === 'edge' && answer.exitLabel === answer.query) {
    return `${answer.query} returns to itself, ${color}`
  }

  return `${answer.query} to ${clueOutput(answer)}, ${color}`
}
