import type { CSSProperties } from 'react'
import {
  bottomLabels,
  leftLabels,
  rightLabels,
  topLabels,
} from '../../domain/coordinates'
import type { Answer } from '../../domain/questions'
import { colorValue } from '../colorPalette'
import styles from './EdgePorts.module.css'

type EdgeAnswer = Extract<Answer, { mode: 'edge' }>
type EdgeSide = 'top' | 'right' | 'bottom' | 'left'

const edgeGroups: Record<
  EdgeSide,
  Readonly<{ className: string; labels: ReadonlyArray<string> }>
> = {
  top: { className: styles.columnLabels, labels: topLabels },
  right: { className: styles.rightLabels, labels: rightLabels },
  bottom: { className: styles.bottomLabels, labels: bottomLabels },
  left: { className: styles.rowLabels, labels: leftLabels },
}

export function EdgePortGroup({
  activeAnswer,
  answers,
  onAsk,
  onClearPreview,
  onPreview,
  side,
}: Readonly<{
  activeAnswer: EdgeAnswer | null
  answers: ReadonlyMap<string, EdgeAnswer>
  onAsk: (edgeLabel: string) => void
  onClearPreview: () => void
  onPreview: (answer: Answer) => void
  side: EdgeSide
}>) {
  const group = edgeGroups[side]
  const activeLabels = new Set(
    activeAnswer
      ? [activeAnswer.query, activeAnswer.exitLabel].filter(
          (label): label is string => Boolean(label),
        )
      : [],
  )
  const activeColor = activeAnswer
    ? colorValue(activeAnswer.signalColor)
    : undefined

  return (
    <div className={group.className}>
      {group.labels.map((label) => (
        <EdgePort
          activeColor={activeColor}
          activeRole={activeRoleFor(label, activeAnswer)}
          answer={answers.get(label)}
          isActive={activeLabels.has(label)}
          key={label}
          label={label}
          onAsk={onAsk}
          onClearPreview={onClearPreview}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}

function activeRoleFor(label: string, answer: EdgeAnswer | null) {
  if (label === answer?.query) {
    return 'emitter' as const
  }

  if (label === answer?.exitLabel) {
    return 'receiver' as const
  }

  return null
}

function EdgePort({
  activeRole,
  activeColor,
  answer,
  isActive,
  label,
  onAsk,
  onClearPreview,
  onPreview,
}: Readonly<{
  activeRole: 'emitter' | 'receiver' | null
  activeColor: string | undefined
  answer: EdgeAnswer | undefined
  isActive: boolean
  label: string
  onAsk: (edgeLabel: string) => void
  onClearPreview: () => void
  onPreview: (answer: Answer) => void
}>) {
  function previewKnownAnswer() {
    if (answer) {
      onPreview(answer)
    }
  }

  return (
    <button
      aria-label={`Send ray ${label}`}
      className={[
        answer ? styles.answeredEdge : '',
        isActive ? styles.activeRayEdge : '',
        activeRole === 'emitter' ? styles.activeEmitterEdge : '',
        activeRole === 'receiver' ? styles.activeReceiverEdge : '',
      ].join(' ')}
      data-edge-role={activeRole ?? undefined}
      data-edge-side={label.slice(0, 1)}
      onBlur={onClearPreview}
      onClick={() => onAsk(label)}
      onFocus={previewKnownAnswer}
      onPointerEnter={previewKnownAnswer}
      onPointerLeave={onClearPreview}
      style={
        answer || activeColor
          ? ({
              '--edge-answer-color': answer
                ? colorValue(answer.signalColor)
                : activeColor,
              '--edge-active-color': activeColor,
            } as CSSProperties)
          : undefined
      }
      title={answer ? `${label}: ${answer.message}` : `Send ray ${label}`}
      type="button"
    >
      {label}
    </button>
  )
}
