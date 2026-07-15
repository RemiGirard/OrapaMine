import type { SignalColor } from './colors'
import type { EdgeAnswer } from './questions'
import { reverseEdgeAnswer } from './questions'

export type ReversibleEdgeAnswer = EdgeAnswer &
  Readonly<{ exitLabel: string; signalColor: SignalColor }>

export type EdgeConnection = Readonly<{
  firstPort: string
  key: string
  rayFromFirstPort: ReversibleEdgeAnswer
  rayFromSecondPort: ReversibleEdgeAnswer
  secondPort: string
  signalColor: ReversibleEdgeAnswer['signalColor']
}>

export function isReversibleEdgeAnswer(
  answer: EdgeAnswer,
): answer is ReversibleEdgeAnswer {
  return Boolean(answer.exitLabel) && answer.signalColor !== 'absorbed'
}

export function edgeConnectionFrom(answer: EdgeAnswer): EdgeConnection | null {
  if (!isReversibleEdgeAnswer(answer)) {
    return null
  }

  const forward = answer
  const reverse = reverseEdgeAnswer(forward) as ReversibleEdgeAnswer
  const firstIsForward = forward.query.localeCompare(forward.exitLabel) <= 0
  const rayFromFirstPort = firstIsForward ? forward : reverse
  const rayFromSecondPort = firstIsForward ? reverse : forward

  return {
    firstPort: rayFromFirstPort.query,
    key: `${rayFromFirstPort.query}::${rayFromSecondPort.query}`,
    rayFromFirstPort,
    rayFromSecondPort,
    secondPort: rayFromSecondPort.query,
    signalColor: forward.signalColor,
  }
}

export function edgeConnectionsFrom(
  answers: Iterable<EdgeAnswer>,
): ReadonlyArray<EdgeConnection> {
  const connections = new Map<string, EdgeConnection>()

  for (const answer of answers) {
    const connection = edgeConnectionFrom(answer)

    if (connection && !connections.has(connection.key)) {
      connections.set(connection.key, connection)
    }
  }

  return [...connections.values()]
}

export function edgeConnectionRayFrom(
  connection: EdgeConnection,
  inputPort: string,
): ReversibleEdgeAnswer | null {
  if (inputPort === connection.firstPort) {
    return connection.rayFromFirstPort
  }

  if (inputPort === connection.secondPort) {
    return connection.rayFromSecondPort
  }

  return null
}

export function edgeConnectionOtherPort(
  connection: EdgeConnection,
  port: string,
): string | null {
  if (port === connection.firstPort) {
    return connection.secondPort
  }

  if (port === connection.secondPort) {
    return connection.firstPort
  }

  return null
}

export function edgeAnswersShareConnection(
  first: EdgeAnswer,
  second: EdgeAnswer,
) {
  const firstConnection = edgeConnectionFrom(first)
  const secondConnection = edgeConnectionFrom(second)

  return (
    firstConnection !== null &&
    secondConnection !== null &&
    firstConnection.key === secondConnection.key &&
    firstConnection.signalColor === secondConnection.signalColor
  )
}
