import { Eye, EyeOff, Shuffle } from 'lucide-react'
import styles from './CooperativeMineGame.module.css'
import { GameTable } from './GameTable'
import { useCooperativeMineGame } from './useCooperativeMineGame'
import { useVoiceCommandRecognition } from './useVoiceCommandRecognition'

export function CooperativeMineGame() {
  const game = useCooperativeMineGame()
  const voiceCommand = useVoiceCommandRecognition({
    onTranscript: game.clues.askVoiceQuestion,
  })

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>Orapa Mine</h1>
        <div className={styles.actions}>
          <button onClick={game.session.nextPuzzle} type="button">
            <Shuffle size={18} />
            <span>New</span>
          </button>
          <button
            onClick={() =>
              game.session.setShowSolution(!game.session.showSolution)
            }
            type="button"
          >
            {game.session.showSolution ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
            <span>{game.session.showSolution ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <GameTable
          clues={{
            answers: game.clues.answers,
            currentAnswer: game.clues.currentAnswer,
            edgeAnswers: game.clues.edgeAnswers,
            onAskEdge: game.clues.askEdge,
          }}
          familySolution={{
            guess: game.familySolution.guess,
            onFlip: game.familySolution.flipMineral,
            onPlace: game.familySolution.placeMineral,
            onRemove: game.familySolution.removeMineral,
            onReset: game.familySolution.reset,
            onRotate: game.familySolution.rotateMineral,
            onSelect: game.familySolution.selectMineral,
            onSubmit: game.familySolution.submit,
            result: game.familySolution.result,
            selectedMineralId: game.familySolution.selectedMineralId,
          }}
          light={{
            allRays: game.light.allRayPreviews,
            currentRay: game.light.currentRayPreview,
            onShowAllRaysChange: game.light.setShowAllRays,
            onShowCurrentRayChange: game.light.setShowCurrentRay,
            showAllRays: game.light.showAllRays,
            showCurrentRay: game.light.showCurrentRay,
          }}
          puzzle={{
            showSolution: game.session.showSolution,
            solutionPlacements: game.session.puzzle.placements,
          }}
          voice={{
            onStart: voiceCommand.startListening,
            status: voiceCommand.status,
          }}
        />
      </section>
    </main>
  )
}
