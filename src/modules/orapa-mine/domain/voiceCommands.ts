import { parseEdgePort, parseGridCoordinate } from './coordinates'
import type { QuestionMode } from './questions'

export type VoiceQuestion = Readonly<{
  mode: QuestionMode
  query: string
}>

const numberWords: Readonly<Partial<Record<string, string>>> = {
  eight: '8',
  eighteen: '18',
  eleven: '11',
  fifteen: '15',
  five: '5',
  four: '4',
  fourteen: '14',
  nine: '9',
  nineteen: '19',
  one: '1',
  seven: '7',
  seventeen: '17',
  six: '6',
  sixteen: '16',
  ten: '10',
  thirteen: '13',
  three: '3',
  twelve: '12',
  two: '2',
}

const sideWords: Readonly<Partial<Record<string, string>>> = {
  b: 'B',
  bottom: 'B',
  l: 'L',
  left: 'L',
  r: 'R',
  right: 'R',
  t: 'T',
  top: 'T',
}

const fillerWords = new Set([
  'cell',
  'column',
  'edge',
  'line',
  'query',
  'ray',
  'row',
  'send',
])

export function parseVoiceQuestion(rawTranscript: string): VoiceQuestion | null {
  const tokens = rawTranscript
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !fillerWords.has(token))
    .map((token) => numberWords[token] ?? sideWords[token] ?? token.toUpperCase())

  const compact = tokens.join('')
  const spaced = tokens.join(' ')

  if (parseGridCoordinate(compact)) {
    return { mode: 'coordinate', query: compact }
  }

  if (parseGridCoordinate(spaced)) {
    return { mode: 'coordinate', query: spaced }
  }

  if (parseEdgePort(compact)) {
    return { mode: 'edge', query: compact }
  }

  if (parseEdgePort(spaced)) {
    return { mode: 'edge', query: spaced }
  }

  return null
}
