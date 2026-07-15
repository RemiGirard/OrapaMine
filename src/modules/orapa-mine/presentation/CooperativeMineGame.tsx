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
      <div aria-hidden="true" className={styles.ambientLight}>
        <span className={styles.aquaBeam} />
        <span className={styles.goldBeam} />
        <span className={styles.violetBeam} />
      </div>

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
            onNext: game.session.nextPuzzle,
            onToggleSolution: () =>
              game.session.setShowSolution(!game.session.showSolution),
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
