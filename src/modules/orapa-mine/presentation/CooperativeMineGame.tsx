import { useEffect, useState } from 'react'
import type { GameDifficulty } from '../domain/gameConfiguration'
import styles from './CooperativeMineGame.module.css'
import { GameTable } from './GameTable'
import { ExperimentSetup } from './session/ExperimentSetup'
import { VictoryScreen } from './session/VictoryScreen'
import { useCooperativeMineGame } from './useCooperativeMineGame'
import { useVoiceCommandRecognition } from './useVoiceCommandRecognition'

export function CooperativeMineGame() {
  const [isClientReady, setIsClientReady] = useState(false)
  const [screen, setScreen] = useState<'setup' | 'game'>('setup')
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<GameDifficulty>('classic')
  const game = useCooperativeMineGame()
  const voiceCommand = useVoiceCommandRecognition({
    onTranscript: game.clues.askVoiceQuestion,
  })

  useEffect(() => {
    setIsClientReady(true)
  }, [])

  const solved = game.familySolution.result?.solved === true
  const activeScreen =
    screen === 'setup' ? 'setup' : solved ? 'victory' : 'game'

  function startSelectedExperiment() {
    game.session.start(selectedDifficulty)
    setScreen('game')
  }

  function runExperimentAgain() {
    game.session.start(game.session.difficulty)
  }

  return (
    <main
      className={styles.shell}
      data-client-ready={isClientReady}
      data-game-screen={activeScreen}
      data-testid="orapa-game"
    >
      <div aria-hidden="true" className={styles.ambientLight}>
        <span className={styles.aquaBeam} />
        <span className={styles.goldBeam} />
        <span className={styles.violetBeam} />
      </div>

      <section className={styles.layout}>
        {screen === 'setup' ? (
          <ExperimentSetup
            onSelect={setSelectedDifficulty}
            onStart={startSelectedExperiment}
            selectedDifficulty={selectedDifficulty}
          />
        ) : solved ? (
          <VictoryScreen
            clueCount={game.clues.answers.length}
            difficulty={game.session.difficulty}
            onConfigure={() => {
              setSelectedDifficulty(game.session.difficulty)
              setScreen('setup')
            }}
            onRunAgain={runExperimentAgain}
            specimenCount={game.session.puzzle.placements.length}
          />
        ) : (
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
              readiness: game.familySolution.readiness,
              result: game.familySolution.result,
              selectedMineralId: game.familySolution.selectedMineralId,
            }}
            light={{
              currentRay: game.light.currentRayPreview,
              onShowAllRaysChange: game.light.setShowAllRays,
              onShowCurrentRayChange: game.light.setShowCurrentRay,
              raysByPort: game.light.rayPreviewsByPort,
              showAllRays: game.light.showAllRays,
              showCurrentRay: game.light.showCurrentRay,
            }}
            puzzle={{
              onNext: () => {
                setSelectedDifficulty(game.session.difficulty)
                setScreen('setup')
              },
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
        )}
      </section>
    </main>
  )
}
