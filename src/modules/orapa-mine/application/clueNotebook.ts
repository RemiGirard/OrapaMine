import type { Puzzle } from '../domain/puzzles'
import {
  edgeAnswersShareConnection,
  edgeConnectionFrom,
  edgeConnectionRayFrom,
} from '../domain/edgeConnections'
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
  const isAlreadyRecorded = notebook.answers.some((recordedAnswer) =>
    answersRepresentSameClue(recordedAnswer, answer),
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

function answersRepresentSameClue(recorded: Answer, candidate: Answer) {
  if (recorded.mode !== candidate.mode) {
    return false
  }

  if (recorded.query === candidate.query) {
    return true
  }

  return (
    recorded.mode === 'edge' &&
    candidate.mode === 'edge' &&
    edgeAnswersShareConnection(recorded, candidate)
  )
}

export function knownEdgeClues(
  notebook: ClueNotebook,
): ReadonlyMap<string, Extract<Answer, { mode: 'edge' }>> {
  const cluesByPort = new Map<string, Extract<Answer, { mode: 'edge' }>>()

  for (const answer of notebook.answers) {
    if (answer.mode !== 'edge') {
      continue
    }

    const connection = edgeConnectionFrom(answer)

    if (!connection) {
      if (!cluesByPort.has(answer.query)) {
        cluesByPort.set(answer.query, answer)
      }
      continue
    }

    for (const port of [connection.firstPort, connection.secondPort]) {
      const ray = edgeConnectionRayFrom(connection, port)

      if (ray && !cluesByPort.has(port)) {
        cluesByPort.set(port, ray)
      }
    }
  }

  return cluesByPort
}
