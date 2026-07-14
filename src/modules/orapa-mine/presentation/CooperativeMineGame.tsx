import { Eye, EyeOff, Shuffle } from 'lucide-react'
import { useCooperativeMineGame } from '../application/useCooperativeMineGame'
import { GuessBoard } from './GuessBoard'
import styles from './CooperativeMineGame.module.css'
import { useVoiceCommandRecognition } from './useVoiceCommandRecognition'

export function CooperativeMineGame() {
  const game = useCooperativeMineGame()
  const voiceCommand = useVoiceCommandRecognition({
    onTranscript: game.askVoiceQuestion,
  })

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Orapa Mine</h1>
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
          onStartVoiceCommand={voiceCommand.startListening}
          onSubmit={game.submitGuess}
          onToggleLightPath={game.setShowLightPath}
          result={game.submittedResult}
          selectedMineralId={game.selectedMineralId}
          showLightPath={game.showLightPath}
          showSolution={game.showSolution}
          solutionPlacements={game.puzzle.placements}
          voiceStatus={voiceCommand.status}
        />
      </section>
    </main>
  )
}
