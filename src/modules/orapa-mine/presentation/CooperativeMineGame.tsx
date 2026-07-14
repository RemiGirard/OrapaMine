import { Eye, EyeOff, Shuffle } from 'lucide-react'
import { useCooperativeMineGame } from '../application/useCooperativeMineGame'
import { GuessBoard } from './GuessBoard'
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
        <GuessBoard
          answers={game.answers}
          currentAnswer={game.lastAnswer}
          currentRayPreview={game.currentRayPreview}
          edgeAnswers={game.edgeAnswers}
          guess={game.guess}
          onAskEdge={game.askEdge}
          onPlaceSelected={game.placeSelectedMineral}
          onPlace={game.placeGuessMineral}
          onRemove={game.removeGuess}
          onReset={game.resetGuess}
          onRotate={game.rotateGuess}
          onSelect={game.selectGuessMineral}
          onSubmit={game.submitGuess}
          onToggleLightPath={game.setShowLightPath}
          onVoiceCommand={game.askVoiceQuestion}
          result={game.submittedResult}
          selectedMineralId={game.selectedMineralId}
          showLightPath={game.showLightPath}
          showSolution={game.showSolution}
          solutionPlacements={game.puzzle.placements}
        />
      </section>
    </main>
  )
}
