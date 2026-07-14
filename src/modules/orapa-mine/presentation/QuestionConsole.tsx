import { Send, Target } from 'lucide-react'
import type { Answer, QuestionMode } from '../domain/questions'
import { signalColorLabels } from '../domain/colors'
import { ColorDot } from './ColorDot'
import styles from './QuestionConsole.module.css'

type QuestionConsoleProps = Readonly<{
  answers: ReadonlyArray<Answer>
  mode: QuestionMode
  onAsk: () => void
  onModeChange: (mode: QuestionMode) => void
  onQueryChange: (query: string) => void
  query: string
}>

export function QuestionConsole({
  answers,
  mode,
  onAsk,
  onModeChange,
  onQueryChange,
  query,
}: QuestionConsoleProps) {
  const lastAnswer = answers.length > 0 ? answers[0] : null

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <Target size={18} />
        <h2>Question</h2>
      </div>

      <div className={styles.segmentedControl} aria-label="Question type">
        <button
          className={mode === 'edge' ? styles.activeSegment : ''}
          onClick={() => onModeChange('edge')}
          type="button"
        >
          Edge
        </button>
        <button
          className={mode === 'coordinate' ? styles.activeSegment : ''}
          onClick={() => onModeChange('coordinate')}
          type="button"
        >
          Cell
        </button>
      </div>

      <label className={styles.queryField}>
        <span>{mode === 'edge' ? '1-18 or A-R' : '4,E or E4'}</span>
        <div>
          <input
            autoCapitalize="characters"
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onAsk()
              }
            }}
            placeholder={mode === 'edge' ? '15' : '4,E'}
            value={query}
          />
          <button aria-label="Ask" onClick={onAsk} type="button">
            <Send size={18} />
          </button>
        </div>
      </label>

      <div className={styles.answerStrip}>
        {lastAnswer ? (
          <>
            <ColorDot
              color={
                lastAnswer.signalColor === 'absorbed'
                  ? 'absorbed'
                  : lastAnswer.signalColor
              }
            />
            <strong>{lastAnswer.message}</strong>
          </>
        ) : (
          <span>No questions yet</span>
        )}
      </div>

      <ol className={styles.history}>
        {answers.map((answer) => (
          <li key={answer.id}>
            <span>
              {answer.mode === 'edge' ? 'Edge' : 'Cell'} {answer.query}
            </span>
            <strong>
              {answer.signalColor === 'absorbed'
                ? answer.message
                : `${answer.message}`}
            </strong>
            {answer.signalColor !== 'absorbed' && (
              <small>{signalColorLabels[answer.signalColor]}</small>
            )}
          </li>
        ))}
      </ol>
    </aside>
  )
}
