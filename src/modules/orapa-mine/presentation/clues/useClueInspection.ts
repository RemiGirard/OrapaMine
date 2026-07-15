import { useCallback, useReducer } from 'react'
import { reverseEdgeAnswer } from '../../domain/questions'
import type { Answer, EdgeAnswer } from '../../domain/questions'

export type CluePreviewSource = 'focus' | 'pointer'

type ClueTarget = Readonly<{
  answerId: number
  query: string
}>

type SelectedClue = Readonly<{
  notebookHeadId: number | null
  target: ClueTarget
}>

type ClueInspectionState = Readonly<{
  focusTarget: ClueTarget | null
  pointerTarget: ClueTarget | null
  selectedClue: SelectedClue | null
}>

type ClueInspectionAction =
  | Readonly<{
      source: CluePreviewSource
      target: ClueTarget
      type: 'preview'
    }>
  | Readonly<{
      source: CluePreviewSource
      type: 'clear-preview'
    }>
  | Readonly<{
      notebookHeadId: number | null
      target: ClueTarget
      type: 'select'
    }>
  | Readonly<{ type: 'clear-selection' }>

const initialInspectionState: ClueInspectionState = {
  focusTarget: null,
  pointerTarget: null,
  selectedClue: null,
}

export function useClueInspection(answers: ReadonlyArray<Answer>) {
  const [state, dispatch] = useReducer(
    reduceClueInspection,
    initialInspectionState,
  )
  const notebookHeadId = answers[0]?.id ?? null
  const selectedTarget =
    state.selectedClue?.notebookHeadId === notebookHeadId
      ? state.selectedClue.target
      : null
  const activeTarget =
    state.pointerTarget ?? state.focusTarget ?? selectedTarget
  const activeAnswer = resolveEdgeAnswer(answers, activeTarget)

  const previewAnswer = useCallback(
    (answer: Answer, source: CluePreviewSource) => {
      if (answer.mode === 'edge') {
        dispatch({ source, target: toClueTarget(answer), type: 'preview' })
      }
    },
    [],
  )

  const clearPreview = useCallback((source: CluePreviewSource) => {
    dispatch({ source, type: 'clear-preview' })
  }, [])

  const selectAnswer = useCallback(
    (answer: EdgeAnswer) => {
      dispatch({
        notebookHeadId,
        target: toClueTarget(answer),
        type: 'select',
      })
    },
    [notebookHeadId],
  )

  const clearSelection = useCallback(() => {
    dispatch({ type: 'clear-selection' })
  }, [])

  return {
    activeAnswer,
    activeAnswerId: activeAnswer?.id ?? null,
    clearPreview,
    clearSelection,
    previewAnswer,
    selectAnswer,
  }
}

function reduceClueInspection(
  state: ClueInspectionState,
  action: ClueInspectionAction,
): ClueInspectionState {
  switch (action.type) {
    case 'preview':
      return action.source === 'pointer'
        ? { ...state, pointerTarget: action.target }
        : { ...state, focusTarget: action.target }
    case 'clear-preview':
      return action.source === 'pointer'
        ? { ...state, pointerTarget: null }
        : { ...state, focusTarget: null }
    case 'select':
      return {
        ...state,
        selectedClue: {
          notebookHeadId: action.notebookHeadId,
          target: action.target,
        },
      }
    case 'clear-selection':
      return { ...state, selectedClue: null }
  }
}

function resolveEdgeAnswer(
  answers: ReadonlyArray<Answer>,
  target: ClueTarget | null,
): EdgeAnswer | null {
  if (!target) {
    return null
  }

  const recordedAnswer = answers.find(
    (answer): answer is EdgeAnswer =>
      answer.id === target.answerId &&
      answer.mode === 'edge' &&
      (answer.query === target.query || answer.exitLabel === target.query),
  )

  if (!recordedAnswer) {
    return null
  }

  return recordedAnswer.query === target.query
    ? recordedAnswer
    : reverseEdgeAnswer(recordedAnswer)
}

function toClueTarget(answer: EdgeAnswer): ClueTarget {
  return { answerId: answer.id, query: answer.query }
}
