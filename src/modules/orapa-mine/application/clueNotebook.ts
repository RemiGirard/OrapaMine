import type { Puzzle } from '../domain/puzzles'
import type { Answer, QuestionMode } from '../domain/questions'
import { answerQuestion } from '../domain/questions'

const notebookCapacity = 18

export type ClueNotebook = Readonly<{
  answers: ReadonlyArray<Answer>
}>

export type AskForClue = Readonly<{
  id: number
  mode: QuestionMode
  query: string
}>

export function createClueNotebook(): ClueNotebook {
  return { answers: [] }
}

export function askForClue(
  notebook: ClueNotebook,
  puzzle: Puzzle,
  request: AskForClue,
): ClueNotebook {
  const answer = answerQuestion(puzzle, request.mode, request.query, request.id)
  const isAlreadyRecorded = notebook.answers.some(
    (recordedAnswer) =>
      recordedAnswer.mode === answer.mode &&
      recordedAnswer.query === answer.query,
  )

  if (isAlreadyRecorded) {
    return notebook
  }

  return {
    answers: [answer, ...notebook.answers].slice(0, notebookCapacity),
  }
}

export function latestClue(notebook: ClueNotebook): Answer | null {
  return notebook.answers[0] ?? null
}

export function knownEdgeClues(
  notebook: ClueNotebook,
): ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>> {
  const cluesByEntry = new Map<string, Extract<Answer, { mode: 'edge' }>>()

  for (const answer of notebook.answers) {
    if (answer.mode === 'edge' && !cluesByEntry.has(answer.query)) {
      cluesByEntry.set(answer.query, answer)
    }
  }

  return cluesByEntry
}
