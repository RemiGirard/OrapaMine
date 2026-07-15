import type { CSSProperties } from 'react'
import {
  bottomLabels,
  leftLabels,
  rightLabels,
  topLabels,
} from '../../domain/coordinates'
import {
  edgeConnectionFrom,
  edgeConnectionOtherPort,
} from '../../domain/edgeConnections'
import type { EdgeConnection } from '../../domain/edgeConnections'
import { signalColorLabels } from '../../domain/colors'
import type { Answer } from '../../domain/questions'
import type { CluePreviewSource } from '../clues/useClueInspection'
import { colorValue } from '../colorPalette'
import styles from './EdgePorts.module.css'

type EdgeAnswer = Extract<Answer, { mode: 'edge' }>
type EdgeSide = 'top' | 'right' | 'bottom' | 'left'
type ActiveEdgeRole = 'emitter' | 'receiver' | 'both'

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
  onClearSelection,
  onPreview,
  onSelect,
  onShoot,
  side,
}: Readonly<{
  activeAnswer: EdgeAnswer | null
  answers: ReadonlyMap<string, EdgeAnswer>
  onAsk: (edgeLabel: string) => void
  onClearPreview: (source: CluePreviewSource) => void
  onClearSelection: () => void
  onPreview: (answer: Answer, source: CluePreviewSource) => void
  onSelect: (answer: EdgeAnswer) => void
  onShoot: (edgeLabel: string) => void
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
  const activeConnection = activeAnswer
    ? edgeConnectionFrom(activeAnswer)
    : null

  return (
    <div className={group.className}>
      {group.labels.map((label) => (
        <EdgePort
          activeColor={activeColor}
          activeConnection={activeConnection}
          activeRole={activeRoleFor(label, activeAnswer)}
          answer={answers.get(label)}
          isActive={activeLabels.has(label)}
          key={label}
          label={label}
          onAsk={onAsk}
          onClearPreview={onClearPreview}
          onClearSelection={onClearSelection}
          onPreview={onPreview}
          onSelect={onSelect}
          onShoot={onShoot}
        />
      ))}
    </div>
  )
}

function activeRoleFor(label: string, answer: EdgeAnswer | null) {
  if (label === answer?.query && label === answer.exitLabel) {
    return 'both' as const
  }

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
  activeConnection,
  answer,
  isActive,
  label,
  onAsk,
  onClearPreview,
  onClearSelection,
  onPreview,
  onSelect,
  onShoot,
}: Readonly<{
  activeRole: ActiveEdgeRole | null
  activeColor: string | undefined
  activeConnection: EdgeConnection | null
  answer: EdgeAnswer | undefined
  isActive: boolean
  label: string
  onAsk: (edgeLabel: string) => void
  onClearPreview: (source: CluePreviewSource) => void
  onClearSelection: () => void
  onPreview: (answer: Answer, source: CluePreviewSource) => void
  onSelect: (answer: EdgeAnswer) => void
  onShoot: (edgeLabel: string) => void
}>) {
  function previewKnownAnswer(source: CluePreviewSource) {
    if (answer) {
      onPreview(answer, source)
    }
  }

  function askOrSelect() {
    onShoot(label)

    if (answer) {
      onSelect(answer)
      return
    }

    onClearSelection()
    onAsk(label)
  }

  const connection = answer ? edgeConnectionFrom(answer) : null
  const linkedPort = connection
    ? edgeConnectionOtherPort(connection, label)
    : null
  const title = connection
    ? `${connection.firstPort} linked with ${connection.secondPort} - ${signalColorLabels[connection.signalColor]}`
    : answer
      ? `${label}: ${answer.message}`
      : `Send ray ${label}`

  return (
    <button
      aria-label={`Send ray ${label}`}
      className={[
        answer ? styles.answeredEdge : '',
        isActive ? styles.activeRayEdge : '',
        activeRole === 'emitter' || activeRole === 'both'
          ? styles.activeEmitterEdge
          : '',
        activeRole === 'receiver' || activeRole === 'both'
          ? styles.activeReceiverEdge
          : '',
      ].join(' ')}
      data-active-light-connection={
        isActive ? activeConnection?.key : undefined
      }
      data-clue-connection={connection?.key}
      data-edge-role={activeRole ?? undefined}
      data-edge-side={label.slice(0, 1)}
      data-clue-linked-edge={linkedPort ?? undefined}
      onBlur={() => onClearPreview('focus')}
      onClick={askOrSelect}
      onFocus={() => previewKnownAnswer('focus')}
      onPointerEnter={() => previewKnownAnswer('pointer')}
      onPointerLeave={() => onClearPreview('pointer')}
      style={
        answer || (isActive && activeColor)
          ? ({
              '--edge-answer-color': answer
                ? colorValue(answer.signalColor)
                : undefined,
              '--edge-active-color': isActive ? activeColor : undefined,
            } as CSSProperties)
          : undefined
      }
      title={title}
      type="button"
    >
      <span className={styles.opticalFlare} />
      <span className={styles.portLabel}>{label}</span>
    </button>
  )
}
