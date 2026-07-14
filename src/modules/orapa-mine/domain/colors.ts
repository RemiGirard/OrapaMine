export type GemColor = 'red' | 'yellow' | 'blue' | 'white' | 'transparent' | 'black'

export type ColorContact = Exclude<GemColor, 'transparent' | 'black'>

export type SignalColor =
  | 'transparent'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'white'
  | 'orange'
  | 'purple'
  | 'green'
  | 'pink'
  | 'lemon'
  | 'sky-blue'
  | 'light-orange'
  | 'light-purple'
  | 'light-green'
  | 'black'
  | 'gray'

export const gemColorLabels: Record<GemColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  blue: 'Blue',
  white: 'White',
  transparent: 'Transparent',
  black: 'Black',
}

export const signalColorLabels: Record<SignalColor, string> = {
  transparent: 'Transparent',
  red: 'Red',
  yellow: 'Yellow',
  blue: 'Blue',
  white: 'White',
  orange: 'Orange',
  purple: 'Purple',
  green: 'Green',
  pink: 'Pink',
  lemon: 'Lemon',
  'sky-blue': 'Sky blue',
  'light-orange': 'Light orange',
  'light-purple': 'Light purple',
  'light-green': 'Light green',
  black: 'Black',
  gray: 'Gray',
}

const contactOrder: Array<ColorContact> = ['red', 'yellow', 'blue', 'white']

const colorMixes: Record<string, SignalColor> = {
  red: 'red',
  yellow: 'yellow',
  blue: 'blue',
  white: 'white',
  'red-yellow': 'orange',
  'red-blue': 'purple',
  'yellow-blue': 'green',
  'red-white': 'pink',
  'yellow-white': 'lemon',
  'blue-white': 'sky-blue',
  'red-yellow-white': 'light-orange',
  'red-blue-white': 'light-purple',
  'yellow-blue-white': 'light-green',
  'red-yellow-blue': 'black',
  'red-yellow-blue-white': 'gray',
}

export function mixSignalColor(contacts: ReadonlySet<ColorContact>): SignalColor {
  if (contacts.size === 0) {
    return 'transparent'
  }

  const key = contactOrder.filter((color) => contacts.has(color)).join('-')

  return colorMixes[key] ?? 'transparent'
}
