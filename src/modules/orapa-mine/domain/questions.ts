import {
  edgeLabels,
  formatGridCoordinate,
  parseEdgePort,
  parseGridCoordinate,
} from './coordinates'
import type { SignalColor } from './colors'
import { gemColorLabels, signalColorLabels } from './colors'
import type { Puzzle } from './puzzles'
import type { MineralPlacement } from './minerals'
import { findOccupant } from './minerals'
import { traceWave } from './waves'

export type QuestionMode = 'edge' | 'coordinate'

export type Answer =
  | Readonly<{
      id: number
      mode: 'edge'
      query: string
      message: string
      colorContacts: ReturnType<typeof traceWave>['colorContacts']
      signalColor: SignalColor | 'absorbed'
      path: ReturnType<typeof traceWave>['path']
      exitLabel?: string
    }>
  | Readonly<{
      id: number
      mode: 'coordinate'
      query: string
      message: string
      signalColor: SignalColor | 'absorbed'
      path: ReturnType<typeof traceWave>['path']
    }>

export type EdgeAnswer = Extract<Answer, { mode: 'edge' }>

export function edgeAnswersMatch(
  expected: EdgeAnswer,
  candidate: EdgeAnswer,
): boolean {
  return (
    expected.query === candidate.query &&
    expected.exitLabel === candidate.exitLabel &&
    expected.signalColor === candidate.signalColor
  )
}

export function reverseEdgeAnswer(answer: EdgeAnswer): EdgeAnswer {
  if (!answer.exitLabel) {
    return answer
  }

  return {
    ...answer,
    colorContacts: [...answer.colorContacts].reverse().map((contact) => ({
      ...contact,
      pathIndex: answer.path.length - contact.pathIndex - 1,
    })),
    exitLabel: answer.query,
    message:
      answer.signalColor === 'absorbed'
        ? answer.message
        : `Exit ${answer.query} - ${signalColorLabels[answer.signalColor]}`,
    path: [...answer.path].reverse(),
    query: answer.exitLabel,
  }
}

export function answerQuestion(
  puzzle: Puzzle,
  mode: QuestionMode,
  rawQuery: string,
  id: number,
): Answer {
  if (mode === 'coordinate') {
    return answerCoordinateQuestion(puzzle, rawQuery, id)
  }

  return answerEdgeQuestion(puzzle, rawQuery, id)
}

function answerEdgeQuestion(
  puzzle: Puzzle,
  rawQuery: string,
  id: number,
): Answer {
  const edgePort = parseEdgePort(rawQuery)

  if (!edgePort) {
    return {
      id,
      mode: 'edge',
      query: rawQuery,
      message: 'Unknown edge',
      colorContacts: [],
      signalColor: 'transparent',
      path: [],
    }
  }

  return answerEdgeForPlacements(puzzle.placements, rawQuery, id)
}

export function answerEdgeForPlacements(
  placements: ReadonlyArray<MineralPlacement>,
  rawQuery: string,
  id: number,
): EdgeAnswer {
  const edgePort = parseEdgePort(rawQuery)

  if (!edgePort) {
    return {
      id,
      mode: 'edge',
      query: rawQuery,
      message: 'Unknown edge',
      colorContacts: [],
      signalColor: 'transparent',
      path: [],
    }
  }

  const trace = traceWave(placements, edgePort)

  if (trace.kind === 'absorbed') {
    return {
      id,
      mode: 'edge',
      query: trace.entryLabel,
      message: 'Signal absorbed',
      colorContacts: trace.colorContacts,
      signalColor: 'absorbed',
      path: trace.path,
    }
  }

  if (trace.kind === 'loop') {
    return {
      id,
      mode: 'edge',
      query: trace.entryLabel,
      message: `Loop - ${signalColorLabels[trace.signalColor]}`,
      colorContacts: trace.colorContacts,
      signalColor: trace.signalColor,
      path: trace.path,
    }
  }

  return {
    id,
    mode: 'edge',
    query: trace.entryLabel,
    exitLabel: trace.exitLabel,
    message: `Exit ${trace.exitLabel} - ${signalColorLabels[trace.signalColor]}`,
    colorContacts: trace.colorContacts,
    signalColor: trace.signalColor,
    path: trace.path,
  }
}

export function answerAllEdgesForPlacements(
  placements: ReadonlyArray<MineralPlacement>,
): ReadonlyArray<EdgeAnswer> {
  return edgeLabels.map((edgeLabel, index) =>
    answerEdgeForPlacements(placements, edgeLabel, -(index + 1)),
  )
}

function answerCoordinateQuestion(
  puzzle: Puzzle,
  rawQuery: string,
  id: number,
): Answer {
  const coordinate = parseGridCoordinate(rawQuery)

  if (!coordinate) {
    return {
      id,
      mode: 'coordinate',
      query: rawQuery,
      message: 'Unknown coordinate',
      signalColor: 'transparent',
      path: [],
    }
  }

  const occupant = findOccupant(puzzle.placements, coordinate)

  if (!occupant) {
    return {
      id,
      mode: 'coordinate',
      query: formatGridCoordinate(coordinate),
      message: 'Nothing',
      signalColor: 'transparent',
      path: [coordinate],
    }
  }

  if (occupant.mineral.color === 'black') {
    return {
      id,
      mode: 'coordinate',
      query: formatGridCoordinate(coordinate),
      message: 'Signal absorbed',
      signalColor: 'absorbed',
      path: [coordinate],
    }
  }

  return {
    id,
    mode: 'coordinate',
    query: formatGridCoordinate(coordinate),
    message: `${gemColorLabels[occupant.mineral.color]} gem`,
    signalColor:
      occupant.mineral.color === 'transparent'
        ? 'transparent'
        : occupant.mineral.color,
    path: [coordinate],
  }
}
