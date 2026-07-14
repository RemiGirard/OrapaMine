import type { GemColor, SignalColor } from '../domain/colors'

export type DisplayColor = GemColor | SignalColor | 'absorbed'

const displayColors: Record<DisplayColor, string> = {
  red: '#ef4f4a',
  yellow: '#f5c84b',
  blue: '#3277d2',
  white: '#ffffff',
  transparent: '#c9edf3',
  black: '#20282d',
  orange: '#f47f2d',
  purple: '#7d2ea7',
  green: '#55bb45',
  pink: '#f37b9c',
  lemon: '#f7e878',
  'sky-blue': '#8ed0ed',
  'light-orange': '#f7aa78',
  'light-purple': '#b75cc8',
  'light-green': '#c8ec55',
  gray: '#60676e',
  absorbed: '#111517',
}

export function colorValue(color: DisplayColor) {
  return displayColors[color]
}
