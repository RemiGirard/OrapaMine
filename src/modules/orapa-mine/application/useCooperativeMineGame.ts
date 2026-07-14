import { useMemo, useState } from 'react'
import { answerEdgeForPlacements, answerQuestion } from '../domain/questions'
import type { QuestionMode } from '../domain/questions'
import type { Coordinate } from '../domain/coordinates'
import {
  compareGuess,
  createEmptyGuess,
  flipGuessMineral,
  moveGuessMineral,
  preparedPuzzles,
  removeGuessMineral,
  rotateGuessMineral,
  toPlacedMinerals,
} from '../domain/puzzles'
import type { MineralId } from '../domain/minerals'
import { getOccupiedCells } from '../domain/minerals'
import { parseVoiceQuestion } from '../domain/voiceCommands'

export function useCooperativeMineGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [showLightPath, setShowLightPath] = useState(true)
  const [answers, setAnswers] = useState<
    Array<ReturnType<typeof answerQuestion>>
  >([])
  const [guess, setGuess] = useState(() => createEmptyGuess(preparedPuzzles[0]))
  const [selectedMineralId, setSelectedMineralId] = useState<MineralId>(
    preparedPuzzles[0].placements[0].mineralId,
  )
  const [submittedResult, setSubmittedResult] = useState<ReturnType<
    typeof compareGuess
  > | null>(null)

  const puzzle = preparedPuzzles[puzzleIndex]
  const solutionCells = useMemo(
    () => getOccupiedCells(puzzle.placements),
    [puzzle],
  )
  const guessPlacements = useMemo(() => toPlacedMinerals(guess), [guess])
  const guessCells = useMemo(
    () => getOccupiedCells(guessPlacements),
    [guessPlacements],
  )

  const lastAnswer = answers.length > 0 ? answers[0] : null
  const edgeAnswers = useMemo(() => {
    const answersByEdge = new Map<string, ReturnType<typeof answerQuestion>>()

    for (const answer of answers) {
      if (answer.mode === 'edge' && !answersByEdge.has(answer.query)) {
        answersByEdge.set(answer.query, answer)
      }
    }

    return answersByEdge
  }, [answers])
  const currentRayPreview = useMemo(
    () =>
      lastAnswer?.mode === 'edge'
        ? answerEdgeForPlacements(
            guessPlacements,
            lastAnswer.query,
            -lastAnswer.id,
          )
        : null,
    [guessPlacements, lastAnswer],
  )
  function askQuestion(mode: QuestionMode, questionQuery: string) {
    const answer = answerQuestion(puzzle, mode, questionQuery, Date.now())

    setAnswers((currentAnswers) => [answer, ...currentAnswers].slice(0, 18))
  }

  function askEdge(edgeLabel: string) {
    askQuestion('edge', edgeLabel)
  }

  function askVoiceQuestion(transcript: string) {
    const voiceQuestion = parseVoiceQuestion(transcript)

    if (!voiceQuestion) {
      return
    }

    askQuestion(voiceQuestion.mode, voiceQuestion.query)
  }

  function nextPuzzle() {
    const nextIndex = (puzzleIndex + 1) % preparedPuzzles.length
    setPuzzleIndex(nextIndex)
    setShowSolution(false)
    setShowLightPath(true)
    setAnswers([])
    setGuess(createEmptyGuess(preparedPuzzles[nextIndex]))
    setSelectedMineralId(preparedPuzzles[nextIndex].placements[0].mineralId)
    setSubmittedResult(null)
  }

  function resetGuess() {
    setGuess(createEmptyGuess(puzzle))
    setSelectedMineralId(puzzle.placements[0].mineralId)
    setSubmittedResult(null)
  }

  function placeGuessMineral(mineralId: MineralId, origin: Coordinate) {
    setGuess((currentGuess) =>
      moveGuessMineral(currentGuess, mineralId, origin),
    )
    setSelectedMineralId(mineralId)
    setSubmittedResult(null)
  }

  function selectGuessMineral(mineralId: MineralId) {
    setSelectedMineralId(mineralId)
  }

  function rotateGuess(mineralId: MineralId) {
    setGuess((currentGuess) => rotateGuessMineral(currentGuess, mineralId))
    setSelectedMineralId(mineralId)
    setSubmittedResult(null)
  }

  function flipGuess(mineralId: MineralId) {
    setGuess((currentGuess) => flipGuessMineral(currentGuess, mineralId))
    setSelectedMineralId(mineralId)
    setSubmittedResult(null)
  }

  function removeGuess(mineralId: MineralId) {
    setGuess((currentGuess) => removeGuessMineral(currentGuess, mineralId))
    setSelectedMineralId(mineralId)
    setSubmittedResult(null)
  }

  function submitGuess() {
    setSubmittedResult(compareGuess(puzzle, guess))
  }

  return {
    answers,
    askEdge,
    askVoiceQuestion,
    edgeAnswers,
    flipGuess,
    guess,
    guessCells,
    lastAnswer,
    currentRayPreview,
    nextPuzzle,
    placeGuessMineral,
    puzzle,
    removeGuess,
    resetGuess,
    rotateGuess,
    selectGuessMineral,
    selectedMineralId,
    setShowLightPath,
    setShowSolution,
    showLightPath,
    showSolution,
    solutionCells,
    submitGuess,
    submittedResult,
  }
}
