import { useState } from 'react'
import { reverseEdgeAnswer } from '../../domain/questions'
import type { Answer } from '../../domain/questions'

export function useCluePreview(answers: ReadonlyArray<Answer>) {
  const [preview, setPreview] = useState<{
    answerId: number
    query: string
  } | null>(null)
  const recordedAnswer = answers.find(
    (answer): answer is Extract<Answer, { mode: 'edge' }> =>
      answer.id === preview?.answerId && answer.mode === 'edge',
  )
  const previewedAnswer = recordedAnswer
    ? recordedAnswer.query === preview?.query
      ? recordedAnswer
      : reverseEdgeAnswer(recordedAnswer)
    : null

  function previewAnswer(answer: Answer) {
    if (answer.mode === 'edge') {
      setPreview({ answerId: answer.id, query: answer.query })
    }
  }

  function clearPreview() {
    setPreview(null)
  }

  return {
    clearPreview,
    previewAnswer,
    previewedAnswer,
    previewedAnswerId: preview?.answerId ?? null,
  }
}
