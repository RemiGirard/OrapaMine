import { Eye, EyeOff, Shuffle } from 'lucide-react'
import { useCooperativeMineGame } from '../application/useCooperativeMineGame'
import { BoardView } from './BoardView'
import { GuessBoard } from './GuessBoard'
import { QuestionConsole } from './QuestionConsole'
import styles from './CooperativeMineGame.module.css'

export function CooperativeMineGame() {
  const game = useCooperativeMineGame()

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p>Cooperative deduction</p>
          <h1>Orapa Mine</h1>
          <span>
            {game.puzzle.title} - {game.puzzle.ruleset}
          </span>
        </div>
        <div className={styles.actions}>
          <button onClick={game.nextPuzzle} type="button">
            <Shuffle size={18} />
            <span>New</span>
          </button>
          <button
            onClick={() => game.setShowSolution(!game.showSolution)}
            type="button"
          >
            {game.showSolution ? <EyeOff size={18} /> : <Eye size={18} />}
            <span>{game.showSolution ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <QuestionConsole
          answers={game.answers}
          mode={game.questionMode}
          onAsk={game.askCurrentQuestion}
          onModeChange={game.setQuestionMode}
          onQueryChange={game.setQuery}
          query={game.query}
        />

        <div className={styles.minePanel}>
          <BoardView
            hidden={!game.showSolution}
            highlightedPath={game.highlightedPath}
            occupiedCells={game.showSolution ? game.solutionCells : []}
            title="Mine"
          />
        </div>

        <GuessBoard
          guess={game.guess}
          occupiedCells={game.guessCells}
          onPlace={game.placeGuessMineral}
          onRemove={game.removeGuess}
          onReset={game.resetGuess}
          onSubmit={game.submitGuess}
          result={game.submittedResult}
        />
      </section>
    </main>
  )
}
