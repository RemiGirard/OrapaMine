import { useCallback, useMemo, useReducer } from 'react'
import {
  createCooperativeGame,
  reduceCooperativeGame,
} from '../application/cooperativeGame'
import { createCooperativeGameView } from '../application/gameView'
import type { Coordinate } from '../domain/coordinates'
import type { MineralId } from '../domain/minerals'
import type { QuestionMode } from '../domain/questions'
import { parseVoiceQuestion } from '../domain/voiceCommands'

export function useCooperativeMineGame() {
  const [game, dispatch] = useReducer(
    reduceCooperativeGame,
    undefined,
    createCooperativeGame,
  )
  const view = useMemo(() => createCooperativeGameView(game), [game])

  const askQuestion = useCallback((mode: QuestionMode, query: string) => {
    dispatch({ id: Date.now(), mode, query, type: 'ask-clue' })
  }, [])

  const askEdge = useCallback(
    (edgeLabel: string) => askQuestion('edge', edgeLabel),
    [askQuestion],
  )

  const askVoiceQuestion = useCallback(
    (transcript: string) => {
      const question = parseVoiceQuestion(transcript)

      if (question) {
        askQuestion(question.mode, question.query)
      }
    },
    [askQuestion],
  )

  const placeMineral = useCallback(
    (mineralId: MineralId, origin: Coordinate) => {
      dispatch({ mineralId, origin, type: 'place-family-mineral' })
    },
    [],
  )

  const dispatchMineral = useCallback(
    (
      type:
        | 'select-family-mineral'
        | 'rotate-family-mineral'
        | 'flip-family-mineral'
        | 'return-family-mineral',
      mineralId: MineralId,
    ) => dispatch({ mineralId, type }),
    [],
  )

  return {
    clues: {
      answers: game.clueNotebook.answers,
      askEdge,
      askVoiceQuestion,
      currentAnswer: view.currentAnswer,
      edgeAnswers: view.edgeAnswers,
    },
    familySolution: {
      flipMineral: (mineralId: MineralId) =>
        dispatchMineral('flip-family-mineral', mineralId),
      guess: game.familySolution.guess,
      placeMineral,
      removeMineral: (mineralId: MineralId) =>
        dispatchMineral('return-family-mineral', mineralId),
      reset: () => dispatch({ type: 'reset-family-solution' }),
      readiness: view.submissionReadiness,
      result: game.familySolution.submittedResult,
      rotateMineral: (mineralId: MineralId) =>
        dispatchMineral('rotate-family-mineral', mineralId),
      selectMineral: (mineralId: MineralId) =>
        dispatchMineral('select-family-mineral', mineralId),
      selectedMineralId: game.familySolution.selectedMineralId,
      submit: () => dispatch({ type: 'submit-family-solution' }),
    },
    light: {
      currentRayPreview: view.currentRayPreview,
      rayPreviewsByPort: view.rayPreviewsByPort,
      setShowAllRays: (visible: boolean) =>
        dispatch({ type: 'set-all-rays-visible', visible }),
      setShowCurrentRay: (visible: boolean) =>
        dispatch({ type: 'set-current-ray-visible', visible }),
      showAllRays: game.lightDisplay.showAllRays,
      showCurrentRay: game.lightDisplay.showCurrentRay,
    },
    session: {
      nextPuzzle: () => dispatch({ type: 'next-puzzle' }),
      puzzle: view.puzzle,
      setShowSolution: (visible: boolean) =>
        dispatch({ type: 'set-solution-visible', visible }),
      showSolution: game.showSolution,
    },
  }
}
