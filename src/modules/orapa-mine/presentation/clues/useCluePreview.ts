import { useState } from 'react'
import type { Answer } from '../../domain/questions'

export function useCluePreview(answers: ReadonlyArray<Answer>) {
  const [previewedAnswerId, setPreviewedAnswerId] = useState<number | null>(
    null,
  )
  const previewedAnswer =
    answers.find(
      (answer): answer is Extract<Answer, { mode: 'edge' }> =>
        answer.id === previewedAnswerId && answer.mode === 'edge',
    ) ?? null

  function previewAnswer(answer: Answer) {
    if (answer.mode === 'edge') {
      setPreviewedAnswerId(answer.id)
    }
  }

  function clearPreview() {
    setPreviewedAnswerId(null)
  }

  return {
    clearPreview,
    previewAnswer,
    previewedAnswer,
    previewedAnswerId,
  }
}
