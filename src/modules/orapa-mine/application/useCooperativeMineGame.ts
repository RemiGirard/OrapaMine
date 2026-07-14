import { useMemo, useState } from 'react'
import type { QuestionMode } from '../domain/questions'
import { answerQuestion } from '../domain/questions'
import {
  compareGuess,
  createEmptyGuess,
  moveGuessMineral,
  preparedPuzzles,
  removeGuessMineral,
  toPlacedMinerals,
} from '../domain/puzzles'
import type { Coordinate } from '../domain/coordinates'
import type { MineralId } from '../domain/minerals'
import { getOccupiedCells } from '../domain/minerals'

export function useCooperativeMineGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [questionMode, setQuestionMode] = useState<QuestionMode>('edge')
  const [query, setQuery] = useState('')
  const [answers, setAnswers] = useState<
    Array<ReturnType<typeof answerQuestion>>
  >([])
  const [guess, setGuess] = useState(() => createEmptyGuess(preparedPuzzles[0]))
  const [submittedResult, setSubmittedResult] = useState<
    ReturnType<typeof compareGuess> | null
  >(null)

  const puzzle = preparedPuzzles[puzzleIndex]
  const solutionCells = useMemo(() => getOccupiedCells(puzzle.placements), [puzzle])
  const guessPlacements = useMemo(() => toPlacedMinerals(guess), [guess])
  const guessCells = useMemo(() => getOccupiedCells(guessPlacements), [guessPlacements])

  const lastAnswer = answers.length > 0 ? answers[0] : null
  const highlightedPath = useMemo(
    () =>
      new Set(
        lastAnswer
          ? lastAnswer.path.map((coordinate) => `${coordinate.column}:${coordinate.row}`)
          : [],
      ),
    [lastAnswer],
  )

  function askCurrentQuestion() {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return
    }

    const answer = answerQuestion(puzzle, questionMode, trimmedQuery, Date.now())
    setAnswers((currentAnswers) => [answer, ...currentAnswers].slice(0, 18))
    setQuery('')
  }

  function nextPuzzle() {
    const nextIndex = (puzzleIndex + 1) % preparedPuzzles.length
    setPuzzleIndex(nextIndex)
    setShowSolution(false)
    setQuestionMode('edge')
    setQuery('')
    setAnswers([])
    setGuess(createEmptyGuess(preparedPuzzles[nextIndex]))
    setSubmittedResult(null)
  }

  function resetGuess() {
    setGuess(createEmptyGuess(puzzle))
    setSubmittedResult(null)
  }

  function placeGuessMineral(mineralId: MineralId, origin: Coordinate) {
    setGuess((currentGuess) => moveGuessMineral(currentGuess, mineralId, origin))
    setSubmittedResult(null)
  }

  function removeGuess(mineralId: MineralId) {
    setGuess((currentGuess) => removeGuessMineral(currentGuess, mineralId))
    setSubmittedResult(null)
  }

  function submitGuess() {
    setSubmittedResult(compareGuess(puzzle, guess))
  }

  return {
    answers,
    askCurrentQuestion,
    guess,
    guessCells,
    highlightedPath,
    lastAnswer,
    nextPuzzle,
    placeGuessMineral,
    puzzle,
    query,
    questionMode,
    removeGuess,
    resetGuess,
    setQuery,
    setQuestionMode,
    setShowSolution,
    showSolution,
    solutionCells,
    submitGuess,
    submittedResult,
  }
}
